import { useEffect, useState } from "react";
import type { AdminProduct, AdminProductForm } from "../types/adminProducts";
import { getAdminAuthHeaders } from "../api/adminAuthApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const emptyForm: AdminProductForm = {
  name: "",
  cat: "brow",
  price: "",
  tag: "",
  desc: "",
  imageUrl: "",
  isActive: true,
};

const categories = ["brow", "lash", "skin", "wax", "tattoo", "general"];

function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<AdminProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/products/admin/all`, {
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load products");
      }
      setProducts(data);
    } catch {
      setError("Could not load products. Check your login or backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const payload = {
        ...form,
        price: form.price === "" ? null : Number(form.price),
      };

      const url = editingId
        ? `${API_BASE_URL}/products/admin/${editingId}`
        : `${API_BASE_URL}/products/admin`;

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
           ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save product");
      }

      setMessage(editingId ? "Product updated." : "Product added.");
      resetForm();
      loadProducts();
    } catch {
      setError("Could not save product. Check required fields.");
    }
  };

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);

    setForm({
      name: product.name,
      cat: product.cat,
      price: product.price === null ? "" : String(product.price),
      tag: product.tag || "",
      desc: product.desc,
      imageUrl: product.imageUrl || "",
      isActive: product.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/products/admin/${id}`, {
        method: "DELETE",
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete product");
      }

      setMessage("Product deleted.");
      loadProducts();
    } catch {
      setError("Could not delete product.");
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <p className="admin-eyebrow">Brow Beauty Hub</p>
        <h1>Admin Products</h1>
        <p>Add, edit, and remove products from the shop.</p>
      </section>

      <section className="admin-section">
        <div className="admin-login-card">
          <h2>Product Dashboard</h2>
          <p>Products are available after admin login.</p>

          <div className="admin-login-row">
            <button onClick={loadProducts} disabled={loading}>
              {loading ? "Loading..." : "Refresh Products"}
            </button>
          </div>

          {message && <p className="admin-success">{message}</p>}
          {error && <p className="admin-error">{error}</p>}
        </div>

        <div className="admin-product-layout">
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Product" : "Add Product"}</h2>

            <label>Product Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>Category *</label>
            <select name="cat" value={form.cat} onChange={handleChange}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <label>Price</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave empty for enquire"
              value={form.price}
              onChange={handleChange}
            />

            <label>Tag</label>
            <input
              name="tag"
              placeholder="Bestseller, New, Top Pick..."
              value={form.tag}
              onChange={handleChange}
            />

            <label>Image URL</label>
            <input
              name="imageUrl"
              placeholder="https://..."
              value={form.imageUrl}
              onChange={handleChange}
            />

            <label>Description *</label>
            <textarea
              name="desc"
              rows={4}
              value={form.desc}
              onChange={handleChange}
              required
            />

            <div className="admin-product-actions">
              <button type="submit">
                {editingId ? "Update Product" : "Add Product"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-products-list">
            <h2>Products</h2>

            {products.length === 0 ? (
              <div className="admin-empty">
                <i className="fa-solid fa-box-open"></i>
                <p>No products loaded yet.</p>
              </div>
            ) : (
              products.map((product) => (
                <article className="admin-product-card" key={product.id}>
                  <img
                    src={
                      product.imageUrl ||
                      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&q=80"
                    }
                    alt={product.name}
                  />

                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.desc}</p>

                    <div className="admin-product-meta">
                      <span>{product.cat}</span>
                      <span>
                        {product.price === null
                          ? "Enquire"
                          : `$${product.price.toFixed(2)}`}
                      </span>
                      {product.tag && <span>{product.tag}</span>}
                    </div>

                    <div className="admin-product-buttons">
                      <button onClick={() => startEdit(product)}>Edit</button>
                      <button onClick={() => deleteProduct(product.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminProducts;
