import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // 🕐 Wait for user data
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-300">
        Loading your account...
      </div>
    );
  }

  // 🚪 Not logged in → login
  if (!user) return <Navigate to="/login" replace />;

  // 🚫 Admins shouldn't see user pages
  if (user.is_staff) return <Navigate to="/admin" replace />;

  // ✅ Regular user can access
  return children;
}
