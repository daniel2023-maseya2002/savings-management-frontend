import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // 🕐 Wait until user info is restored
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-300">
        Loading admin panel...
      </div>
    );
  }

  // 🚫 Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />;

  // ⚠️ Logged in but not admin → redirect to user dashboard
  if (!user.is_staff) return <Navigate to="/dashboard" replace />;

  // ✅ Admin allowed
  return children;
}
