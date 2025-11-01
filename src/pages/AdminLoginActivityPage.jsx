import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import dayjs from "dayjs";

export default function AdminLoginActivityPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fromDt, setFromDt] = useState("");
  const [toDt, setToDt] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (username) params.user = username;
      if (email) params.email = email;
      if (fromDt) params.from = new Date(fromDt).toISOString();
      if (toDt) params.to = new Date(toDt).toISOString();

      const res = await axios.get("/admin/login-activity/", { params });
      const data = res.data?.results ?? res.data;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load login activity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#121212",
        color: "#e0e0e0",
        padding: "32px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <h2 style={{ marginBottom: 24, fontSize: 24, color: "#90caf9" }}>
        🧾 Login Activity
      </h2>

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr)) auto",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <input
          placeholder="Search (device/ip/ua)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="datetime-local"
          value={fromDt}
          onChange={(e) => setFromDt(e.target.value)}
          style={inputStyle}
        />
        <input
          type="datetime-local"
          value={toDt}
          onChange={(e) => setToDt(e.target.value)}
          style={inputStyle}
        />
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Loading..." : "Filter"}
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: 8 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "#1e1e1e",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#2a2a2a", color: "#90caf9" }}>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Device</th>
              <th style={thStyle}>IP</th>
              <th style={thStyle}>User Agent</th>
              <th style={thStyle}>Success</th>
              <th style={thStyle}>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: "1px solid #333",
                  backgroundColor: r.success ? "#1b2838" : "#2b1d1d",
                }}
              >
                <td style={tdStyle}>
                  {dayjs(r.created_at).format("YYYY-MM-DD HH:mm:ss")}
                </td>
                <td style={tdStyle}>{r.username}</td>
                <td style={tdStyle}>{r.email}</td>
                <td style={tdStyle}>{r.device_id}</td>
                <td style={tdStyle}>{r.ip_address}</td>
                <td style={{ ...tdStyle, maxWidth: 320, wordBreak: "break-word" }}>
                  {r.user_agent}
                </td>
                <td style={{ ...tdStyle, color: r.success ? "#81c784" : "#e57373" }}>
                  {r.success ? "✅ Yes" : "❌ No"}
                </td>
                <td style={tdStyle}>{r.message}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 16, color: "#aaa" }}>
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputStyle = {
  backgroundColor: "#1e1e1e",
  border: "1px solid #333",
  color: "#e0e0e0",
  borderRadius: 6,
  padding: "8px 10px",
  outline: "none",
};

const thStyle = {
  padding: "10px 12px",
  textAlign: "left",
  fontWeight: 600,
  fontSize: 14,
};

const tdStyle = {
  padding: "10px 12px",
  fontSize: 13,
};
