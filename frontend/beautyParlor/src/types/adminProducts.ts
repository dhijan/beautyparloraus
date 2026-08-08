export type AdminProductCategory =
  | "brow"
  | "lash"
  | "skin"
  | "wax"
  | "tattoo"
  | "general";

export interface AdminProduct {
  id: number;
  name: string;
  cat: AdminProductCategory;
  price: number | null;
  tag: string | null;
  desc: string;
  imageUrl?: string | null;
  paymentLink?: string | null;
  isActive: boolean;
}

export interface AdminProductForm {
  name: string;
  cat: AdminProductCategory;
  price: string;
  tag: string;
  desc: string;
  imageUrl: string;
  paymentLink: string;
  isActive: boolean;
}