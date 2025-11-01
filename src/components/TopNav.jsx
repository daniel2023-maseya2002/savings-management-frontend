import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function TopNav() {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();

  const linkStyle = {
    color: "#d1d5db",
    marginRight: 14,
    textDecoration: "none",
    fontSize: "14px",
  };

  const activeStyle = {
    color: "#22d3ee",
    fontWeight: "bold",
  };

  return (
    <nav
      style={{
        padding: "10px 18px",
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#111827", // dark navy/gray
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ---------- LEFT SIDE LINKS ---------- */}
      <div>
        <Link
          to="/"
          style={{
            ...linkStyle,
            ...(location.pathname === "/" ? activeStyle : {}),
          }}
        >
          Dashboard
        </Link>
        <Link
          to="/transactions"
          style={{
            ...linkStyle,
            ...(location.pathname === "/transactions" ? activeStyle : {}),
          }}
        >
          Transactions
        </Link>
        <Link
          to="/deposit"
          style={{
            ...linkStyle,
            ...(location.pathname === "/deposit" ? activeStyle : {}),
          }}
        >
          Deposit
        </Link>
        <Link
          to="/withdraw"
          style={{
            ...linkStyle,
            ...(location.pathname === "/withdraw" ? activeStyle : {}),
          }}
        >
          Withdraw
        </Link>

        {/* ---------- ADMIN-ONLY LINKS ---------- */}
        {user?.is_staff && (
          <>
            <span style={{ marginLeft: 18, fontWeight: "bold", color: "#9ca3af" }}>
              | Admin:
            </span>
            <Link
              to="/admin"
              style={{
                ...linkStyle,
                ...(location.pathname === "/admin" ? activeStyle : {}),
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/users"
              style={{
                ...linkStyle,
                ...(location.pathname === "/admin/users" ? activeStyle : {}),
              }}
            >
              Users
            </Link>
            <Link
              to="/admin/devices"
              style={{
                ...linkStyle,
                ...(location.pathname === "/admin/devices" ? activeStyle : {}),
              }}
            >
              Devices
            </Link>
            <Link
              to="/admin/analytics"
              style={{
                ...linkStyle,
                ...(location.pathname === "/admin/analytics" ? activeStyle : {}),
              }}
            >
              Analytics
            </Link>
            <Link
              to="/admin/logins"
              style={{
                ...linkStyle,
                ...(location.pathname === "/admin/logins" ? activeStyle : {}),
              }}
            >
              Login Activity
            </Link>
          </>
        )}
      </div>

      {/* ---------- RIGHT SIDE USER INFO ---------- */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {user ? (
          <>
            <span style={{ marginRight: 10, color: "#e5e7eb" }}>
              {user.username}{" "}
              {user.is_staff && <em style={{ color: "#22d3ee" }}>(admin)</em>}
            </span>
            <button
              onClick={logout}
              style={{
                background: "#dc2626",
                color: "#f3f4f6",
                border: "none",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: "13px",
              }}
              onMouseOver={(e) => (e.target.style.background = "#b91c1c")}
              onMouseOut={(e) => (e.target.style.background = "#dc2626")}
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={linkStyle}>
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

export default TopNav;
