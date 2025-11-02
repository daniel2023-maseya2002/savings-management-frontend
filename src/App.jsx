import { useContext, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";
import LoadingOverlay from "./components/ui/LoadingOverlay";

// Pages
import Dashboard from "./pages/Dashboard";
import TransactionsPage from "./pages/TransactionsPage";
import DepositPage from "./pages/DepositPage";
import WithdrawPage from "./pages/WithdrawPage";
import UserDevicesPage from "./pages/UserDevicesPage";
import NotificationsPage from "./pages/NotificationsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OTPRequestPage from "./pages/OTPRequestPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import OTPNewPasswordPage from "./pages/OTPNewPasswordPage";
import PasswordResetRequestPage from "./pages/PasswordResetRequestPage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminLoginActivityPage from "./pages/AdminLoginActivityPage";
import AdminUsersPage from "./pages/AdminUsersPage";

// Utils
import { useGlobalLoading } from "./utils/axiosLoading";

function AppContent() {
  const { user } = useContext(AuthContext);
  const { isLoading } = useGlobalLoading();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [routeLoading, setRouteLoading] = useState(false);

  // 🌀 Add short transition loader on route change
  useEffect(() => {
    if (navigationType === "PUSH") {
      setRouteLoading(true);
      const timeout = setTimeout(() => setRouteLoading(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  // 🧭 If admin logs in and lands on "/", redirect them automatically
  useEffect(() => {
    if (user?.is_staff && location.pathname === "/") {
      navigate("/admin", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // 🔒 Identify auth-only routes
  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/otp") ||
    location.pathname.startsWith("/password-reset");

  return (
    <>
      {/* ✅ Combined Global & Route Loading */}
      <LoadingOverlay show={isLoading || routeLoading} text="Please wait..." />

      {/* 🔐 Auth Routes (no layout) */}
      {isAuthPage ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/otp/request" element={<OTPRequestPage />} />
          <Route path="/otp/verify" element={<OTPVerifyPage />} />
          <Route path="/otp/new-password" element={<OTPNewPasswordPage />} />
          <Route path="/password-reset" element={<PasswordResetRequestPage />} />
          <Route path="/password-reset-confirm" element={<PasswordResetConfirmPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : user ? (
        // 🏦 Main App Layout for Logged-in Users
        <AppLayout>
          <Routes>
            {/* ---------- User Routes ---------- */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <DepositPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute>
                  <WithdrawPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <UserDevicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* ---------- Admin Routes ---------- */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/devices"
              element={
                <AdminRoute>
                  <AdminDevicesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <AdminRoute>
                  <AdminAnalyticsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/logins"
              element={
                <AdminRoute>
                  <AdminLoginActivityPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />

            {/* ---------- 404 ---------- */}
            <Route
              path="*"
              element={
                <div className="flex h-screen items-center justify-center text-gray-500 text-lg">
                  404 — Page Not Found
                </div>
              }
            />
          </Routes>
        </AppLayout>
      ) : (
        // 🚪 Not logged in → Redirect to login
        <Navigate to="/login" replace />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
