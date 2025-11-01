import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import dayjs from "dayjs";

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState("-date_joined");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    balance: "0.00",
    is_active: true,
    is_staff: false,
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (ordering) params.ordering = ordering;
      const res = await axios.get("/admin/users/", { params });
      const data = res.data?.results ?? res.data;
      setRows(data || []);
    } catch (e) {
      console.error(e);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/admin/users/", form);
      setCreating(false);
      setForm({ username: "", email: "", password: "", balance: "0.00", is_active: true, is_staff: false });
      fetchUsers();
      alert("User created.");
    } catch {
      alert("Create failed.");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await axios.delete(`/admin/users/${id}/`);
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.detail || "Delete failed.");
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditForm({
      username: row.username,
      email: row.email,
      balance: row.balance,
      is_active: row.is_active,
      is_staff: row.is_staff,
    });
  };

  const onEditSave = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/admin/users/${editing.id}/`, editForm);
      setEditing(null);
      fetchUsers();
    } catch {
      alert("Update failed.");
    }
  };

  const toggleActive = async (row) => {
    try {
      const res = await axios.post(`/admin/users/${row.id}/toggle_active/`);
      fetchUsers();
      alert(`Active: ${res.data.is_active}`);
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to toggle.");
    }
  };

  const setRole = async (row, value) => {
    try {
      await axios.post(`/admin/users/${row.id}/set_role/`, { is_staff: value });
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to set role.");
    }
  };

  const setPassword = async (row) => {
    const pwd = prompt(`New password for ${row.username} (min 8 chars):`);
    if (!pwd) return;
    try {
      await axios.post(`/admin/users/${row.id}/set_password/`, { new_password: pwd });
      alert("Password updated.");
    } catch {
      alert("Failed to set password.");
    }
  };

  return (
    <div style={{ padding: 24, background: "#0f172a", color: "#e5e7eb", minHeight: "100vh" }}>
      <h2 style={{ color: "#22d3ee" }}>Admin · Users</h2>

      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <input
          placeholder="Search (username/email)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            background: "#1e293b",
            color: "#e5e7eb",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "6px 8px",
          }}
        />
        <select
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
          style={{
            background: "#1e293b",
            color: "#e5e7eb",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "6px 8px",
          }}
        >
          <option value="-date_joined">Newest</option>
          <option value="date_joined">Oldest</option>
          <option value="username">Username A–Z</option>
          <option value="-username">Username Z–A</option>
          <option value="email">Email A–Z</option>
          <option value="-email">Email Z–A</option>
          <option value="-last_login">Recent Login</option>
        </select>
        <button
          onClick={fetchUsers}
          disabled={loading}
          style={{
            background: "#2563eb",
            color: "#f8fafc",
            border: "none",
            borderRadius: 4,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
        <button
          onClick={() => setCreating(true)}
          style={{
            background: "#22c55e",
            color: "#f8fafc",
            border: "none",
            borderRadius: 4,
            padding: "6px 10px",
            cursor: "pointer",
          }}
        >
          + New User
        </button>
      </div>

      {/* Create user form */}
      {creating && (
        <form
          onSubmit={onCreate}
          style={{
            padding: 16,
            border: "1px solid #334155",
            marginBottom: 16,
            borderRadius: 8,
            background: "#1e293b",
          }}
        >
          <h4 style={{ color: "#38bdf8" }}>Create User</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={inputStyle} />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} />
            <input placeholder="Balance" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} style={inputStyle} />
            <label style={{ color: "#cbd5e1" }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
            <label style={{ color: "#cbd5e1" }}>
              <input type="checkbox" checked={form.is_staff} onChange={(e) => setForm({ ...form, is_staff: e.target.checked })} /> Admin
            </label>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button type="submit" style={btnPrimary}>Create</button>
            <button type="button" onClick={() => setCreating(false)} style={btnCancel}>Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table width="100%" cellPadding="8" style={{ background: "#1e293b", borderCollapse: "collapse", color: "#e2e8f0" }}>
          <thead>
            <tr style={{ background: "#334155" }}>
              <th>Username</th>
              <th>Email</th>
              <th>Balance</th>
              <th>Active</th>
              <th>Admin</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #334155" }}>
                <td>{r.username}</td>
                <td>{r.email}</td>
                <td>{r.balance}</td>
                <td>{r.is_active ? "Yes" : "No"}</td>
                <td>{r.is_staff ? "Yes" : "No"}</td>
                <td>{dayjs(r.date_joined).format("YYYY-MM-DD HH:mm")}</td>
                <td>{r.last_login ? dayjs(r.last_login).format("YYYY-MM-DD HH:mm") : "-"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(r)} style={btnSmall}>Edit</button>{" "}
                  <button onClick={() => toggleActive(r)} style={btnSmall}>{r.is_active ? "Block" : "Unblock"}</button>{" "}
                  <button onClick={() => setRole(r, !r.is_staff)} style={btnSmall}>{r.is_staff ? "Remove Admin" : "Make Admin"}</button>{" "}
                  <button onClick={() => setPassword(r)} style={btnSmall}>Set Password</button>{" "}
                  <button onClick={() => onDelete(r.id)} style={{ ...btnSmall, color: "#ef4444" }}>Delete</button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 16 }}>No users</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit form */}
      {editing && (
        <form
          onSubmit={onEditSave}
          style={{
            marginTop: 16,
            padding: 16,
            border: "1px solid #334155",
            borderRadius: 8,
            background: "#1e293b",
          }}
        >
          <h4 style={{ color: "#38bdf8" }}>Edit User: {editing.username}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input placeholder="Username" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} style={inputStyle} />
            <input placeholder="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} style={inputStyle} />
            <input placeholder="Balance" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} style={inputStyle} />
            <label style={{ color: "#cbd5e1" }}>
              <input type="checkbox" checked={!!editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} /> Active
            </label>
            <label style={{ color: "#cbd5e1" }}>
              <input type="checkbox" checked={!!editForm.is_staff} onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })} /> Admin
            </label>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button type="submit" style={btnPrimary}>Save</button>
            <button type="button" onClick={() => setEditing(null)} style={btnCancel}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------- Shared Inline Styles ---------- */
const inputStyle = {
  background: "#0f172a",
  color: "#f1f5f9",
  border: "1px solid #334155",
  borderRadius: 4,
  padding: "6px 8px",
};

const btnPrimary = {
  background: "#2563eb",
  color: "#f8fafc",
  border: "none",
  borderRadius: 4,
  padding: "6px 10px",
  cursor: "pointer",
};

const btnCancel = {
  background: "#475569",
  color: "#f8fafc",
  border: "none",
  borderRadius: 4,
  padding: "6px 10px",
  cursor: "pointer",
};

const btnSmall = {
  background: "transparent",
  color: "#38bdf8",
  border: "1px solid #334155",
  borderRadius: 4,
  padding: "4px 6px",
  cursor: "pointer",
  fontSize: "12px",
};
