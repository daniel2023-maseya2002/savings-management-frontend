import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Laptop,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  User,
  XCircle
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
  const [actioningIds, setActioningIds] = useState(new Set());

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
    // Add to actioning set to show loading state
    setActioningIds(prev => new Set(prev).add(id));
    
    try {
      const url = `/admin/devices/${id}/${action}/`;
      const response = await axios.post(url);
      
      // Check for successful response
      if (response.status >= 200 && response.status < 300) {
        toast.success(
          `Device ${action === "approve" ? "approved" : "rejected"} successfully`,
          {
            icon: action === "approve" ? "✅" : "🚫",
          }
        );
        // Reload the list
        await load();
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (err) {
      console.error("Action error:", err);
      
      // Better error handling
      let errorMessage = `Failed to ${action} device.`;
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    } finally {
      // Remove from actioning set
      setActioningIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.info("Devices list refreshed");
  };

  const pendingCount = useMemo(() => devices.length, [devices]);

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white flex flex-col overflow-hidden pt-24 relative">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)] -z-10"></div>

      {/* HEADER */}
      <motion.header
        className="flex items-center justify-between px-10 py-6 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl shadow-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
            <ShieldCheck className="w-8 h-8 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              Device Approvals
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage pending device access requests</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={cls(
            "inline-flex items-center gap-2 rounded-xl px-6 py-3",
            "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 text-emerald-300",
            "hover:from-emerald-600/30 hover:to-emerald-500/30 transition-all duration-300 shadow-lg shadow-emerald-500/10",
            "hover:shadow-emerald-500/20 font-medium",
            refreshing && "opacity-60 cursor-not-allowed"
          )}
        >
          {refreshing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Refreshing…
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Refresh
            </>
          )}
        </button>
      </motion.header>

      {/* STATS */}
      <motion.section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-10 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {[
          {
            label: "Pending Devices",
            value: pendingCount,
            color: "from-cyan-500/20 to-cyan-600/10",
            borderColor: "border-cyan-500/30",
            icon: <Laptop className="w-6 h-6 text-cyan-400" />,
            bgIcon: "bg-cyan-500/10",
          },
          {
            label: "Admin Activity",
            value: "Active",
            color: "from-emerald-500/20 to-emerald-600/10",
            borderColor: "border-emerald-500/30",
            icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
            bgIcon: "bg-emerald-500/10",
          },
          {
            label: "System Status",
            value: "Operational",
            color: "from-blue-500/20 to-blue-600/10",
            borderColor: "border-blue-500/30",
            icon: <CheckCircle2 className="w-6 h-6 text-blue-400" />,
            bgIcon: "bg-blue-500/10",
          },
          {
            label: "Last Sync",
            value: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            color: "from-purple-500/20 to-purple-600/10",
            borderColor: "border-purple-500/30",
            icon: <Clock className="w-6 h-6 text-purple-400" />,
            bgIcon: "bg-purple-500/10",
          },
        ].map((c, idx) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1, duration: 0.5 }}
            className={cls(
              "rounded-2xl border backdrop-blur-xl p-6 bg-gradient-to-br shadow-xl",
              "hover:shadow-2xl transition-all duration-300 hover:-translate-y-1",
              c.color,
              c.borderColor
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-300">{c.label}</span>
              <div className={cls("p-2.5 rounded-xl border border-white/10", c.bgIcon)}>
                {c.icon}
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-100">{c.value}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* TABLE */}
      <main className="flex-1 overflow-y-auto px-10 pb-10">
        <motion.div
          className="w-full max-w-7xl mx-auto rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Laptop className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Pending Device Requests
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Review and manage access requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">{pendingCount} Pending</span>
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse"
                />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="px-6 py-24 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">All Clear!</h3>
              <p className="text-slate-500">No pending device requests at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-xs uppercase tracking-wider bg-slate-800/30">
                    <th className="py-4 px-8 font-semibold">User</th>
                    <th className="py-4 px-8 font-semibold">Email</th>
                    <th className="py-4 px-8 font-semibold">Device ID</th>
                    <th className="py-4 px-8 font-semibold">Requested At</th>
                    <th className="py-4 px-8 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <AnimatePresence>
                    {devices.map((d) => {
                      const isActioning = actioningIds.has(d.id);
                      
                      return (
                        <motion.tr
                          key={d.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="hover:bg-slate-800/30 transition-all duration-200 group"
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors">
                                <User className="w-4 h-4 text-cyan-400" />
                              </div>
                              <span className="font-medium text-slate-200">{d.username}</span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Mail className="w-4 h-4 text-slate-500" />
                              <span className="text-sm">{d.user_email}</span>
                            </div>
                          </td>
                          <td className="py-5 px-8">
                            <code className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-mono">
                              {d.device_id}
                            </code>
                          </td>
                          <td className="py-5 px-8 text-slate-400 text-sm">
                            {new Date(d.created_at).toLocaleString()}
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex gap-3">
                              <button
                                onClick={() => actOn(d.id, "approve")}
                                disabled={isActioning}
                                className={cls(
                                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                                  "bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 text-emerald-300",
                                  "hover:from-emerald-600/30 hover:to-emerald-500/30 transition-all duration-300",
                                  "shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20",
                                  isActioning && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {isActioning ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => actOn(d.id, "reject")}
                                disabled={isActioning}
                                className={cls(
                                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium",
                                  "bg-gradient-to-r from-rose-600/20 to-rose-500/20 border border-rose-500/30 text-rose-300",
                                  "hover:from-rose-600/30 hover:to-rose-500/30 transition-all duration-300",
                                  "shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20",
                                  isActioning && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                {isActioning ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Reject
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>

      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        theme="dark"
        toastStyle={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(71, 85, 105, 0.3)",
          backdropFilter: "blur(12px)",
        }}
      />
    </div>
  );
}