# Ecoesse Commerce Engine

> Zero-monthly-overhead, custom headless e-commerce storefront & admin engine selling sustainable household, personal care, and pet care products with real-world, verifiable environmental impact.

---

## 1. Vision & Core Value Proposition
Ecoesse replaces wasteful e-commerce overhead and single-use plastics with high-quality sustainable essentials. Every purchase directly triggers verified ecological dividends:
- **🌲 Tree Planting:** Verified native mangrove and reforestation projects via the Greenspark API.
- **🌊 Ocean Plastic Recovery:** Intercepting ocean-bound plastic bottles before they enter marine ecosystems.
- **💨 Carbon Offsetting:** Certified biomass and clean energy projects.
- **🍁 Canadian Native:** Default CAD currency with automatic Quebec GST/QST & Canadian provincial tax calculations.

---

## 2. Tech Stack & Infrastructure
- **Framework:** Next.js 16+ (App Router, TypeScript, Server Actions)
- **Styling & UI:** Tailwind CSS, Lucide Icons, Framer Motion
- **Backend & Database:** Firebase Suite (Cloud Firestore, Firebase Auth, Firebase Storage)
- **Payments & Tax:** Stripe Checkout & Webhooks (CAD currency default, automatic Canadian & Quebec sales taxes enabled)
- **Impact Integration:** Greenspark API (automated post-payment verification trigger)
- **Deployment:** Firebase App Hosting & GitHub CI/CD

---

## 3. Key Architecture & Features

### 🛒 Live Per-Product & Cart Impact Calculator
As users add items or adjust quantities in the slide-over drawer cart, a real-time calculator computes the exact number of trees planted, ocean plastic bottles saved, and carbon offset kg that will be funded upon checkout.

### 📜 Verifiable Impact Ledger (`/impact/[orderId]`)
Every completed order generates an immutable, shareable public "Impact Certificate" page displaying the customer's contribution linked directly to the Greenspark transaction record.

### ⚡ Zero-Bloat Custom Admin Dashboard (`/admin`)
Protected by Firebase Authentication (Admin UID check). Allows 1-click product catalog seeding to Cloud Firestore, real-time inventory adjustments, and order fulfillment status tracking without paying $299/mo for third-party Shopify apps.

---

## 4. Firestore Data Schema

### `products` (Collection)
```typescript
interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: "household" | "personal-care" | "pet-care";
  price: number; // Stored in cents (e.g., 1999 = $19.99 CAD)
  compareAtPrice: number | null;
  sku: string;
  inventoryCount: number;
  images: string[];
  sustainabilityMetrics: {
    treesPlanted: number;
    plasticBottlesSaved: number;
    carbonOffsetKg: number;
  };
  status: "active" | "draft" | "archived";
  createdAt: any;
  updatedAt: any;
}
```

### `orders` (Collection)
```typescript
interface Order {
  id: string;
  stripeSessionId: string;
  customerEmail: string;
  customerUid: string | null;
  shippingAddress: object;
  items: Array<{ productId: string; title: string; quantity: number; priceCents: number }>;
  totalAmountCents: number;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
  fulfillmentStatus: "unfulfilled" | "shipped" | "delivered";
  trackingNumber: string | null;
  impactRecord: {
    greensparkTransactionId: string | null;
    treesPlanted: number;
    plasticSaved: number;
    carbonOffset: number;
    verifiedAt: any | null;
  };
  createdAt: any;
}
```

### `site_stats` (Document: `site_stats/global_impact`)
```typescript
interface GlobalImpact {
  totalTreesPlanted: number;
  totalPlasticBottlesRemoved: number;
  totalCarbonOffsetKg: number;
  totalOrdersCount: number;
  lastUpdated: any;
}
```

---

## 5. Agent Collaboration Protocol (Antigravity <-> GitHub <-> Muse)
- Track all tasks, bugs, and completed features in `TASKS.md` using `[TODO]`, `[IN_PROGRESS]`, and `[DONE]`.
- All required environment keys are maintained and documented in `.env.example`.

---

## 6. Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and supply your credentials:
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
