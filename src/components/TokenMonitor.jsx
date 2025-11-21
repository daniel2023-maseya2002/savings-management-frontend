// src/components/TokenMonitor.jsx
import { useEffect, useState } from "react";
import { tokenService } from "../api/axios";

/**
 * Token Monitor - Shows token expiry status in development
 * Remove or disable in production
 */
export default function TokenMonitor() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.MODE !== "development") return;

    const updateTokenInfo = () => {
      const access = tokenService.getAccess();
      if (!access) {
        setTokenInfo(null);
        return;
      }

      const expiry = tokenService.getTokenExpiry(access);
      if (!expiry) {
        setTokenInfo(null);
        return;
      }

      const minutesRemaining = Math.floor(expiry.secondsRemaining / 60);
      const isExpiringSoon = tokenService.isTokenExpiringSoon(access);

      setTokenInfo({
        expiresAt: expiry.expiresAt.toLocaleTimeString(),
        minutesRemaining,
        isExpiringSoon,
        isExpired: expiry.secondsRemaining < 0,
      });
    };

    // Update immediately
    updateTokenInfo();

    // Update every 10 seconds
    const interval = setInterval(updateTokenInfo, 10000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (import.meta.env.MODE !== "development") return null;
  if (!tokenInfo) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setShow(!show)}
        style={{
          background: tokenInfo.isExpired
            ? "#ef4444"
            : tokenInfo.isExpiringSoon
            ? "#f59e0b"
            : "#10b981",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          fontSize: "16px",
          fontWeight: "bold",
        }}
        title="Token Status"
      >
        🔑
      </button>

      {/* Info panel */}
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            right: "0",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "200px",
            fontSize: "13px",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
            🔑 Token Status
          </div>

          <div style={{ marginBottom: "4px" }}>
            <strong>Expires:</strong> {tokenInfo.expiresAt}
          </div>

          <div style={{ marginBottom: "4px" }}>
            <strong>Remaining:</strong>{" "}
            {tokenInfo.isExpired ? (
              <span style={{ color: "#ef4444" }}>Expired</span>
            ) : (
              <span
                style={{
                  color: tokenInfo.isExpiringSoon ? "#f59e0b" : "#10b981",
                }}
              >
                {tokenInfo.minutesRemaining} min
              </span>
            )}
          </div>

          <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e5e7eb" }}>
            {tokenInfo.isExpired ? (
              <span style={{ color: "#ef4444", fontSize: "12px" }}>
                ⚠️ Token expired - refresh needed
              </span>
            ) : tokenInfo.isExpiringSoon ? (
              <span style={{ color: "#f59e0b", fontSize: "12px" }}>
                ⏰ Will refresh automatically soon
              </span>
            ) : (
              <span style={{ color: "#10b981", fontSize: "12px" }}>
                ✅ Token is valid
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}