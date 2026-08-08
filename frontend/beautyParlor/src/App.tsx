import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";
import DiscountPopup from "./components/DiscountPopup";

import AdminLayout from "./components/admin/AdminLayout";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Lookbook from "./pages/Lookbook";
import Locations from "./pages/Locations";
import Products from "./pages/Products";
import Book from "./pages/Book";
import Manage from "./pages/Manage";

import AdminLogin from "./pages/AdminLogin";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";
import AdminDiary from "./pages/AdminDiary";
import AdminRequests from "./pages/AdminRequests";
import AdminClients from "./pages/AdminClients";
import AdminRoster from "./pages/AdminRoster";
import AdminTreatments from "./pages/AdminTreatments";
import AdminInventory from "./pages/AdminInventory";
import AdminClosures from "./pages/AdminClosures";
import AdminReports from "./pages/AdminReports";

import { useBbhEffects } from "./lib/bbhEffects";

function App() {
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith("/admin");
  const isShopPage = location.pathname === "/shop";

  useBbhEffects(isAdminPage ? "admin" : location.pathname);

  useEffect(() => {
    if (location.hash) {
      window.setTimeout(() => {
        document
          .querySelector(location.hash)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);

      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.hash]);

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />

      <Route path="/services" element={<Services />} />
      <Route path="/lookbook" element={<Lookbook />} />
      <Route path="/locations" element={<Locations />} />
      <Route path="/shop" element={<Products />} />

      <Route path="/book" element={<Book />} />
      <Route path="/manage" element={<Manage />} />

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          {/* No separate dashboard — the day view is the landing page. */}
          <Route index element={<Navigate to="/admin/diary" replace />} />

          {/* Studio operations — the console from the design. */}
          <Route path="diary" element={<AdminDiary />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="roster" element={<AdminRoster />} />
          <Route path="treatments" element={<AdminTreatments />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="closures" element={<AdminClosures />} />
          <Route path="reports" element={<AdminReports />} />

          {/* Shop side. Service editing lives in the treatments menu. */}
          <Route path="orders" element={<AdminOrders />} />
          <Route path="products" element={<AdminProducts />} />
        </Route>
      </Route>

      {/* /contact, /blogs and /services/:slug are gone — send any stale
          inbound link home rather than rendering an empty shell. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAdminPage) return routes;

  return (
    <div className="bbh">
      <div className="bbh-cursor" data-cursor aria-hidden="true"></div>

      <div className="bbh-blobs" aria-hidden="true">
        <span data-parallax="0.10"></span>
        <span data-parallax="-0.16"></span>
        <span data-parallax="0.06"></span>
      </div>

      <Navbar />

      {routes}

      <Footer />
      <BackToTop />
      {!isShopPage && <DiscountPopup />}
    </div>
  );
}

export default App;
