// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = React.useContext(AuthContext);

  // 🕐 Wait until AuthContext finishes loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-300">
        Checking admin access...
      </div>
    );
  }

  // 🚫 Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // ⚠️ Logged in but not admin → redirect to user dashboard
  if (!user.is_staff) return <Navigate to="/" replace />;

  // ✅ Allowed → render children
  return children;
}
