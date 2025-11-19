// src/pages/AdminPeerTransfersPage.jsx
import { motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    DollarSign,
    Filter,
    RefreshCcw,
    Search,
    TrendingUp,
    Users,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AdminPeerTransfersPage() {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [filterUser, setFilterUser] = useState("");
  const [status, setStatus] = useState("");
  const [actionId, setActionId] = useState(null); // which transfer is being approved/rejected

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filterUser) params.user_id = filterUser;
      if (status) params.status = status;

      const res = await axios.get("/peer/transfers/admin/", { params });
      setTransfers(res.data);
      toast.success("Transfers loaded successfully");
    } catch (err) {
      console.error("Admin cannot load transfers:", err);
      toast.error("Failed to load transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin approve / reject handler
  const handleAdminAction = async (id, action) => {
    try {
      setActionId(id);
      const payload =
        action === "complete"
          ? { action: "complete" }
          : { action: "fail", reason: "admin_rejected" };

      await axios.post(`/peer/transfers/${id}/admin-approve/`, payload);

      toast.success(
        action === "complete"
          ? "Transfer approved and processed."
          : "Transfer rejected successfully."
      );
      await loadTransfers();
    } catch (err) {
      console.error("Admin action failed:", err);
      const msg =
        err.response?.data?.detail ||
        "Failed to apply admin action on this transfer.";
      toast.error(msg);
    } finally {
      setActionId(null);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = transfers.reduce(
      (acc, t) => acc + Number(t.amount || 0),
      0
    );
    const totalFees = transfers.reduce(
      (acc, t) => acc + Number(t.fee || 0),
      0
    );
    const completed = transfers.filter(
      (t) => t.status?.toLowerCase() === "completed"
    ).length;
    const pending = transfers.filter(
      (t) => t.status?.toLowerCase() === "requested"
    ).length;

    return {
      totalVolume: total,
      totalFees,
      totalCount: transfers.length,
      completedCount: completed,
      pendingCount: pending,
    };
  }, [transfers]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 flex flex-col gap-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10">
              <Users className="w-8 h-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
                Peer Transfers Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Monitor and manage all peer-to-peer transactions
              </p>
            </div>
          </div>

          <button
            onClick={loadTransfers}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 border border-emerald-500/30 hover:from-emerald-600/30 hover:to-emerald-500/30 text-emerald-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/10"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-5 gap-6"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950/40 border border-cyan-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Total Volume
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-cyan-300">
              ${fmtMoney(stats.totalVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-2">All transfers</div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Total Fees
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-300">
              ${fmtMoney(stats.totalFees)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Platform revenue
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-950/40 border border-purple-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                All Transfers
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-300">
              {stats.totalCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Total transactions
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-950/40 border border-blue-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Completed
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-blue-300">
              {stats.completedCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Successful transfers
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-950/40 border border-amber-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Pending
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-300">
              {stats.pendingCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">Awaiting process</div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Filter className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Filters
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Refine your search results
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  <Search className="w-3.5 h-3.5 inline-block mr-1.5" />
                  Filter by User ID
                </label>
                <input
                  type="text"
                  placeholder="Enter user ID"
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Status Filter
                </label>
                <select
                  className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={loadTransfers}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 text-sm font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300"
                >
                  <Filter className="w-4 h-4" />
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Transfers List */}
        <motion.div
          className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    All Transfers
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {transfers.length} transactions found
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-48 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse"
                  />
                ))}
              </div>
            ) : transfers.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex p-5 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                  <Activity className="w-12 h-12 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  No Transfers Found
                </h3>
                <p className="text-slate-500">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transfers.map((t) => {
                  const isCompleted =
                    t.status?.toLowerCase() === "completed";
                  const isFailed =
                    t.status?.toLowerCase() === "failed";
                  const isRequested =
                    t.status?.toLowerCase() === "requested";
                  const isActing = actionId === t.id;

                  return (
                    <div
                      key={t.id}
                      className="group rounded-2xl border border-slate-800/50 bg-gradient-to-br from-slate-900/70 to-slate-950/70 p-6 hover:border-slate-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                            <ArrowUpRight className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-slate-100 mb-1">
                              {fmtMoney(t.amount)}{" "}
                              <span className="text-base text-slate-400">
                                {t.currency}
                              </span>
                            </div>
                            <div className="text-sm text-slate-400">
                              From{" "}
                              <span className="font-semibold text-cyan-300">
                                {t.created_by_username}
                              </span>
                              {" → "}
                              To{" "}
                              <span className="font-semibold text-emerald-300">
                                {t.to_username}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : isFailed
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isFailed ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {t.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Platform Fee
                          </div>
                          <div className="text-base font-semibold text-amber-300">
                            {fmtMoney(t.fee)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Net Amount
                          </div>
                          <div className="text-base font-semibold text-emerald-300">
                            {fmtMoney(t.net_amount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Sender Balance
                          </div>
                          <div className="text-sm text-slate-300">
                            <span className="text-rose-400">
                              {fmtMoney(t.from_balance_before)}
                            </span>
                            {" → "}
                            <span className="text-emerald-400">
                              {fmtMoney(t.from_balance_after)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 mb-1">
                            Created At
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(t.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {t.reference && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50">
                          <div className="text-xs text-slate-500 mb-1">
                            Reference
                          </div>
                          <div className="text-sm text-slate-300">
                            {t.reference}
                          </div>
                        </div>
                      )}

                      {/* Admin actions: Approve / Reject for requested transfers */}
                      {isRequested && (
                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex flex-wrap gap-3 justify-end">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() =>
                              handleAdminAction(t.id, "fail")
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600/80 to-rose-500/80 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-semibold shadow-lg shadow-rose-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isActing ? (
                              <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            Reject
                          </button>

                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() =>
                              handleAdminAction(t.id, "complete")
                            }
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-emerald-500/80 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isActing ? (
                              <RefreshCcw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
