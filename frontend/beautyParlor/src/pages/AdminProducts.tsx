import { useEffect, useMemo, useState } from "react";

import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../api/adminShopApi";
import type {
  AdminProduct,
  AdminProductCategory,
  AdminProductForm,
} from "../types/adminProducts";
import { money } from "../lib/booking";

const CATEGORIES: AdminProductCategory[] = [
  "brow",
  "lash",
  "skin",
  "wax",
  "tattoo",
  "general",
];

const EMPTY: AdminProductForm = {
  name: "",
  cat: "brow",
  price: "",
  tag: "",
  desc: "",
  imageUrl: "",
  paymentLink: "",
  isActive: true,
};

function toForm(product: AdminProduct): AdminProductForm {
  return {
    name: product.name,
    cat: product.cat,
    price: product.price === null ? "" : String(product.price),
    tag: product.tag || "",
    desc: product.desc,
    imageUrl: product.imageUrl || "",
    paymentLink: product.paymentLink || "",
    isActive: product.isActive,
  };
}

function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<AdminProductForm>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setProducts(await getProducts());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const needle = query.toLowerCase().trim();

    return products.filter(
      (p) =>
        (tab === "all" || p.cat === tab) &&
        `${p.name} ${p.tag || ""}`.toLowerCase().includes(needle)
    );
  }, [products, tab, query]);

  function startEdit(product: AdminProduct) {
    setEditingId(product.id);
    setForm(toForm(product));
    setNotice(`Editing ${product.name}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setNotice("");
  }

  async function save() {
    if (!form.name.trim() || !form.desc.trim()) {
      setError("Name and description are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingId === null) await createProduct(form);
      else await updateProduct(editingId, form);

      await load();
      setNotice(
        editingId === null ? `${form.name} added.` : `${form.name} saved.`
      );
      setEditingId(null);
      setForm(EMPTY);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // The API soft-deletes (is_active = false), so hiding is reversible from the
  // same button rather than retyping the product.
  async function toggleActive(product: AdminProduct) {
    try {
      if (product.isActive) await deleteProduct(product.id);
      else await updateProduct(product.id, { ...toForm(product), isActive: true });

      await load();
      setNotice(
        product.isActive
          ? `${product.name} hidden from the shop.`
          : `${product.name} is back in the shop.`
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="studio-page">
      <header className="studio-head">
        <div>
          <div className="studio-eyebrow">Studio console</div>
          <h1>Shop catalogue</h1>
        </div>

        <span className="studio-muted">
          A product needs both a price and a Stripe payment link to be buyable —
          anything else shows as an email enquiry.
        </span>
      </header>

      {error && <p className="studio-error">{error}</p>}

      <div className="studio-card">
        <div className="studio-card-head">
          <span className="studio-eyebrow">
            {editingId === null ? "Add a product" : "Edit product"}
          </span>
          <span className="studio-muted">{notice}</span>
        </div>

        <div className="studio-field-grid">
          <label className="studio-field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Brow Growth Serum - 5 mL"
            />
          </label>

          <label className="studio-field">
            <span>Category</span>
            <select
              value={form.cat}
              onChange={(e) =>
                setForm({ ...form, cat: e.target.value as AdminProductCategory })
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="studio-field">
            <span>Price — blank for enquiry</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>

          <label className="studio-field">
            <span>Tag</span>
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="Bestseller"
            />
          </label>

          <label className="studio-field">
            <span>Image URL</span>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </label>

          <label className="studio-field">
            <span>Stripe payment link</span>
            <input
              value={form.paymentLink}
              onChange={(e) => setForm({ ...form, paymentLink: e.target.value })}
              placeholder="https://buy.stripe.com/…"
            />
          </label>
        </div>

        <label className="studio-field" style={{ marginTop: 12 }}>
          <span>Description</span>
          <textarea
            rows={3}
            value={form.desc}
            onChange={(e) => setForm({ ...form, desc: e.target.value })}
          />
        </label>

        <div className="studio-drawer-actions">
          <button className="studio-btn solid" disabled={saving} onClick={save}>
            {saving
              ? "Saving…"
              : editingId === null
                ? "Add product"
                : "Save changes"}
          </button>

          {editingId !== null && (
            <button className="studio-btn ghost" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="studio-card studio-toolbar">
        <div className="studio-pills">
          {["all", ...CATEGORIES].map((key) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {key === "all" ? "All products" : key}
            </button>
          ))}
        </div>

        <input
          className="studio-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search product name"
        />
      </div>

      <div className="studio-card studio-table-card scroll-x">
        <div className="studio-table-head studio-shop-row">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Checkout</span>
          <span>Status</span>
          <span></span>
        </div>

        {loading ? (
          <p className="studio-muted studio-pad">Loading the catalogue…</p>
        ) : rows.length === 0 ? (
          <p className="studio-muted studio-pad">Nothing matches that filter.</p>
        ) : (
          rows.map((p) => {
            const buyable = Boolean(p.paymentLink) && Boolean(p.price);

            return (
              <div className="studio-table-row studio-shop-row" key={p.id}>
                <span className="studio-cell-stack">
                  <span>{p.name}</span>
                  <span className="studio-eyebrow">{p.tag || "No tag"}</span>
                </span>

                <span className="studio-muted">{p.cat}</span>

                <span className="mono">
                  {p.price === null ? "—" : money(p.price)}
                </span>

                <span className={`studio-stock-state ${buyable ? "ok" : "low"}`}>
                  {buyable ? "Buy now" : "Enquiry"}
                </span>

                <button
                  className={`studio-status ${p.isActive ? "on" : ""}`}
                  onClick={() => toggleActive(p)}
                >
                  {p.isActive ? "In shop" : "Hidden"}
                </button>

                <button className="studio-btn ghost" onClick={() => startEdit(p)}>
                  Edit
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminProducts;
