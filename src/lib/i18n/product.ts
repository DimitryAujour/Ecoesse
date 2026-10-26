import type { Product } from '@/types/commerce';
import type { Locale } from './dictionary';

/** Localized product copy, falling back to English when French is absent. */
export function localizedTitle(product: Product, locale: Locale): string {
  return locale === 'fr' && product.titleFr ? product.titleFr : product.title;
}

export function localizedDescription(product: Product, locale: Locale): string {
  return locale === 'fr' && product.descriptionFr ? product.descriptionFr : product.description;
}
