import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Create Trip", to: "/trips/create" },
    { label: "Trip Chat", to: "/chat" },
    { label: "Invitations", to: "/invitations" },
    { label: "Profile", to: "/profile" },
  ];

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="workspace-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>MenuBar</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
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
