import type { ShopProduct } from "../types/shop";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function getShopProducts(): Promise<ShopProduct[]> {
  const response = await fetch(`${API_BASE_URL}/products`);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Could not load products");
  }

  return data.map((product: ShopProduct) => ({
    ...product,
    price: product.price === null ? null : Number(product.price),
  }));
}
