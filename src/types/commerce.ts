// TypeScript Data Models for Ecoesse Commerce Engine

export type ProductCategory = 'household' | 'personal-care' | 'pet-care';
export type ProductStatus = 'active' | 'draft' | 'archived';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'shipped' | 'delivered';

export interface SustainabilityMetrics {
  treesPlanted: number;
  plasticBottlesSaved: number;
  carbonOffsetKg: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  // Task M-04 follow-up: per-locale product copy. English title /
  // description remain the canonical fields; the French fields are
  // optional so older Firestore documents (seeded before this change)
  // keep rendering in English until they are re-seeded.
  titleFr?: string;
  descriptionFr?: string;
  category: ProductCategory;
  price: number; // Stored in cents (e.g., 1999 = $19.99 CAD)
  compareAtPrice: number | null;
  sku: string;
  inventoryCount: number;
  images: string[];
  sustainabilityMetrics: SustainabilityMetrics;
  status: ProductStatus;
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  priceCents: number;
  image?: string;
  sustainabilityMetrics?: SustainabilityMetrics;
}

export interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string; // QC, ON, BC, etc.
  postalCode?: string;
  country?: string;
}

export interface ImpactRecord {
  greensparkTransactionId: string | null;
  treesPlanted: number;
  plasticSaved: number;
  carbonOffset: number;
  verifiedAt: any | null;
  // Task M-02: 'verified' means Greenspark returned a real transaction id.
  // 'pending' means payment succeeded but Greenspark has not yet verified
  // the impact — the impact must not be presented as verified in this state.
  greensparkStatus?: 'verified' | 'pending';
  greensparkCertificateUrl?: string | null;
  greensparkAttempts?: number;
  greensparkLastError?: string | null;
}

export interface Order {
  id: string;
  stripeSessionId: string;
  customerEmail: string;
  customerUid: string | null;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  totalAmountCents: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string | null;
  impactRecord: ImpactRecord;
  createdAt: any;
}

export interface GlobalImpact {
  totalTreesPlanted: number;
  totalPlasticBottlesRemoved: number;
  totalCarbonOffsetKg: number;
  totalOrdersCount: number;
  lastUpdated: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartImpactTotals {
  totalTrees: number;
  totalPlasticBottles: number;
  totalCarbonKg: number;
  totalAmountCents: number;
  itemCount: number;
}
