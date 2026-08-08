import { NavLink, Link } from "react-router-dom";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  closeSidebar: () => void;
}

// The studio side: bookings, chairs and stock.
const studioLinks = [
  {
    label: "Day view",
    path: "/admin/diary",
    icon: "fa-solid fa-calendar-day",
  },
  {
    label: "Requests",
    path: "/admin/requests",
    icon: "fa-solid fa-inbox",
  },
  {
    label: "Clients",
    path: "/admin/clients",
    icon: "fa-solid fa-user",
  },
  {
    label: "Roster",
    path: "/admin/roster",
    icon: "fa-solid fa-user-clock",
  },
  {
    label: "Treatments",
    path: "/admin/treatments",
    icon: "fa-solid fa-list",
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: "fa-solid fa-boxes-stacked",
  },
  {
    label: "Closures",
    path: "/admin/closures",
    icon: "fa-solid fa-ban",
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: "fa-solid fa-chart-pie",
  },
];

// The shop side, which the studio console does not cover.
const adminLinks = [
  {
    label: "Shop orders",
    path: "/admin/orders",
    icon: "fa-solid fa-box",
  },
  {
    label: "Shop catalogue",
    path: "/admin/products",
    icon: "fa-solid fa-bag-shopping",
  },
];

function AdminSidebar({ sidebarOpen, closeSidebar }: AdminSidebarProps) {
  return (
    <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="admin-sidebar-top">
        <h2>BBH Admin</h2>
        <p>Management Panel</p>
      </div>

      <nav className="admin-sidebar-nav">
        <div className="admin-sidebar-label">Studio</div>

        {studioLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? "admin-side-link active" : "admin-side-link"
            }
          >
            <i className={link.icon}></i>
            <span>{link.label}</span>
          </NavLink>
        ))}

        <div className="admin-sidebar-label">Shop</div>

        {adminLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              isActive ? "admin-side-link active" : "admin-side-link"
            }
          >
            <i className={link.icon}></i>
            <span>{link.label}</span>
          </NavLink>
        ))}

      </nav>

      <div className="admin-sidebar-bottom">
        <Link to="/" className="admin-back-site">
          <i className="fa-solid fa-arrow-left"></i>
          Back to Website
        </Link>
      </div>
    </aside>
  );
}

export default AdminSidebar;