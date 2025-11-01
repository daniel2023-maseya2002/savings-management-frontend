import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/admin/analytics/");
        setStats(res.data);
      } catch (err) {
        console.warn("No admin stats endpoint or error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ✅ Helper: recursively render stats
  const renderValue = (value) => {
    if (typeof value === "number" || typeof value === "string") {
      return value;
    }
    if (typeof value === "object" && value !== null) {
      return (
        <div style={{ fontSize: 14, color: "#334155", marginTop: 6 }}>
          {Object.entries(value).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 4 }}>
              <strong>{k.replace(/_/g, " ")}:</strong>{" "}
              {typeof v === "number" ? v.toLocaleString() : String(v)}
            </div>
          ))}
        </div>
      );
    }
    return String(value);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b" }}>
            Admin Dashboard
          </h1>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#21c066",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              cursor: "pointer",
              fontWeight: 600,
              transition: "0.2s ease",
            }}
            onMouseOver={(e) => (e.target.style.background = "#1a9e53")}
            onMouseOut={(e) => (e.target.style.background = "#21c066")}
          >
            Refresh
          </button>
        </header>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: 60 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "6px solid #e5e7eb",
                borderTopColor: "#21c066",
                margin: "auto",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ marginTop: 16, color: "#64748b" }}>Loading dashboard...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : stats ? (
          <div>
            {/* === STATS GRID === */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 20,
                marginBottom: 30,
              }}
            >
              {Object.entries(stats).map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "20px 24px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <h3
                    style={{
                      textTransform: "capitalize",
                      fontSize: 15,
                      color: "#64748b",
                      marginBottom: 6,
                    }}
                  >
                    {key.replace(/_/g, " ")}
                  </h3>
                  <p
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#21c066",
                      margin: 0,
                    }}
                  >
                    {renderValue(value)}
                  </p>
                </div>
              ))}
            </div>

            {/* === RAW DATA DISPLAY === */}
            <div
              style={{
                background: "white",
                padding: 20,
                borderRadius: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                border: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: "#334155",
                }}
              >
                Raw API Data
              </h3>
              <pre
                style={{
                  background: "#f1f5f9",
                  padding: 12,
                  borderRadius: 8,
                  overflowX: "auto",
                  fontSize: 14,
                }}
              >
                {JSON.stringify(stats, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              textAlign: "center",
              color: "#475569",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              No Admin Stats Available
            </h3>
            <p>
              You can extend the backend to expose endpoints for reports,
              device approvals, user summaries, and more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
