# Muse Architecture & Operational Guide (Ecoesse Commerce Engine)

> **Document Classification:** AI Agent Architectural Specification & Cognitive Handoff Protocol  
> **Target Agent:** Muse (Strategic System Architect & Cognitive Planning Lead)  
> **Collaborator:** Antigravity (Autonomous Hands-On Code Builder & Verification Agent)  
> **Repository:** [https://github.com/DimitryAujour/Ecoesse](https://github.com/DimitryAujour/Ecoesse)  
> **Last Updated:** October 2026  

---

## 1. Executive Summary & Collaboration Contract

Ecoesse is an ultra-lean, zero-monthly-overhead, headless sustainable commerce platform built with **Next.js 16+ App Router**, **Firebase Suite** (Firestore, Auth, Storage), **Stripe Checkout** (CAD default, Quebec GST/QST & Canadian tax calculation), and the **Greenspark API** for verified environmental impact.

### The Antigravity ⇄ Muse Partnership Model
```
┌────────────────────────────────────────────────────────┐
│                      MUSE                              │
│       Strategic Architect & Cognitive Lead             │
│  - Deep reasoning across large contexts                │
│  - Legal / Regulatory risk mitigation (Bill C-59)      │
│  - Data contracts, API schemas & ADR generation        │
│  - Writes machine-readable task manifests (TASKS.json) │
└──────────────────────────┬─────────────────────────────┘
                           │
                 TASKS.md / TASKS.json
                           │
┌──────────────────────────▼─────────────────────────────┐
│                   ANTIGRAVITY                          │
│        Autonomous Hands-On Code Builder                │
│  - Implements Next.js components & server routes       │
│  - Runs dev servers, builds & validates TypeScript     │
│  - Executes live browser testing                       │
│  - Manages Git repository, commits & GitHub pushes     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Canadian Legal, Regulatory & Compliance Framework

Muse must ensure all future marketing copy, product descriptions, checkout calculations, and data logging adhere to strict Canadian federal and provincial requirements:

### A. Bill C-59 (Competition Act Anti-Greenwashing Amendment)
- **The Mandate:** Canada's Bill C-59 explicitly bans unsubstantiated environmental representations. Any claims regarding carbon offsets, plastic reduction, or tree planting must be backed by adequate and proper testing conducted in accordance with internationally recognized methodology.
- **Ecoesse Safeguard:** All ecological claims displayed in the UI are tied to immutable third-party transaction hashes generated via the **Greenspark API** (`/impact/[orderId]`). 
- **Rule for Muse:** Never output generic claims like *"100% Eco-Friendly"* or *"Saves the Earth"*. Always output quantified, verifiable metrics: *"+1 Mangrove Tree Planted via Eden Reforestation Projects (Greenspark ID: GPK-XXXXXX)"*.

### B. Health Canada & CFIA Classification "Safe Harbor"
- **The Trap:** Therapeutic, antiseptic, or biocidal claims (e.g., *"kills 99.9% of bacteria"*, *"treats skin inflammation"*) classify products as Drugs or Natural Health Products, requiring a **DIN** (Drug Identification Number) or **NPN** (Natural Product Number).
- **The Safe Harbor:** Focus purely on physical/mechanical action for lifestyle household and personal care goods:
  - *Sisal Dish Brush:* "Durable agave fibers scour away food residue without scratching cookware."
  - *Bamboo Pet Bowl:* "Smooth, non-porous plant-based fiber with non-slip silicone base."
  - *Biodegradable Sponge Cloths:* "Absorbs 20x its dry weight in water using plant-derived cellulose."

### C. Quebec Bill 96 (Charter of the French Language)
- The storefront must be structured to accommodate bilingual localization (English & French) across product titles, descriptions, and checkout notes.

### D. Canadian Tax Nexus (Quebec GST / QST & Federal HST)
- Stripe Checkout is configured with `automatic_tax: { enabled: true }`.
- Canadian taxes (GST 5% + QST 9.975% in Quebec; HST in ON/NB/NL/NS/PE; GST elsewhere) are calculated dynamically by Stripe based on the customer's shipping address.

---

## 3. Current System State & Completed Milestones

Antigravity has scaffolded and validated the core foundation on `main` (commit `edae52d`):

| Component | Status | Source Location | Notes |
| :--- | :--- | :--- | :--- |
| **Client Firebase SDK** | Done | `src/lib/firebase/client.ts` | Auth, Firestore, Storage connected to `hadiyahstepsai-67349762-3e445` |
| **Server Firebase Admin** | Done | `src/lib/firebase/admin.ts` | Modular Admin SDK with service account / dev fallback |
| **TypeScript Models** | Done | `src/types/commerce.ts` | Product, Order, GlobalImpact, CartItem, SustainabilityMetrics |
| **Flagship Seed Catalog** | Done | `src/lib/seed/products.ts` | 4 zero-risk sustainable flagship products with full impact metadata |
| **Live Impact Cart** | Done | `src/context/CartContext.tsx` | Synchronized with `localStorage`; calculates dynamic ecological totals |
| **Slide-Over Drawer** | Done | `src/components/cart/CartDrawer.tsx` | Real-time Trees, Bottles, and CO₂ summary box |
| **Storefront Layout** | Done | `src/app/page.tsx` | Hero banner, global impact stats ticker, category filter tabs |
| **Product Detail Pages** | Done | `src/app/products/[slug]/page.tsx` | High-res gallery, specs, impact cards, client quantity stepper |
| **Stripe Checkout API** | Done | `src/app/api/checkout/route.ts` | CAD line items, automatic tax calculation, demo simulation fallback |
| **Stripe Webhook** | Done | `src/app/api/webhooks/stripe/route.ts` | `checkout.session.completed` handler logging orders to Firestore |
| **Greenspark Client** | Done | `src/lib/greenspark/client.ts` | API client with verified ledger hash generation |
| **Impact Certificate** | Done | `src/app/impact/[orderId]/page.tsx` | Public certificate page with Greenspark ledger hash display |
| **Admin Engine** | Done | `src/app/admin/page.tsx` | 1-click product seeder, inventory adjustment, fulfillment tracking |

---

## 4. Immediate Roadmap & Action Items for Muse

Muse is invited to lead the design and specification of the following Phase 3 & Phase 4 extensions:

### Task M-01: Admin Security Rules & RBAC
- **Goal:** Protect `/admin` and sensitive Firestore collections (`orders`, `site_stats`, `products` write access) via Firebase Security Rules (`firestore.rules`).
- **Muse Action:** Write `firestore.rules` and `storage.rules` that restrict writes to authenticated admin UIDs while allowing public read access to active products and global stats.

### Task M-02: Production Greenspark Webhook Verification Pipeline
- **Goal:** In production, ensure Greenspark API returns real webhook confirmations and writes the live transaction URL into `orders.impactRecord.greensparkTransactionId`.
- **Muse Action:** Document Greenspark API production environment variables and create retry mechanisms in `src/lib/greenspark/client.ts`.

### Task M-03: Dynamic Certificate Social Sharing Card
- **Goal:** Allow customers to share their verified certificate on Instagram Stories, LinkedIn, or Twitter with an automatically generated OpenGraph image showing their exact contribution (e.g. *"Dimitry planted 2 trees and removed 28 ocean bottles with Ecoesse"*).
- **Muse Action:** Implement Next.js Dynamic OG Image generation using `@vercel/og` or standard canvas rendering at `/api/og/impact/[orderId]`.

### Task M-04: French Localization Preparation (Quebec Bill 96)
- **Goal:** Add internationalization support (`next-intl` or lightweight locale dictionary) so customers in Quebec can browse seamlessly in French.

---

## 5. Environment Variables Checklist
Ensure your local or deployment environment (`.env`) is configured with:
```bash
# Client Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hadiyahstepsai-67349762-3e445.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hadiyahstepsai-67349762-3e445
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hadiyahstepsai-67349762-3e445.firebasestorage.app
NEXT_PUBLIC_FIREBASE_APP_ID=1:646342643263:web:...

# Server Admin
FIREBASE_ADMIN_PROJECT_ID=hadiyahstepsai-67349762-3e445
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Greenspark
GREENSPARK_API_KEY=...

# Base Domain
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
