import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  // use is_staff, change to user.role === "admin" if your backend uses 'role'
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;
  return children;
}