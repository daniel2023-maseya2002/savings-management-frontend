import { useContext } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNav from "./components/TopNav";
import { AuthContext, AuthProvider } from "./context/AuthContext";

// Pages
import AdminRoute from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import OTPNewPasswordPage from "./pages/OTPNewPasswordPage"; // 👈 ADD THIS
import OTPRequestPage from "./pages/OTPRequestPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import PasswordResetRequestPage from "./pages/PasswordResetRequestPage";
import TransactionsPage from "./pages/TransactionsPage";

function AppContent() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Hide TopNav on login, OTP, and password-reset pages
  const hideNav = [
    "/login",
    "/otp/request",
    "/otp/verify",
    "/otp/new-password", // 👈 Include new password page
    "/password-reset",
    "/password-reset-confirm",
  ].includes(location.pathname);

  return (
    <>
      {/* 👇 Only show TopNav if the user is logged in and not on login/reset/OTP pages */}
      {!hideNav && user && <TopNav />}

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp/request" element={<OTPRequestPage />} />
        <Route path="/otp/verify" element={<OTPVerifyPage />} />
        <Route path="/otp/new-password" element={<OTPNewPasswordPage />} /> {/* ✅ */}
        <Route path="/password-reset" element={<PasswordResetRequestPage />} />
        <Route
          path="/password-reset-confirm"
          element={<PasswordResetConfirmPage />}
        />

        {/* Protected routes */}
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

        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
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
