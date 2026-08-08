import { useLocation, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../api/adminAuthApi";

const pageInfo: Record<string, { title: string; subtitle: string }> = {
  "/admin/orders": {
    title: "Shop orders",
    subtitle: "View retail orders, update status, and email the guest.",
  },
  "/admin/products": {
    title: "Shop catalogue",
    subtitle: "Add, edit, and hide the products sold on the website.",
  },
};

interface AdminHeaderProps {
  openSidebar: () => void;
}

function AdminHeader({ openSidebar }: AdminHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = pageInfo[location.pathname] || {
    title: "Admin Panel",
    subtitle: "Manage website content.",
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login");
  };

  return (
    <header className="admin-top-header">
      <button className="admin-mobile-menu" onClick={openSidebar}>
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="admin-header-text">
        <p className="admin-eyebrow">Brow Beauty Hub</p>
        <h1>{currentPage.title}</h1>
        <p>{currentPage.subtitle}</p>
      </div>

      <button className="admin-logout-btn" onClick={handleLogout}>
        <i className="fa-solid fa-right-from-bracket"></i>
        Logout
      </button>
    </header>
  );
}

export default AdminHeader;