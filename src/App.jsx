// src/App.jsx
import { useContext, useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingOverlay from "./components/ui/LoadingOverlay";

// Pages
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminLoginActivityPage from "./pages/AdminLoginActivityPage";
import AdminNotification from "./pages/AdminNotification"; // ✅ NEW
import AdminUsersPage from "./pages/AdminUsersPage";
import Dashboard from "./pages/Dashboard";
import DepositPage from "./pages/DepositPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import OTPNewPasswordPage from "./pages/OTPNewPasswordPage";
import OTPRequestPage from "./pages/OTPRequestPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import PasswordResetRequestPage from "./pages/PasswordResetRequestPage";
import RegisterPage from "./pages/RegisterPage";
import TransactionsPage from "./pages/TransactionsPage";
import UserDevicesPage from "./pages/UserDevicesPage";
import WithdrawPage from "./pages/WithdrawPage";

// Utils
import { useGlobalLoading } from "./utils/axiosLoading";

function AppContent() {
  const { user } = useContext(AuthContext);
  const { isLoading } = useGlobalLoading();
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();
  const [routeLoading, setRouteLoading] = useState(false);

  // Short route transition loader
  useEffect(() => {
    if (navigationType === "PUSH") {
      setRouteLoading(true);
      const timeout = setTimeout(() => setRouteLoading(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname]);

  // Redirect admin to dashboard
  useEffect(() => {
    if (user?.is_staff && location.pathname === "/") {
      navigate("/admin", { replace: true });
    }
  }, [user, location.pathname, navigate]);

  return (
    <>
      <LoadingOverlay show={isLoading || routeLoading} text="Please wait..." />

      <Routes>
        {/* 🌐 Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* 🔐 Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp/request" element={<OTPRequestPage />} />
        <Route path="/otp/verify" element={<OTPVerifyPage />} />
        <Route path="/otp/new-password" element={<OTPNewPasswordPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route
          path="/password-reset-confirm"
          element={<PasswordResetConfirmPage />}
        />

        {/* 👤 Protected User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TransactionsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/deposit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <DepositPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WithdrawPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserDevicesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotificationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 🧭 Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/devices"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminDevicesPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminAnalyticsPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/logins"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminLoginActivityPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminUsersPage />
              </AppLayout>
            </AdminRoute>
          }
        />
        {/* ✅ Admin Notifications */}
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <AppLayout>
                <AdminNotification />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* 🚫 404 Fallback */}
        <Route
          path="*"
          element={
            <div className="flex h-screen items-center justify-center text-gray-500 text-lg">
              404 — Page Not Found
            </div>
          }
        />
      </Routes>
    </>
  );
}

// ✅ Wrapped with both AuthProvider & ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
