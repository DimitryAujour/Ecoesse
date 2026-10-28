import { SAMPLE_PRODUCTS } from '@/lib/seed/products';
import { adminDb } from '@/lib/firebase/admin';
import { Product } from '@/types/commerce';

// Server-side product catalog (follow-up to PR #11, admin inventory).
//
// The homepage and product detail pages used to render SAMPLE_PRODUCTS
// directly from code, so admin stock edits made in /admin (PR #11)
// never reached the storefront: the catalog card's "In Stock (n)"
// count and the detail page both showed the seed counts forever, and
// a product's status in Firestore (draft/archived) was ignored.
//
// getCatalogProducts reads the products collection with the Admin SDK
// (same pattern as the homepage stats and the impact page), keeps
// only active products with the fields the cards need, sorted by id,
// and returns that list. Validation is defensive on purpose: a
// Firestore document missing a title, slug, price, or impact metrics
// is skipped rather than crashing the storefront.
//
// Fallback, stated plainly: if Firestore cannot be read (no
// credentials in local dev, a rules/connection problem) or the
// collection is empty (seeder not yet run), the function returns
// SAMPLE_PRODUCTS — the actual catalog data the seeder writes, not
// invented products. That keeps an unseeded storefront working, at
// the cost that an unseeded store shows seed stock counts. Once the
// seeder has run, Firestore is the source of truth and admin edits
// flow through. Do not "fix" the fallback by returning an empty list
// without also handling the unseeded-store case, or the shop will
// look empty for stores that have not seeded yet.
export async function getCatalogProducts(): Promise<Product[]> {
  try {
    const snap = await adminDb.collection('products').get();
    const list: Product[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== 'active') return;
      if (
        typeof data.title !== 'string' ||
        typeof data.slug !== 'string' ||
        typeof data.price !== 'number' ||
        !data.sustainabilityMetrics ||
        typeof data.sustainabilityMetrics.treesPlanted !== 'number' ||
        typeof data.sustainabilityMetrics.plasticBottlesSaved !== 'number'
      ) {
        return;
      }
      list.push({
        id: docSnap.id,
        title: data.title,
        slug: data.slug,
        description: typeof data.description === 'string' ? data.description : '',
        titleFr: typeof data.titleFr === 'string' ? data.titleFr : undefined,
        descriptionFr:
          typeof data.descriptionFr === 'string' ? data.descriptionFr : undefined,
        category: data.category,
        price: data.price,
        compareAtPrice: typeof data.compareAtPrice === 'number' ? data.compareAtPrice : null,
        sku: typeof data.sku === 'string' ? data.sku : docSnap.id,
        inventoryCount:
          typeof data.inventoryCount === 'number' && data.inventoryCount >= 0
            ? data.inventoryCount
            : 0,
        images: Array.isArray(data.images) ? data.images : [],
        sustainabilityMetrics: {
          treesPlanted: data.sustainabilityMetrics.treesPlanted,
          plasticBottlesSaved: data.sustainabilityMetrics.plasticBottlesSaved,
          carbonOffsetKg:
            typeof data.sustainabilityMetrics.carbonOffsetKg === 'number'
              ? data.sustainabilityMetrics.carbonOffsetKg
              : 0,
        },
        status: 'active',
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      });
    });
    if (list.length > 0) {
      list.sort((a, b) => a.id.localeCompare(b.id));
      return list;
    }
    return SAMPLE_PRODUCTS;
  } catch (err) {
    console.error('Catalog: failed to load products from Firestore, using seed catalog:', err);
    return SAMPLE_PRODUCTS;
  }
}
