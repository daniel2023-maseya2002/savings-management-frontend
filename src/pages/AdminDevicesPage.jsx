import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Laptop,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";

const cls = (...x) => x.filter(Boolean).join(" ");

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get("/admin/devices/?status=pending");
      const list = res.data.results ?? res.data;
      setDevices(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load devices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const actOn = async (id, action) => {
    try {
      const url = `/admin/devices/${id}/${action}/`;
      await axios.post(url);
      toast.success(`Device ${action}d successfully`);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.detail || `Failed to ${action}.`;
      toast.error(msg);
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const pendingCount = useMemo(() => devices.length, [devices]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col overflow-hidden pt-24">
      {/* ^^^ Added pt-24 to push content below your top navbar */}

      {/* HEADER */}
      <motion.header
        className="flex items-center justify-between px-10 py-6 border-b border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-t-2xl"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 shadow-inner">
            <ShieldCheck className="w-7 h-7 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              Admin Device Approvals
            </h1>
            <p className="text-gray-400 text-sm">Secure access management panel</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={cls(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5",
            "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300",
            "hover:bg-emerald-600/30 transition-all shadow",
            refreshing && "opacity-60 cursor-not-allowed"
          )}
        >
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </>
          )}
        </button>
      </motion.header>

      {/* STATS */}
      <motion.section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-10 py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {[
          {
            label: "Pending Devices",
            value: pendingCount,
            color: "from-cyan-500/30 to-cyan-600/10",
            icon: <Laptop className="w-5 h-5 text-cyan-300" />,
          },
          {
            label: "Admin Activity",
            value: "Live",
            color: "from-emerald-500/30 to-emerald-600/10",
            icon: <ShieldCheck className="w-5 h-5 text-emerald-300" />,
          },
          {
            label: "System Health",
            value: "Good",
            color: "from-blue-500/30 to-blue-600/10",
            icon: <CheckCircle2 className="w-5 h-5 text-blue-300" />,
          },
          {
            label: "Last Sync",
            value: new Date().toLocaleTimeString(),
            color: "from-purple-500/30 to-purple-600/10",
            icon: <Clock className="w-5 h-5 text-purple-300" />,
          },
        ].map((c) => (
          <div
            key={c.label}
            className={cls(
              "rounded-2xl border border-white/10 backdrop-blur-xl p-4 bg-gradient-to-br shadow-lg",
              c.color
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{c.label}</span>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                {c.icon}
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </motion.section>

      {/* TABLE */}
      <main className="flex-1 overflow-y-auto px-10 pb-10">
        <motion.div
          className="w-full max-w-7xl mx-auto rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-cyan-300" />
              <h2 className="text-lg font-semibold text-gray-100">
                Pending Device Requests
              </h2>
            </div>
            <span className="text-xs text-gray-400">Admin Access Review</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/5 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="px-6 py-20 text-center text-gray-500">
              No pending devices.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wide bg-white/5">
                    <th className="py-3 px-6">User</th>
                    <th className="py-3 px-6">Email</th>
                    <th className="py-3 px-6">Device ID</th>
                    <th className="py-3 px-6">Requested At</th>
                    <th className="py-3 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {devices.map((d) => (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.25 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-6 flex items-center gap-2">
                          <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                            <User className="w-4 h-4 text-cyan-300" />
                          </div>
                          {d.username}
                        </td>
                        <td className="py-4 px-6 flex items-center gap-2 text-gray-300">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {d.user_email}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {d.device_id}
                        </td>
                        <td className="py-4 px-6 text-gray-300">
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 flex gap-2">
                          <button
                            onClick={() => actOn(d.id, "approve")}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm
                              bg-emerald-600/20 border border-emerald-500/30 text-emerald-300
                              hover:bg-emerald-600/30 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => actOn(d.id, "reject")}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm
                              bg-rose-600/20 border border-rose-500/30 text-rose-300
                              hover:bg-rose-600/30 transition-all"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
