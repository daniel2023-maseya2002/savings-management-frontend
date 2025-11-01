import { useContext } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNav from "./components/TopNav";
import { AuthContext, AuthProvider } from "./context/AuthContext";

// Components
import AdminRoute from "./components/AdminRoute";
import NotificationsMenu from "./components/NotificationsMenu";

// Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminDevicesPage from "./pages/AdminDevicesPage";
import AdminLoginActivityPage from "./pages/AdminLoginActivityPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminUsersPage from "./pages/AdminUsersPage"; // ✅ added
import Dashboard from "./pages/Dashboard";
import DepositPage from "./pages/DepositPage";
import LoginPage from "./pages/LoginPage";
import OTPNewPasswordPage from "./pages/OTPNewPasswordPage";
import OTPRequestPage from "./pages/OTPRequestPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import PasswordResetRequestPage from "./pages/PasswordResetRequestPage";
import TransactionsPage from "./pages/TransactionsPage";
import UserDevicesPage from "./pages/UserDevicesPage";
import WithdrawPage from "./pages/WithdrawPage";
import RegisterPage from "./pages/RegisterPage";
import NotificationsPage from "./pages/NotificationsPage";

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Hide TopNav on auth-related pages
  const hideNav = [
    "/login",
    "/register",
    "/otp/request",
    "/otp/verify",
    "/otp/new-password",
    "/password-reset",
    "/password-reset-confirm",
  ].includes(location.pathname);

  return (
    <>
      {!hideNav && user && (
        <>
          <TopNav />
          <NotificationsMenu />
        </>
      )}

      <Routes>
        {/* ---------- Public routes ---------- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/otp/request" element={<OTPRequestPage />} />
        <Route path="/otp/verify" element={<OTPVerifyPage />} />
        <Route path="/otp/new-password" element={<OTPNewPasswordPage />} />
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route path="/password-reset-confirm" element={<PasswordResetConfirmPage />} />

        {/* ---------- Protected (user) routes ---------- */}
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

        {/* ---------- Admin-only routes ---------- */}
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
      </Routes>
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
