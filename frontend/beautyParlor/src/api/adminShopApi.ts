// The shop side of the console: retail orders and the product catalogue.
// Same admin token as the studio calls, different route prefix.

import { getAdminAuthHeaders } from "./adminAuthApi";
import type { AdminOrder } from "../types/adminOrder";
import type { AdminProduct, AdminProductForm } from "../types/adminProducts";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAdminAuthHeaders(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The console could not reach the server.");
  }

  return data as T;
}

export function getOrders() {
  return request<AdminOrder[]>("/orders/admin");
}

export function setOrderStatus(id: number, status: string) {
  return request<AdminOrder>(`/orders/admin/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function notifyOrder(id: number) {
  return request<{ message?: string }>(`/orders/admin/${id}/notify`, {
    method: "POST",
  });
}

export function getProducts() {
  return request<AdminProduct[]>("/products/admin/all");
}

// The form keeps price as a string; "" means "enquiry only", which the API
// stores as NULL. Convert here so neither page has to remember.
const productBody = (form: AdminProductForm) => ({
  ...form,
  price: form.price === "" ? null : Number(form.price),
});

export function createProduct(form: AdminProductForm) {
  return request<AdminProduct>("/products/admin", {
    method: "POST",
    body: JSON.stringify(productBody(form)),
  });
}

export function updateProduct(id: number, form: AdminProductForm) {
  return request<AdminProduct>(`/products/admin/${id}`, {
    method: "PATCH",
    body: JSON.stringify(productBody(form)),
  });
}

export function deleteProduct(id: number) {
  return request<{ message: string }>(`/products/admin/${id}`, {
    method: "DELETE",
  });
}
