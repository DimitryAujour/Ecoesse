// Greenspark incoming-webhook verification (Task M-02)
//
// IMPORTANT — format not yet verified against Greenspark:
// No Greenspark webhook payload format, header name, or signing secret
// was documented in this repository, and no official Greenspark webhook
// specification could be verified from public documentation at the time
// this code was written. The code below therefore uses the industry-standard
// HMAC-SHA256-over-raw-body pattern, fails closed, and is disabled until
// GREENSPARK_WEBHOOK_SECRET is set.
//
// Before enabling it in production, confirm in the Greenspark dashboard:
//   1. The exact signature header name (this code accepts
//      `x-greenspark-signature`, `greenspark-signature`, and `x-signature`).
//   2. Whether the signature is plain hex or prefixed with `sha256=`.
//      Both are accepted here.
//   3. The exact payload field names for the order reference and the
//      transaction id. `parseGreensparkWebhookEvent` tries the common
//      variants (external_id / order_id, id / transaction_id, etc.).
// If Greenspark's actual format differs, update this file — do not weaken
// verification to make an unverified payload pass.

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface GreensparkWebhookEvent {
  orderId: string;
  transactionId: string | null;
  certificateUrl: string | null;
  status?: string;
}

/**
 * Verify an HMAC-SHA256 signature over the exact raw request body.
 * Uses a timing-safe comparison. Returns false for a missing secret,
 * a missing signature, or a malformed (non-hex / wrong-length) signature.
 */
export function verifyGreensparkWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined
): boolean {
  if (!secret || !signatureHeader) {
    return false;
  }

  const received = signatureHeader.trim().toLowerCase().replace(/^sha256=/, '');
  if (!/^[0-9a-f]{64}$/.test(received)) {
    return false;
  }

  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

/**
 * Best-effort extraction of the fields the Greenspark webhook route needs.
 * Returns null when the payload does not contain both an order reference
 * and a transaction id — such an event cannot be used to verify an order.
 */
export function parseGreensparkWebhookEvent(
  payload: unknown
): GreensparkWebhookEvent | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const data = payload as Record<string, any>;
  // Some providers nest the event under `data`; accept either shape.
  const inner =
    data.data && typeof data.data === 'object' ? data.data : data;

  const orderId: string | null =
    inner.external_id ?? inner.externalId ?? inner.order_id ?? inner.orderId ?? null;
  const transactionId: string | null =
    inner.id ??
    inner.transaction_id ??
    inner.transactionId ??
    inner.greenspark_transaction_id ??
    null;
  const certificateUrl: string | null =
    inner.certificate_url ??
    inner.certificateUrl ??
    inner.ledger_url ??
    inner.url ??
    null;
  const status: string | undefined =
    typeof inner.status === 'string'
      ? inner.status
      : typeof inner.event === 'string'
        ? inner.event
        : typeof inner.type === 'string'
          ? inner.type
          : undefined;

  if (!orderId || !transactionId) {
    return null;
  }

  return { orderId, transactionId, certificateUrl, status };
}
