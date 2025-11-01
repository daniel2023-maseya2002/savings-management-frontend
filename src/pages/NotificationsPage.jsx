import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await axios.get("/notifications/");
      setItems(res.data.results ?? res.data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`/notifications/${id}/mark-read/`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "0 20px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 24,
          color: "#1e293b",
        }}
      >
        Notifications
      </h2>

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
          <p style={{ marginTop: 16, color: "#64748b" }}>Loading...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            color: "#475569",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 500 }}>No notifications yet 🎉</p>
          <p style={{ marginTop: 6, color: "#64748b" }}>
            You’ll see updates and alerts here once available.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {items.map((n) => (
            <div
              key={n.id}
              style={{
                background: n.read ? "#ffffff" : "#fefce8",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "16px 20px",
                boxShadow: n.read
                  ? "0 2px 6px rgba(0,0,0,0.03)"
                  : "0 2px 10px rgba(0,0,0,0.08)",
                transition: "0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <strong
                  style={{
                    fontSize: 16,
                    color: n.read ? "#334155" : "#1e293b",
                  }}
                >
                  {n.title}
                </strong>
                <small style={{ color: "#94a3b8" }}>
                  {new Date(n.created_at).toLocaleString()}
                </small>
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 15,
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                {n.body}
              </div>

              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  style={{
                    marginTop: 12,
                    background: "#21c066",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 14,
                    cursor: "pointer",
                    fontWeight: 600,
                    transition: "background 0.2s ease",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#18a354")}
                  onMouseOut={(e) => (e.target.style.background = "#21c066")}
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
