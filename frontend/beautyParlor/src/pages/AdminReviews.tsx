import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { AdminReview, AdminReviewForm } from "../types/adminReview";
import { getAdminAuthHeaders } from "../api/adminAuthApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const emptyForm: AdminReviewForm = {
  clientName: "",
  serviceName: "",
  location: "",
  rating: "5",
  reviewText: "",
  avatarLetter: "",
  isFeatured: true,
  isActive: true,
  displayOrder: "0",
};

function AdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [form, setForm] = useState<AdminReviewForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/reviews/admin/all`, {
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load reviews");
      }

      setReviews(data);
    } catch {
      setError("Could not load reviews. Check your login or backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    setForm({
      ...form,
      [name]: checked,
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const buildPayload = () => {
    return {
      clientName: form.clientName,
      serviceName: form.serviceName,
      location: form.location,
      rating: Number(form.rating),
      reviewText: form.reviewText,
      avatarLetter: form.avatarLetter,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      displayOrder: Number(form.displayOrder),
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      const url = editingId
        ? `${API_BASE_URL}/reviews/admin/${editingId}`
        : `${API_BASE_URL}/reviews/admin`;

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
        throw new Error(data.error || "Could not save review");
      }

      setMessage(editingId ? "Review updated." : "Review added.");
      resetForm();
      loadReviews();
    } catch {
      setError("Could not save review. Check required fields.");
    }
  };

  const startEdit = (review: AdminReview) => {
    setEditingId(review.id);

    setForm({
      clientName: review.clientName || "",
      serviceName: review.serviceName || "",
      location: review.location || "",
      rating: String(review.rating || 5),
      reviewText: review.reviewText || "",
      avatarLetter: review.avatarLetter || "",
      isFeatured: review.isFeatured,
      isActive: review.isActive,
      displayOrder: String(review.displayOrder || 0),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeReview = async (id: number) => {
    const confirmRemove = window.confirm(
      "Are you sure you want to remove this review?"
    );

    if (!confirmRemove) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/reviews/admin/${id}`, {
        method: "DELETE",
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not remove review");
      }

      setMessage("Review removed.");
      loadReviews();
    } catch {
      setError("Could not remove review.");
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <i
        key={index}
        className={
          index < rating ? "fa-solid fa-star" : "fa-regular fa-star"
        }
      ></i>
    ));
  };

  return (
    <section>
      <div className="admin-login-card">
        <h2>Review Dashboard</h2>
        <p>Client reviews are available after admin login.</p>

        <div className="admin-login-row">
          <button onClick={loadReviews} disabled={loading}>
            {loading ? "Loading..." : "Refresh Reviews"}
          </button>
        </div>

        {message && <p className="admin-success">{message}</p>}
        {error && <p className="admin-error">{error}</p>}
      </div>

      <div className="admin-product-layout">
        <form className="admin-product-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Review" : "Add Review"}</h2>

          <label>Client Name *</label>
          <input
            name="clientName"
            value={form.clientName}
            onChange={handleChange}
            required
            placeholder="Sophia Anderson"
          />

          <label>Service Name</label>
          <input
            name="serviceName"
            value={form.serviceName}
            onChange={handleChange}
            placeholder="Brow Lamination"
          />

          <label>Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Roselands"
          />

          <label>Rating</label>
          <select name="rating" value={form.rating} onChange={handleChange}>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <label>Avatar Letter</label>
          <input
            name="avatarLetter"
            value={form.avatarLetter}
            onChange={handleChange}
            placeholder="S"
            maxLength={1}
          />

          <label>Display Order</label>
          <input
            name="displayOrder"
            type="number"
            value={form.displayOrder}
            onChange={handleChange}
            placeholder="1"
          />

          <label>Review Text *</label>
          <textarea
            name="reviewText"
            rows={6}
            value={form.reviewText}
            onChange={handleChange}
            required
            placeholder="Write the client review here..."
          />

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              name="isFeatured"
              checked={form.isFeatured}
              onChange={handleCheckboxChange}
            />
            Featured review
          </label>

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleCheckboxChange}
            />
            Active review
          </label>

          <div className="admin-product-actions">
            <button type="submit">
              {editingId ? "Update Review" : "Add Review"}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        <div className="admin-products-list">
          <h2>Client Reviews</h2>

          {reviews.length === 0 ? (
            <div className="admin-empty">
              <i className="fa-solid fa-star"></i>
              <p>No reviews loaded yet.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <article className="admin-review-card" key={review.id}>
                <div className="admin-review-avatar">
                  {review.avatarLetter || review.clientName.charAt(0)}
                </div>

                <div>
                  <div className="admin-review-top">
                    <div>
                      <h3>{review.clientName}</h3>
                      <p>
                        {review.serviceName || "General Review"}
                        {review.location ? ` · ${review.location}` : ""}
                      </p>
                    </div>

                    <div className="admin-review-stars">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  <p className="admin-review-text">“{review.reviewText}”</p>

                  <div className="admin-product-meta">
                    <span>Order: {review.displayOrder}</span>
                    <span>{review.isFeatured ? "Featured" : "Not Featured"}</span>
                    <span>{review.isActive ? "Active" : "Inactive"}</span>
                  </div>

                  <div className="admin-product-buttons">
                    <button onClick={() => startEdit(review)}>Edit</button>
                    <button onClick={() => removeReview(review.id)}>
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
  );
}

export default AdminReviews;
