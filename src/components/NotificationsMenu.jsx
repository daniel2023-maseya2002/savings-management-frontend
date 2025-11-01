import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function NotificationsMenu() {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get("/notifications/");
      const list = res.data.results ?? res.data;
      setItems(list.slice(0, 6));
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`/notifications/${id}/mark-read/`);
      toast.success("Notification marked as read");
      load();
    } catch (err) {
      toast.error("Could not mark as read");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* 🔔 Notification Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: 22,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              background: "#ef4444",
              color: "white",
              borderRadius: "50%",
              fontSize: 12,
              fontWeight: 600,
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 4px rgba(0,0,0,0.15)",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* 🔽 Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "120%",
            right: 0,
            width: 380,
            background: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
            zIndex: 100,
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #e2e8f0",
              padding: "12px 16px",
              fontWeight: 600,
              color: "#1e293b",
              background: "#f8fafc",
            }}
          >
            Notifications
          </div>

          {/* Empty */}
          {items.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#64748b",
                fontSize: 15,
              }}
            >
              No notifications yet 🎉
            </div>
          ) : (
            <div
              style={{
                maxHeight: 350,
                overflowY: "auto",
                scrollbarWidth: "thin",
              }}
            >
              {items.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    background: n.read ? "#fff" : "#fefce8",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "default",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = n.read ? "#f8fafc" : "#fef9c3")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "#fff" : "#fefce8")}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#334155" }}>
                      {n.title}
                    </div>
                    <small style={{ color: "#94a3b8" }}>
                      {new Date(n.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#475569",
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {n.body}
                  </div>

                  {!n.read && (
                    <button
                      onClick={() => markRead(n.id)}
                      style={{
                        background: "#21c066",
                        color: "white",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 10px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                      onMouseOver={(e) => (e.target.style.background = "#17a859")}
                      onMouseOut={(e) => (e.target.style.background = "#21c066")}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              padding: "12px 16px",
              textAlign: "center",
              background: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <Link
              to="/notifications"
              style={{
                color: "#21c066",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              View all notifications →
            </Link>
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
