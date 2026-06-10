import { useEffect, useState } from "react";
import type { AdminService, AdminServiceForm } from "../types/adminServices";
import { getAdminAuthHeaders } from "../api/adminAuthApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const emptyForm: AdminServiceForm = {
  slug: "",
  number: "",
  label: "",
  title: "",
  image: "",
  description: "",
  paragraphs: "",
  includes: "",
  isActive: true,
};

function AdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [form, setForm] = useState<AdminServiceForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/services/admin/all`, {
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load services");
      }

      setServices(data);
    } catch {
      setError("Could not load services. Check your login or backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
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

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      isActive: event.target.checked,
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const buildPayload = () => {
    return {
      slug: form.slug,
      number: form.number,
      label: form.label,
      title: form.title,
      image: form.image,
      description: form.description,
      paragraphs: form.paragraphs,
      includes: form.includes,
      isActive: form.isActive,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const url = editingId
        ? `${API_BASE_URL}/services/admin/${editingId}`
        : `${API_BASE_URL}/services/admin`;

      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
           ...getAdminAuthHeaders(),
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save service");
      }

      setMessage(editingId ? "Service updated." : "Service added.");
      resetForm();
      loadServices();
    } catch {
      setError("Could not save service. Check required fields or duplicate slug.");
    }
  };

  const startEdit = (service: AdminService) => {
    setEditingId(service.id);

    setForm({
      slug: service.slug || "",
      number: service.number || "",
      label: service.label || "",
      title: service.title || "",
      image: service.image || "",
      description: service.description || "",
      paragraphs: service.paragraphs.join("\n"),
      includes: service.includes.join("\n"),
      isActive: service.isActive,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteService = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to remove this service?"
    );

    if (!confirmDelete) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/services/admin/${id}`, {
        method: "DELETE",
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete service");
      }

      setMessage("Service removed.");
      loadServices();
    } catch {
      setError("Could not remove service.");
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <p className="admin-eyebrow">Brow Beauty Hub</p>
        <h1>Admin Services</h1>
        <p>Add, update, and remove services shown on the website.</p>
      </section>

      <section className="admin-section">
        <div className="admin-login-card">
          <h2>Service Dashboard</h2>
          <p>Services are available after admin login.</p>

          <div className="admin-login-row">
            <button onClick={loadServices} disabled={loading}>
              {loading ? "Loading..." : "Refresh Services"}
            </button>
          </div>

          {message && <p className="admin-success">{message}</p>}
          {error && <p className="admin-error">{error}</p>}
        </div>

        <div className="admin-product-layout">
          <form className="admin-product-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Service" : "Add Service"}</h2>

            <label>Service Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Threading"
            />

            <label>Slug</label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="threading"
            />

            <label>Service Number</label>
            <input
              name="number"
              value={form.number}
              onChange={handleChange}
              placeholder="01"
            />

            <label>Label</label>
            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="Brow Services"
            />

            <label>Image URL</label>
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="https://..."
            />

            <label>Short Description *</label>
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              required
              placeholder="Short service description..."
            />

            <label>Paragraphs</label>
            <textarea
              name="paragraphs"
              rows={5}
              value={form.paragraphs}
              onChange={handleChange}
              placeholder="Write each paragraph on a new line"
            />

            <label>Includes</label>
            <textarea
              name="includes"
              rows={5}
              value={form.includes}
              onChange={handleChange}
              placeholder="Write each included item on a new line"
            />

            <label className="admin-checkbox-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={handleCheckboxChange}
              />
              Active service
            </label>

            <div className="admin-product-actions">
              <button type="submit">
                {editingId ? "Update Service" : "Add Service"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="admin-products-list">
            <h2>Services</h2>

            {services.length === 0 ? (
              <div className="admin-empty">
                <i className="fa-solid fa-spa"></i>
                <p>No services loaded yet.</p>
              </div>
            ) : (
              services.map((service) => (
                <article className="admin-product-card" key={service.id}>
                  <img
                    src={
                      service.image ||
                      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&q=80"
                    }
                    alt={service.title}
                  />

                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>

                    <div className="admin-product-meta">
                      {service.number && <span>{service.number}</span>}
                      {service.label && <span>{service.label}</span>}
                      <span>{service.slug}</span>
                      <span>{service.isActive ? "Active" : "Inactive"}</span>
                    </div>

                    <div className="admin-service-lists">
                      {service.paragraphs.length > 0 && (
                        <div>
                          <strong>Paragraphs:</strong>
                          <ul>
                            {service.paragraphs.slice(0, 2).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {service.includes.length > 0 && (
                        <div>
                          <strong>Includes:</strong>
                          <ul>
                            {service.includes.slice(0, 4).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="admin-product-buttons">
                      <button onClick={() => startEdit(service)}>Edit</button>
                      <button onClick={() => deleteService(service.id)}>
                        Remove
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

export default AdminServices;
