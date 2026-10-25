# Ecoesse Commerce Engine - Task Tracker (TASKS.md)

Project Vision: Zero-monthly-overhead headless e-commerce platform for Ecoesse with real-world verifiable environmental impact via Greenspark API, Stripe Checkout, and Firebase backend.

## Phase 1: Scaffolding & Firebase Core (Assigned: Antigravity)
- [x] Configure Firebase Client SDK (`src/lib/firebase/client.ts`) with project `hadiyahstepsai-67349762-3e445`
- [x] Configure Firebase Admin SDK (`src/lib/firebase/admin.ts`)
- [x] Create TypeScript interfaces for `Product`, `Order`, `GlobalImpact`, and `CartItem` in `src/types/commerce.ts`
- [x] Build Next.js 15+ App Router structure with TypeScript and Tailwind CSS
- [x] Document environment variables in `.env.example`
- [x] Build seed data & seeder utility (`src/lib/seed/products.ts`) with 4 Ecoesse flagship products

## Phase 2: Storefront & Live Impact Cart (Assigned: Antigravity)
- [x] Earthy, modern Storefront layout with Header, live global impact ticker, and Footer (`src/app/layout.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`)
- [x] Persistent client-side Cart Context (`useCart`) synced with `localStorage` (`src/context/CartContext.tsx`)
- [x] Slide-Over Cart Drawer with dynamic **"Your Order's Eco-Impact"** calculator (Trees planted, Plastic bottles saved, Carbon offset) (`src/components/cart/CartDrawer.tsx`)
- [x] Product Grid with category filtering and impact badges (`src/components/products/ProductGrid.tsx`, `src/components/products/ProductCard.tsx`)
- [x] Dynamic Product detail pages (`src/app/products/[slug]/page.tsx`) with sustainability breakdown tabs

## Phase 3: Stripe Checkout & Greenspark Webhook Pipeline (Assigned: Muse / Antigravity)
- [x] `/api/checkout` route to validate Firestore inventory, calculate line items in CAD cents, and initiate Stripe Checkout Session (`src/app/api/checkout/route.ts`)
- [x] `/api/webhooks/stripe` to handle `checkout.session.completed`, decrement inventory, log order in Firestore, trigger Greenspark API, and increment `site_stats/global_impact` (`src/app/api/webhooks/stripe/route.ts`)
- [x] Greenspark service helper (`src/lib/greenspark/client.ts`) for verifiable environmental impact recording

## Phase 4: Admin Portal & Customer Impact Certificates (Assigned: Muse / Antigravity)
- [x] `/impact/[orderId]` public verifiable Impact Certificate page with shareable badge and Greenspark transaction record (`src/app/impact/[orderId]/page.tsx`)
- [x] `/admin` custom dashboard with 1-click product seeding, inventory adjustment, order fulfillment viewer, and Firebase Auth guard (`src/app/admin/page.tsx`)
