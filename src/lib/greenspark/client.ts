// Greenspark API Client for Environmental Impact Verification (Task M-02)
//
// Production rules that differ from the original implementation:
// - No fabricated success. If Greenspark cannot be verified after retries,
//   this returns success: false with transactionId / certificateUrl null.
//   Callers must record the order as "pending" and must NOT present the
//   impact as verified. This matters for Bill C-59: unverified impact
//   must never be displayed as a verified Greenspark transaction.
// - The development mock fallback is dev-only. It runs only when no real
//   API key is configured AND NODE_ENV is not "production".
// - Every attempt for the same order reuses the same Idempotency-Key
//   (`greenspark-<orderId>`), so a retry after a timeout does not create
//   a second Greenspark purchase.
// - Only network errors, timeouts, HTTP 429, and HTTP 5xx are retried.
//   Other 4xx responses are returned as failures immediately, because
//   retrying them will not change the outcome.

export interface TriggerImpactParams {
  orderId: string;
  customerEmail: string;
  trees: number;
  plasticBottles: number;
  carbonKg: number;
}

export interface GreensparkImpactResponse {
  success: boolean;
  transactionId: string | null;
  certificateUrl: string | null;
  treesFunded: number;
  plasticBottlesRescued: number;
  carbonKgOffset: number;
  verifiedAt: string | null;
  attempts: number;
  isMock: boolean;
  error?: string;
}

export class GreensparkError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, opts?: { status?: number; retryable?: boolean }) {
    super(message);
    this.name = 'GreensparkError';
    this.status = opts?.status;
    this.retryable = opts?.retryable ?? false;
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getGreensparkConfig() {
  return {
    apiKey: process.env.GREENSPARK_API_KEY,
    baseUrl:
      process.env.GREENSPARK_API_BASE_URL || 'https://api.getgreenspark.com',
    maxAttempts: Math.min(
      10,
      parsePositiveInt(process.env.GREENSPARK_MAX_ATTEMPTS, 4)
    ),
    baseDelayMs: parsePositiveInt(
      process.env.GREENSPARK_RETRY_BASE_DELAY_MS,
      1000
    ),
    timeoutMs: parsePositiveInt(process.env.GREENSPARK_TIMEOUT_MS, 10000),
    isProduction: process.env.NODE_ENV === 'production',
  };
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelayMs(attempt: number, baseDelayMs: number): number {
  // Exponential backoff with a small jitter so concurrent retries do not
  // all hit Greenspark at the same instant. Attempt is 1-based.
  const exponential = baseDelayMs * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return exponential + jitter;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function recordGreensparkImpact(
  params: TriggerImpactParams
): Promise<GreensparkImpactResponse> {
  const config = getGreensparkConfig();
  const apiKey = config.apiKey;
  const hasRealKey = Boolean(apiKey) && !apiKey!.includes('placeholder');

  // Development-only mock. Never fabricate a transaction in production.
  if (!hasRealKey) {
    if (config.isProduction) {
      return {
        success: false,
        transactionId: null,
        certificateUrl: null,
        treesFunded: params.trees,
        plasticBottlesRescued: params.plasticBottles,
        carbonKgOffset: params.carbonKg,
        verifiedAt: null,
        attempts: 0,
        isMock: false,
        error: 'GREENSPARK_API_KEY is not configured.',
      };
    }

    const mockTxId = `gpk_${params.orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}_${Date.now().toString(36)}`;
    return {
      success: true,
      transactionId: mockTxId,
      certificateUrl: `https://ledger.getgreenspark.com/ecoesse/${mockTxId}`,
      treesFunded: params.trees,
      plasticBottlesRescued: params.plasticBottles,
      carbonKgOffset: params.carbonKg,
      verifiedAt: new Date().toISOString(),
      attempts: 0,
      isMock: true,
    };
  }

  const idempotencyKey = `greenspark-${params.orderId}`;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl.replace(/\/$/, '')}/v1/purchases`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            external_id: params.orderId,
            customer_email: params.customerEmail,
            impact: {
              trees: params.trees,
              plastic_bottles: params.plasticBottles,
              carbon_offset_kg: params.carbonKg,
            },
          }),
        },
        config.timeoutMs
      );

      if (response.ok) {
        const data: any = await response.json().catch(() => ({}));
        const transactionId: string | null =
          data?.id ??
          data?.transaction_id ??
          data?.transactionId ??
          data?.greenspark_transaction_id ??
          null;

        if (!transactionId) {
          throw new GreensparkError(
            'Greenspark response was successful but contained no transaction id.',
            { status: response.status, retryable: true }
          );
        }

        const certificateUrl: string | null =
          data?.certificate_url ??
          data?.certificateUrl ??
          data?.ledger_url ??
          data?.url ??
          `https://ledger.getgreenspark.com/impact/${transactionId}`;

        return {
          success: true,
          transactionId,
          certificateUrl,
          treesFunded: params.trees,
          plasticBottlesRescued: params.plasticBottles,
          carbonKgOffset: params.carbonKg,
          verifiedAt: new Date().toISOString(),
          attempts: attempt,
          isMock: false,
        };
      }

      // Non-2xx: read a truncated body for diagnostics, never the API key.
      const bodyText = await response.text().catch(() => '');
      lastError = `Greenspark API returned HTTP ${response.status}${bodyText ? `: ${bodyText.slice(0, 500)}` : ''}`;

      if (!isRetryableStatus(response.status)) {
        return {
          success: false,
          transactionId: null,
          certificateUrl: null,
          treesFunded: params.trees,
          plasticBottlesRescued: params.plasticBottles,
          carbonKgOffset: params.carbonKg,
          verifiedAt: null,
          attempts: attempt,
          isMock: false,
          error: lastError,
        };
      }
      // Otherwise fall through to the retry delay below.
    } catch (err: any) {
      if (err instanceof GreensparkError) {
        lastError = err.message;
        if (!err.retryable) {
          break;
        }
      } else if (err?.name === 'AbortError') {
        lastError = `Greenspark API request timed out after ${config.timeoutMs}ms.`;
      } else {
        lastError = err?.message || 'Greenspark API request failed.';
      }
    }

    if (attempt < config.maxAttempts) {
      await sleep(backoffDelayMs(attempt, config.baseDelayMs));
    }
  }

  return {
    success: false,
    transactionId: null,
    certificateUrl: null,
    treesFunded: params.trees,
    plasticBottlesRescued: params.plasticBottles,
    carbonKgOffset: params.carbonKg,
    verifiedAt: null,
    attempts: config.maxAttempts,
    isMock: false,
    error: lastError || 'Greenspark API request failed after retries.',
  };
}
