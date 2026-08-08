import type { ShopCategory } from "../types/shop";

export const CAT_IMAGES: Record<ShopCategory, string> = {
  brow: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&q=80",
  lash: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400&q=80",
  skin: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
  wax: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
  tattoo: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80",
  general: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80",
};

export const CAT_LABELS: Record<ShopCategory, string> = {
  brow: "Brow",
  lash: "Lash",
  skin: "Skin Care",
  wax: "Wax & Tools",
  tattoo: "Tattoo & PMU",
  general: "General Beauty",
};

// Products are stored as "Base Name - Size" to match the Stripe Payment
// Link names, so the size variants of one product share a base name.
export function splitVariant(name: string) {
  const at = name.lastIndexOf(" - ");

  return at === -1
    ? { base: name, size: null }
    : { base: name.slice(0, at), size: name.slice(at + 3) };
}

export function fmtPrice(price: number | null) {
  if (price === null) return "Enquire";
  if (price === 0) return "POA";
  return `$${price.toFixed(2)}`;
}