// src/components/ProtectedRoute.jsx
import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  // 🚪 Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // 🚫 Admins shouldn't see user pages
  if (user.is_staff) return <Navigate to="/admin" replace />;

  // ✅ Regular user can access
  return children;
}