import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/**
 * Protects routes so only admin (is_staff) users can access.
 */
export default function AdminRoute({ children }) {
  const { user } = React.useContext(AuthContext);

  // 🚫 Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // ⚠️ Logged in but not staff → redirect home (or show a 403 page)
  if (!user.is_staff) return <Navigate to="/" replace />;

  // ✅ Allowed → render children
  return children;
}
