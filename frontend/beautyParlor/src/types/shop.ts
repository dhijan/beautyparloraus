export type ShopCategory =
  | "brow"
  | "lash"
  | "skin"
  | "wax"
  | "tattoo"
  | "general";

export interface ShopProduct {
  id: number;
  name: string;
  cat: ShopCategory;
  price: number | null;
  tag: string | null;
  desc: string;
  imageUrl?: string | null;
  paymentLink?: string | null;
}
