// Real barcode -> nutrition lookup, using Open Food Facts (openfoodfacts.org),
// a free, open, crowd-sourced food database. No API key needed and it's safe
// to call straight from the browser -- OFF's API is public and made for this.
//
// This replaces the old "Scan simulieren" flow, which always returned the
// same hardcoded "Greek Yogurt" result no matter what was scanned.

export interface BarcodeProduct {
  barcode: string;
  name: string;
  brand?: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export class BarcodeLookupError extends Error {}

const round1 = (v: unknown): number => Math.round((((v as number) || 0)) * 10) / 10;

/**
 * Looks up a scanned barcode (EAN-13/UPC-A/etc) against Open Food Facts.
 * Returns null if the barcode isn't in the database or has no usable
 * nutrition data -- distinct from a network/request failure, which throws.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  let response: Response;
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,product_name_en,generic_name,brands,serving_size,nutriments`,
      { headers: { Accept: 'application/json' } }
    );
  } catch {
    throw new BarcodeLookupError('network');
  }

  if (!response.ok) {
    throw new BarcodeLookupError(`request_failed_${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new BarcodeLookupError('invalid_response');
  }

  const d = data as { status?: number; product?: Record<string, unknown> };
  if (d.status !== 1 || !d.product) return null;

  const p = d.product;
  const n = (p.nutriments as Record<string, unknown>) || {};
  const name =
    (p.product_name as string) ||
    (p.product_name_en as string) ||
    (p.generic_name as string) ||
    '';
  if (!name) return null;

  const hasServingData = typeof n['energy-kcal_serving'] === 'number';
  const hasPer100gData = typeof n['energy-kcal_100g'] === 'number';
  if (!hasServingData && !hasPer100gData) return null;

  if (hasServingData) {
    return {
      barcode,
      name,
      brand: (p.brands as string) || undefined,
      serving: (p.serving_size as string) || '1 serving',
      calories: Math.round((n['energy-kcal_serving'] as number) || 0),
      protein: round1(n['proteins_serving']),
      carbs: round1(n['carbohydrates_serving']),
      fat: round1(n['fat_serving']),
      fiber: round1(n['fiber_serving']),
    };
  }

  return {
    barcode,
    name,
    brand: (p.brands as string) || undefined,
    serving: '100g',
    calories: Math.round((n['energy-kcal_100g'] as number) || 0),
    protein: round1(n['proteins_100g']),
    carbs: round1(n['carbohydrates_100g']),
    fat: round1(n['fat_100g']),
    fiber: round1(n['fiber_100g']),
  };
}
