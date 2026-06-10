import { useEffect, useState } from "react";
import type { AdminOrder } from "../types/adminOrder";
import { getAdminAuthHeaders } from "../api/adminAuthApi";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
];

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/orders/admin`, {
        headers: {
           ...getAdminAuthHeaders(),
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load orders");
      }

      setOrders(data);
    } catch {
      setError("Could not load orders. Check your login or backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      setUpdatingId(orderId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/orders/admin/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
             ...getAdminAuthHeaders(),
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not update order");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );
    } catch {
      setError("Could not update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    const firstName = order.customer.firstName || "";
    const lastName = order.customer.lastName || "";
    const fullName = `${firstName} ${lastName}`;

    const searchText = [
      order.orderNumber,
      firstName,
      lastName,
      fullName,
      order.customer.email,
      order.customer.phone || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(searchQuery.toLowerCase().trim());

    return matchesStatus && matchesSearch;
  });

  const notifyUser = async (orderId: number) => {
    try {
      setNotifyingId(orderId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/orders/admin/${orderId}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             ...getAdminAuthHeaders(),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not notify user");
      }

      alert("User notified successfully.");
    } catch {
      setError("Could not notify user. Check email setup.");
    } finally {
      setNotifyingId(null);
    }
  };

  return (
    <main className="admin-page">
      <section className="admin-hero">
        <p className="admin-eyebrow">Brow Beauty Hub</p>
        <h1>Admin Orders</h1>
        <p>View and manage product orders submitted from the shop checkout.</p>
      </section>

      <section className="admin-section">
        <div className="admin-login-card">
          <div>
            <h2>Order Dashboard</h2>
            <p>Customer orders are available after admin login.</p>
          </div>

          <div className="admin-login-row">
            <button onClick={loadOrders} disabled={loading}>
              {loading ? "Loading..." : "Refresh Orders"}
            </button>
          </div>

          <div className="admin-filter-row">
            <input
              type="text"
              placeholder="Search by order/customer/email..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {error && <p className="admin-error">{error}</p>}
        </div>

        <div className="admin-orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="admin-empty">
              <i className="fa-solid fa-box-open"></i>
              <p>No matching orders found.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <article className="admin-order-card" key={order.id}>
                <div className="admin-order-top">
                  <div>
                    <h3>{order.orderNumber}</h3>
                    <p>
                      {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="admin-order-actions">
                    <select
                      className="admin-status-select"
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) =>
                        updateOrderStatus(order.id, event.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      className="admin-notify-btn"
                      onClick={() => notifyUser(order.id)}
                      disabled={notifyingId === order.id}
                    >
                      {notifyingId === order.id ? "Sending..." : "Notify User"}
                    </button>
                  </div>
                </div>

                <div className="admin-customer">
                  <h4>Customer Details</h4>

                  <p>
                    <strong>Name:</strong> {order.customer.firstName}{" "}
                    {order.customer.lastName}
                  </p>

                  <p>
                    <strong>Email:</strong> {order.customer.email}
                  </p>

                  <p>
                    <strong>Phone:</strong> {order.customer.phone || "N/A"}
                  </p>

                  <p>
                    <strong>Address:</strong> {order.customer.address},{" "}
                    {order.customer.city} {order.customer.postcode}
                  </p>

                  {order.customer.notes && (
                    <p>
                      <strong>Notes:</strong> {order.customer.notes}
                    </p>
                  )}
                </div>

                <div className="admin-items">
                  <h4>Items</h4>

                  {order.items.map((item, index) => (
                    <div className="admin-item-row" key={`${item.name}-${index}`}>
                      <span>
                        {item.qty} × {item.name}
                      </span>

                      <strong>${(item.qty * item.price).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>

                <div className="admin-order-total">
                  <span>Total</span>
                  <strong>${order.total.toFixed(2)}</strong>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default AdminOrders;
