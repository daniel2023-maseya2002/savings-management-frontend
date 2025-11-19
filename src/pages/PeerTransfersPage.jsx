// src/pages/PeerTransfersPage.jsx
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Receipt,
  RefreshCcw,
  Send,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

// 10% fee (must match your backend PEER_TRANSACTIONS_FEE_PERCENT)
const FEE_PERCENT = 0.1;

// Helper for money formatting
const fmtMoney = (n) =>
  Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Try to get current username from localStorage (optional)
function getCurrentUsername() {
  try {
    const raw =
      localStorage.getItem("authUser") ||
      localStorage.getItem("user") ||
      localStorage.getItem("auth_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.username || parsed.user?.username || null;
  } catch (e) {
    return null;
  }
}

// Enhanced transfer card
function TransferCard({ t, currentUsername }) {
  // Get sender username from various possible field names
  const senderUsername =
    t.created_by_username ||
    t.from_username ||
    t.sender_username ||
    "Unknown";
  const recipientUsername =
    t.to_username || t.recipient_username || "Unknown";

  // Check if current user is the sender
  const isOutgoing =
    currentUsername &&
    senderUsername.toLowerCase() === currentUsername.toLowerCase();

  const isCompleted = (t.status || "").toLowerCase() === "completed";
  const isFailed = (t.status || "").toLowerCase() === "failed";

  return (
    <div
      className={`group rounded-2xl border backdrop-blur-xl p-5 transition-all duration-300 hover:shadow-xl
      ${
        isOutgoing
          ? "bg-gradient-to-br from-rose-950/40 to-slate-950/40 border-rose-500/30 hover:border-rose-500/40 hover:shadow-rose-500/10"
          : "bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border-emerald-500/30 hover:border-emerald-500/40 hover:shadow-emerald-500/10"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isOutgoing
                ? "bg-rose-500/10 border-rose-500/30"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}
          >
            {isOutgoing ? (
              <ArrowUpRight className="w-5 h-5 text-rose-400" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              {isOutgoing ? "Sent to" : "Received from"}
            </div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {isOutgoing ? recipientUsername : senderUsername}
            </div>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            isCompleted
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : isFailed
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isCompleted
                ? "bg-emerald-400 animate-pulse"
                : isFailed
                ? "bg-rose-400"
                : "bg-amber-400 animate-pulse"
            }`}
          ></div>
          {t.status || "Pending"}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-1">Amount</div>
          <div className="text-2xl font-bold text-slate-100">
            {fmtMoney(t.amount)}{" "}
            <span className="text-sm text-slate-400">
              {t.currency || "USD"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500 mb-1">Date</div>
          <div className="text-xs text-slate-400">
            {t.created_at
              ? new Date(t.created_at).toLocaleDateString()
              : "—"}
          </div>
          <div className="text-[10px] text-slate-500">
            {t.created_at
              ? new Date(t.created_at).toLocaleTimeString()
              : ""}
          </div>
        </div>
      </div>

      {t.reference && (
        <div className="mt-4 pt-4 border-t border-slate-800/50">
          <div className="text-xs text-slate-500 mb-1">Reference</div>
          <div className="text-sm text-slate-300">{t.reference}</div>
        </div>
      )}
    </div>
  );
}

export default function PeerTransfersPage() {
  const { user } = useContext(AuthContext);

  const [toUsername, setToUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [transfers, setTransfers] = useState([]);

  // Use AuthContext first, fallback to localStorage
  const currentUsername =
    (user?.username || getCurrentUsername() || "").toLowerCase();

  // Derived fee & total
  const parsedAmount = useMemo(() => {
    const n = parseFloat(amount);
    if (Number.isNaN(n) || n <= 0) return 0;
    return n;
  }, [amount]);

  const feePreview = useMemo(
    () => parsedAmount * FEE_PERCENT,
    [parsedAmount]
  );

  const totalDebitedPreview = useMemo(
    () => parsedAmount + feePreview,
    [parsedAmount, feePreview]
  );

  // Calculate statistics
  const stats = useMemo(() => {
    if (!transfers || transfers.length === 0 || !currentUsername) {
      return {
        totalSent: 0,
        totalReceived: 0,
        sentCount: 0,
        receivedCount: 0,
      };
    }

    const me = currentUsername;

    // Filter sent transfers (where current user is the sender)
    const sent = transfers.filter((t) => {
      const sender =
        t.created_by_username || t.from_username || t.sender_username;
      return sender && sender.toLowerCase() === me;
    });

    // Filter received transfers (where current user is the recipient)
    const received = transfers.filter((t) => {
      const recipient = t.to_username || t.recipient_username;
      return recipient && recipient.toLowerCase() === me;
    });

    // Calculate totals
    const sentTotal = sent.reduce((acc, t) => {
      const amount = parseFloat(String(t.amount));
      return acc + (Number.isNaN(amount) ? 0 : amount);
    }, 0);

    const receivedTotal = received.reduce((acc, t) => {
      const amount = parseFloat(String(t.amount));
      return acc + (Number.isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      totalSent: sentTotal,
      totalReceived: receivedTotal,
      sentCount: sent.length,
      receivedCount: received.length,
    };
  }, [transfers, currentUsername]);

  // Load my transfers
  const loadTransfers = async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get("/peer/transfers/mine/");
      const data = Array.isArray(res.data?.results)
        ? res.data.results
        : res.data;

      setTransfers(data || []);
    } catch (err) {
      console.error("Failed to load peer transfers", err);
      toast.error("Failed to load your transfer history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toUsername.trim()) {
      toast.error("Please enter the recipient username.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (parsedAmount < 100) {
      toast.error("Minimum transfer amount is 100.00.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        to_username: toUsername.trim(),
        amount: parsedAmount.toFixed(2),
        currency,
        reference: reference.trim() || null,
        note: note.trim() || null,
      };

      await axios.post("/peer/transfers/create/", payload);

      toast.success("Transfer submitted and processed successfully.");

      setToUsername("");
      setAmount("");
      setReference("");
      setNote("");

      await loadTransfers();
    } catch (err) {
      console.error("Transfer create failed", err);
      const data = err.response?.data;
      let message = "Transfer failed. Please try again.";

      if (data) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (data.errors) {
          const flat = [];
          Object.entries(data.errors).forEach(([field, msgs]) => {
            if (Array.isArray(msgs)) {
              msgs.forEach((m) =>
                flat.push(
                  field === "non_field_errors" ? m : `${field}: ${m}`
                )
              );
            }
          });
          if (flat.length) {
            message = flat.join(" | ");
          }
        }
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="px-8 py-8 h-full flex flex-col gap-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 bg-clip-text text-transparent">
              Peer-to-Peer Transfers
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Send money securely to other SavingDM users. A 10% platform fee
              is applied on each transfer.
            </p>
          </div>

          <button
            type="button"
            onClick={loadTransfers}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border border-cyan-500/30 hover:from-cyan-600/30 hover:to-cyan-500/30 text-cyan-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-cyan-500/10"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Total Received
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-300">
              ${fmtMoney(stats.totalReceived)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {stats.receivedCount} transfers
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-rose-950/40 to-slate-950/40 border border-rose-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Total Sent
              </span>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-rose-300">
              ${fmtMoney(stats.totalSent)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              {stats.sentCount} transfers
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-950/40 border border-cyan-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                Net Balance
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                <Wallet className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${
                stats.totalReceived - stats.totalSent >= 0
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              ${fmtMoney(stats.totalReceived - stats.totalSent)}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Received - Sent
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-950/40 border border-purple-500/30 backdrop-blur-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-300">
                All Transfers
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
                <Receipt className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-purple-300">
              {transfers.length}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              Total transactions
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-8 overflow-hidden">
          {/* LEFT: Send Money Form (2 columns) */}
          <motion.div
            className="lg:col-span-2 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
          >
            <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/30">
                  <Send className="w-6 h-6 text-cyan-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-100">
                    Send Money
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transfer funds to another user
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-8 overflow-y-auto custom-scrollbar"
              style={{ maxHeight: "calc(100vh - 400px)" }}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recipient */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    <UserIcon className="w-4 h-4" />
                    Recipient Username
                  </label>
                  <input
                    type="text"
                    value={toUsername}
                    onChange={(e) => setToUsername(e.target.value)}
                    placeholder="Enter recipient username"
                    className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Amount + Currency */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Min 100.00"
                      className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 outline-none transition-all"
                    >
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Reference{" "}
                    <span className="text-slate-500 normal-case">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g., Rent, Food, School fees"
                    className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Note to Recipient{" "}
                    <span className="text-slate-500 normal-case">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a message..."
                    className="w-full rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none"
                  />
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-slate-950/30 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                      Transfer Summary
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">
                        Transfer Amount
                      </span>
                      <span className="text-lg font-bold text-slate-100">
                        ${fmtMoney(parsedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">
                        Platform Fee (10%)
                      </span>
                      <span className="text-base font-semibold text-amber-300">
                        ${fmtMoney(feePreview)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-300">
                        Total Debited
                      </span>
                      <span className="text-xl font-bold text-cyan-300">
                        ${fmtMoney(totalDebitedPreview)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Processing Transfer…
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Money Now
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* RIGHT: Recent Transfers (3 columns) */}
          <motion.div
            className="lg:col-span-3 rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.3 }}
          >
            <div className="px-8 py-6 border-b border-slate-800/50 bg-slate-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <Receipt className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">
                      Transfer History
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {transfers.length} total transactions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {loadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-48 rounded-2xl bg-slate-800/30 border border-slate-700/30 animate-pulse"
                    />
                  ))}
                </div>
              ) : transfers && transfers.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {transfers.map((t) => (
                    <TransferCard
                      key={t.id}
                      t={t}
                      currentUsername={currentUsername}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="inline-flex p-5 rounded-full bg-slate-800/50 border border-slate-700/50 mb-4">
                    <Receipt className="w-12 h-12 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-2">
                    No Transfers Yet
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md">
                    Your peer-to-peer transfer history will appear here once
                    you send or receive money.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }
      `}</style>
    </div>
  );
}
