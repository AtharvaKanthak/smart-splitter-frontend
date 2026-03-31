import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Create Trip", to: "/trips/create" },
    { label: "Trip Chat", to: "/chat" },
    { label: "Invitations", to: "/invitations" },
    { label: "Profile", to: "/profile" },
  ];

  const handleProfileClick = () => {
    setIsMobileMenuOpen(false);
    navigate("/profile");
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={`workspace-layout ${isMobileMenuOpen ? "menu-open" : ""}`}>
      <button
        type="button"
        className="sidebar-overlay"
        aria-label="Close menu"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <h2>MenuBar</h2>
          <button
            type="button"
            className="mobile-close-btn"
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <button
            type="button"
            className="profile-name-btn"
            onClick={handleProfileClick}
            title="Click to edit profile"
          >
            {user?.name}
          </button>
          <button onClick={logout} className="btn btn-danger" type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="app-shell">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-btn"
            aria-label="Open menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <span className="mobile-menu-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <div>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle || "Track and settle group expenses clearly."}</p>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
