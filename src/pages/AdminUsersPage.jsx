// AdminUsersPage.jsx
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  RefreshCcw,
  Search,
  Shield,
  ShieldCheck,
  SortDesc,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";

/* ---------------------------- helpers & components ---------------------------- */
const cls = (...x) => x.filter(Boolean).join(" ");

const orderOptions = [
  { value: "-date_joined", label: "Newest" },
  { value: "date_joined", label: "Oldest" },
  { value: "username", label: "Username A–Z" },
  { value: "-username", label: "Username Z–A" },
  { value: "email", label: "Email A–Z" },
  { value: "-email", label: "Email Z–A" },
  { value: "-last_login", label: "Recent Login" },
];

function useTopLoader(active) {
  const [w, setW] = useState(0);
  useEffect(() => {
    let i;
    if (active) {
      setW(10);
      i = setInterval(() => setW((p) => (p < 88 ? p + Math.random() * 9 : p)), 220);
    } else {
      setW(100);
      const t = setTimeout(() => setW(0), 380);
      return () => clearTimeout(t);
    }
    return () => clearInterval(i);
  }, [active]);
  return w;
}

const TextInput = ({ icon: Icon, className = "", ...props }) => (
  <div className={cls("relative", className)}>
    {Icon && (
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/90" />
    )}
    <input
      {...props}
      className={cls(
        "w-full rounded-xl border border-transparent bg-gray-900/60 px-10 py-3 text-sm text-white",
        "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      )}
    />
  </div>
);

const NumberInput = (p) => <TextInput {...p} inputMode="decimal" />;

const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={cls(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ring-1 transition-all select-none",
      checked ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20" : "bg-slate-700/10 text-slate-300 ring-slate-700/20"
    )}
  >
    {checked ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
    {checked ? "Active" : "Inactive"}
  </button>
);

const RolePill = ({ isStaff }) => (
  <span
    className={cls(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ring-1",
      isStaff ? "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20" : "bg-slate-700/10 text-slate-300 ring-slate-700/20"
    )}
  >
    {isStaff ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
    {isStaff ? "Admin" : "User"}
  </span>
);

/* Modal wrapper */
const Modal = ({ open, title, onClose, children, footer }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-gray-900/70 to-gray-900/60 p-6 shadow-2xl backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/6 bg-white/3 p-2 text-gray-300 hover:bg-white/6"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>{children}</div>
          {footer && <div className="mt-6 flex items-center justify-end gap-3">{footer}</div>}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ---------------------------- Main ---------------------------- */
export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false); // mutation busy
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState("-date_joined");

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    balance: "0.00",
    is_active: true,
    is_staff: false,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    balance: "0.00",
    is_active: true,
    is_staff: false,
  });

  const topWidth = useTopLoader(loading || busy);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (q) params.search = q;
      if (ordering) params.ordering = ordering;
      const res = await axios.get("/admin/users/", { params });
      const data = res.data?.results ?? res.data;
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 420);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, ordering]);

  /* ---------------------------- summary counts ---------------------------- */
  const counts = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.is_active).length;
    const admins = rows.filter((r) => r.is_staff).length;
    // recent signups = joined in last 7 days
    const recent = rows.filter((r) => {
      if (!r.date_joined) return false;
      return dayjs().diff(dayjs(r.date_joined), "day") <= 7;
    }).length;
    return { total, active, admins, recent };
  }, [rows]);

  /* ---------------------------- actions (unchanged behaviour) ---------------------------- */
  const onCreate = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    try {
      await axios.post("/admin/users/", createForm);
      toast.success("User created.");
      setCreateOpen(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        balance: "0.00",
        is_active: true,
        is_staff: false,
      });
      await fetchUsers();
    } catch (e2) {
      const msg = e2?.response?.data?.detail || "Create failed.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onOpenEdit = (row) => {
    setEditRow(row);
    setEditForm({
      username: row.username || "",
      email: row.email || "",
      balance: row.balance ?? "0.00",
      is_active: !!row.is_active,
      is_staff: !!row.is_staff,
    });
    setEditOpen(true);
  };

  const onEditSave = async (e) => {
    e?.preventDefault?.();
    if (!editRow) return;
    setBusy(true);
    try {
      await axios.patch(`/admin/users/${editRow.id}/`, editForm);
      toast.success("User updated.");
      setEditOpen(false);
      setEditRow(null);
      await fetchUsers();
    } catch (e2) {
      toast.error("Update failed.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (row) => {
    if (!confirm(`Delete ${row.username}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await axios.delete(`/admin/users/${row.id}/`);
      toast.success("User deleted.");
      await fetchUsers();
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row) => {
    setBusy(true);
    try {
      const res = await axios.post(`/admin/users/${row.id}/toggle_active/`);
      toast.success(`Active: ${res.data?.is_active ? "Yes" : "No"}`);
      await fetchUsers();
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || "Failed to toggle.");
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (row, value) => {
    setBusy(true);
    try {
      await axios.post(`/admin/users/${row.id}/set_role/`, { is_staff: value });
      toast.success(value ? "Granted admin." : "Removed admin.");
      await fetchUsers();
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || "Failed to set role.");
    } finally {
      setBusy(false);
    }
  };

  const setPassword = async (row) => {
    const pwd = prompt(`New password for ${row.username} (min 8 chars):`);
    if (!pwd) return;
    setBusy(true);
    try {
      await axios.post(`/admin/users/${row.id}/set_password/`, { new_password: pwd });
      toast.success("Password updated.");
    } catch {
      toast.error("Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------------------------- UI ---------------------------- */
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* top slim loader */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 transition-[width] duration-200 ease-out"
          style={{ width: `${topWidth}%` }}
        />
      </div>

      {/* glow decorations + pushed down (space for hidden top nav) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-56 -top-36 h-96 w-96 rotate-12 rounded-full bg-gradient-to-br from-cyan-800/20 to-emerald-600/6 opacity-70 blur-3xl" />
        <div className="absolute -right-56 -bottom-36 h-96 w-96 -rotate-12 rounded-full bg-gradient-to-br from-emerald-800/18 to-cyan-700/6 opacity-50 blur-3xl" />
      </div>

      <div className="relative z-10 px-6 md:px-10 lg:px-14 pt-24 pb-16">
        {/* header */}
        <motion.header initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/8 bg-white/3 p-3 backdrop-blur-lg">
                <Users className="h-8 w-8 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Admin · Users
                </h1>
                <p className="text-sm text-gray-400 mt-1">Manage accounts, roles & access — secure and fast.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold shadow-lg hover:brightness-105"
                title="New user"
              >
                <UserPlus className="h-4 w-4" />
              </button>

              <button
                onClick={fetchUsers}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-cyan-200 ring-1 ring-white/8 hover:bg-white/6"
                title="Refresh"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.header>

        {/* summary cards */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl p-4 border border-white/8 bg-gradient-to-br from-gray-900/60 to-gray-900/50 backdrop-blur-lg shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-300">Total users</div>
                <div className="mt-2 text-2xl font-semibold">{counts.total}</div>
                <div className="text-xs text-gray-400 mt-1">All accounts</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/6">
                <Users className="h-6 w-6 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/8 bg-gradient-to-br from-gray-900/60 to-gray-900/50 backdrop-blur-lg shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-300">Active</div>
                <div className="mt-2 text-2xl font-semibold">{counts.active}</div>
                <div className="text-xs text-gray-400 mt-1">Currently active</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/6">
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/8 bg-gradient-to-br from-gray-900/60 to-gray-900/50 backdrop-blur-lg shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-300">Admins</div>
                <div className="mt-2 text-2xl font-semibold">{counts.admins}</div>
                <div className="text-xs text-gray-400 mt-1">Staff accounts</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/6">
                <Shield className="h-6 w-6 text-cyan-300" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-4 border border-white/8 bg-gradient-to-br from-gray-900/60 to-gray-900/50 backdrop-blur-lg shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-300">Recent signups</div>
                <div className="mt-2 text-2xl font-semibold">{counts.recent}</div>
                <div className="text-xs text-gray-400 mt-1">Last 7 days</div>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/6">
                <DollarSign className="h-6 w-6 text-emerald-300" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* filters */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextInput icon={Search} placeholder="Search (username or email)" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="relative md:col-span-1">
            <SortDesc className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/80" />
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              className="w-full appearance-none rounded-xl border border-transparent bg-gray-900/60 px-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {orderOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/4 px-3 py-2 text-sm text-gray-300">
              {rows.length} {rows.length === 1 ? "user" : "users"}
            </div>
            <div className="text-sm text-gray-400">Quick actions & filters</div>
          </div>
        </motion.div>

        {/* table panel */}
        <div className="mx-auto overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-gray-900/50 to-gray-900/40 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-300" />
              <h3 className="text-lg font-semibold text-gray-100">User Directory</h3>
            </div>
            <div className="text-xs text-gray-400">Secure user management</div>
          </div>

          <div className="max-h-[calc(100vh-340px)] overflow-auto">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl border border-white/6 bg-white/4" />
                ))}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur-md">
                  <tr className="text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Balance</th>
                    <th className="px-6 py-3">Active</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/6">
                  <AnimatePresence initial={false}>
                    {rows.map((r) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="hover:bg-white/4"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-white/6 bg-white/3 p-2">
                              <User className="h-4 w-4 text-cyan-300" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-100">{r.username}</div>
                              <div className="text-xs text-gray-400">{r.id ? `ID: ${r.id}` : ""}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex items-center gap-2 max-w-[28ch] truncate">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{r.email}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-200">
                            <DollarSign className="h-4 w-4 text-emerald-300" />
                            {(Number(r.balance) || 0).toLocaleString()}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Switch checked={!!r.is_active} onChange={() => toggleActive(r)} />
                        </td>

                        <td className="px-6 py-4">
                          <RolePill isStaff={!!r.is_staff} />
                        </td>

                        <td className="px-6 py-4 text-gray-300">
                          {r.date_joined ? dayjs(r.date_joined).format("YYYY-MM-DD HH:mm") : "—"}
                        </td>

                        <td className="px-6 py-4 text-gray-300">
                          {r.last_login ? dayjs(r.last_login).format("YYYY-MM-DD HH:mm") : "—"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* Icon-only action buttons (titles for accessibility) */}
                            <button
                              title="Edit user"
                              onClick={() => onOpenEdit(r)}
                              className="inline-flex items-center justify-center rounded-lg border border-white/6 bg-white/4 p-2 text-xs text-gray-200 hover:bg-white/6"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              title={r.is_staff ? "Remove admin" : "Make admin"}
                              onClick={() => setRole(r, !r.is_staff)}
                              className="inline-flex items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/8 p-2 text-xs text-emerald-200 hover:bg-emerald-300/12"
                            >
                              <Shield className="h-4 w-4" />
                            </button>

                            <button
                              title="Set password"
                              onClick={() => setPassword(r)}
                              className="inline-flex items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/8 p-2 text-xs text-cyan-200 hover:bg-cyan-300/12"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>

                            <button
                              title="Delete user"
                              onClick={() => onDelete(r)}
                              className="inline-flex items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/8 p-2 text-xs text-rose-200 hover:bg-rose-500/12"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}

                    {!rows.length && !loading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-14 text-center text-gray-400">
                          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-gray-500" />
                          No users found.
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Modal */}
        <Modal
          open={createOpen}
          title="Create User"
          onClose={() => setCreateOpen(false)}
          footer={
            <>
              <button
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border border-white/6 bg-white/4 px-4 py-2 text-sm text-gray-200 hover:bg-white/6"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              icon={User}
              placeholder="Username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            />
            <TextInput
              icon={Mail}
              type="email"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
            <TextInput
              icon={KeyRound}
              type="password"
              placeholder="Password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            />
            <NumberInput
              icon={DollarSign}
              placeholder="Balance"
              value={createForm.balance}
              onChange={(e) => setCreateForm({ ...createForm, balance: e.target.value })}
            />

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/4 p-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-gray-200">Active</span>
              </div>
              <Switch
                checked={createForm.is_active}
                onChange={(v) => setCreateForm({ ...createForm, is_active: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/4 p-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-gray-200">Admin role</span>
              </div>
              <Switch
                checked={createForm.is_staff}
                onChange={(v) => setCreateForm({ ...createForm, is_staff: v })}
              />
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          open={editOpen}
          title={editRow ? `Edit User · ${editRow.username}` : "Edit User"}
          onClose={() => {
            setEditOpen(false);
            setEditRow(null);
          }}
          footer={
            <>
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditRow(null);
                }}
                className="rounded-xl border border-white/6 bg-white/4 px-4 py-2 text-sm text-gray-200 hover:bg-white/6"
              >
                Cancel
              </button>
              <button
                onClick={onEditSave}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                Save
              </button>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              icon={User}
              placeholder="Username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
            />
            <TextInput
              icon={Mail}
              type="email"
              placeholder="Email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <NumberInput
              icon={DollarSign}
              placeholder="Balance"
              value={editForm.balance}
              onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
            />

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/4 p-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span className="text-sm text-gray-200">Active</span>
              </div>
              <Switch
                checked={!!editForm.is_active}
                onChange={(v) => setEditForm({ ...editForm, is_active: v })}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/6 bg-white/4 p-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-cyan-300" />
                <span className="text-sm text-gray-200">Admin role</span>
              </div>
              <Switch
                checked={!!editForm.is_staff}
                onChange={(v) => setEditForm({ ...editForm, is_staff: v })}
              />
            </div>

            {editRow && (
              <div className="mt-1 md:col-span-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setPassword(editRow)}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-300/12"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Set Password
                </button>
                <button
                  onClick={() => setRole(editRow, !editRow.is_staff)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/8 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-300/12"
                >
                  <Shield className="h-3.5 w-3.5" />
                  {editRow.is_staff ? "Remove Admin" : "Make Admin"}
                </button>
                <button
                  onClick={() => toggleActive(editRow)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/6 bg-white/4 px-3 py-2 text-xs text-gray-200 hover:bg-white/6"
                >
                  {editRow.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                  Toggle Active
                </button>
                <button
                  onClick={() => onDelete(editRow)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-xs text-rose-200 hover:bg-rose-500/12"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </Modal>
      </div>

      <ToastContainer position="top-right" autoClose={2800} />
    </div>
  );
}
