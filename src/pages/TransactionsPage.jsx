import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCcw
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "../api/axios";

/* ---------------- helpers ---------------- */
const fmtMoney = (n) =>
  (Number(n || 0)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const normalizeTx = (raw) =>
  raw.map((t) => {
    const tx_type =
      (t.tx_type || t.type || "").toString().toUpperCase() === "DEPOSIT"
        ? "Deposit"
        : "Withdraw";
    return {
      id: t.id,
      tx_type,
      amount: Number(t.amount || 0),
      created_at: t.created_at || t.date || null,
      date: t.created_at
        ? new Date(t.created_at).toLocaleString()
        : t.date
        ? new Date(t.date).toLocaleString()
        : "—",
      status: t.status
        ? t.status.charAt(0).toUpperCase() + t.status.slice(1)
        : "Completed",
    };
  });

/** group by YYYY-MM-DD for a small per-day trend */
function buildDailyTrend(transactions) {
  const byDay = new Map();
  transactions.forEach((t) => {
    if (!t.created_at) return;
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDay.has(key)) byDay.set(key, { date: key, deposits: 0, withdrawals: 0 });
    const row = byDay.get(key);
    if (t.tx_type === "Deposit") row.deposits += Number(t.amount || 0);
    else row.withdrawals += Number(t.amount || 0);
  });

  // sort by date
  const arr = Array.from(byDay.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  return arr.map((r) => ({ ...r, net: r.deposits - r.withdrawals }));
}

/* sparkline */
function SparkMini({ data, dataKey, stroke }) {
  if (!data?.length) return null;
  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.45} />
            <stop offset="95%" stopColor={stroke} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#g-${dataKey})`}
          dot={false}
        />
        <XAxis dataKey="date" hide />
        <YAxis hide />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* tiny pill card for one transaction */
function TxPill({ t }) {
  const isDep = t.tx_type === "Deposit";
  return (
    <div
      className={`min-w-[260px] max-w-[260px] rounded-2xl border backdrop-blur-xl px-4 py-3 mr-3
      ${isDep ? "bg-emerald-500/10 border-emerald-400/20" : "bg-rose-500/10 border-rose-400/20"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wide text-gray-300">
          {t.tx_type}
        </span>
        <span className="text-[11px] text-gray-400">{t.date}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-full ${isDep ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
          {isDep ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          )}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-semibold text-white">
            ${fmtMoney(t.amount)}
          </div>
          <div
            className={`text-[11px] mt-1 inline-flex px-2 py-0.5 rounded-full w-fit
          ${
            t.status.toLowerCase() === "completed"
              ? "bg-emerald-500/15 text-emerald-300"
              : t.status.toLowerCase() === "pending"
              ? "bg-yellow-500/15 text-yellow-300"
              : "bg-rose-500/15 text-rose-300"
          }`}
          >
            {t.status}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [depExpanded, setDepExpanded] = useState(false);
  const [witExpanded, setWitExpanded] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/savings/transactions/");
      const raw = Array.isArray(res.data?.results) ? res.data.results : res.data;
      setTransactions(normalizeTx(raw || []));
    } catch (err) {
      console.error("Transaction fetch failed:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // compute splits & totals
  const deposits = useMemo(
    () => transactions.filter((t) => t.tx_type === "Deposit"),
    [transactions]
  );
  const withdrawals = useMemo(
    () => transactions.filter((t) => t.tx_type === "Withdraw"),
    [transactions]
  );

  const totals = useMemo(() => {
    const dep = deposits.reduce((a, t) => a + (t.amount || 0), 0);
    const wit = withdrawals.reduce((a, t) => a + (t.amount || 0), 0);
    return { deposits: dep, withdrawals: wit, net: dep - wit };
  }, [deposits, withdrawals]);

  const trend = useMemo(() => buildDailyTrend(transactions), [transactions]);

  const fadeIn = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="min-h-screen w-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col px-6 lg:px-16 py-10 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER */}
      <motion.div
        className="flex items-center justify-between"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Review your deposits and withdrawals securely.
          </p>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 transition px-4 py-2 rounded-xl text-sm text-emerald-300"
        >
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>
      </motion.div>

      {/* SUMMARY: Deposits (All), Withdrawals (All), Net Flow */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg">
          <div className="text-sm text-gray-300">Deposits (All)</div>
          <div className="text-2xl font-semibold text-white mt-1">
            ${fmtMoney(totals.deposits)}
          </div>
          <div className="h-16 mt-3">
            <SparkMini data={trend} dataKey="deposits" stroke="#10b981" />
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg">
          <div className="text-sm text-gray-300">Withdrawals (All)</div>
          <div className="text-2xl font-semibold text-white mt-1">
            ${fmtMoney(totals.withdrawals)}
          </div>
          <div className="h-16 mt-3">
            <SparkMini data={trend} dataKey="withdrawals" stroke="#f43f5e" />
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg">
          <div className="text-sm text-gray-300">Net Flow (Deposits − Withdrawals)</div>
          <div
            className={`text-2xl font-semibold mt-1 ${
              totals.net >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            ${fmtMoney(totals.net)}
          </div>
          <div className="h-16 mt-3">
            <SparkMini
              data={trend}
              dataKey="net"
              stroke={totals.net >= 0 ? "#10b981" : "#f43f5e"}
            />
          </div>
        </div>
      </motion.div>

      {/* DEPOSITS — horizontal first, title below */}
      <motion.div
        className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="p-5">
          {loading ? (
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[260px] h-28 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : deposits.length ? (
            <div className="flex overflow-x-auto no-scrollbar pb-1 -mr-5 pr-5">
              {(depExpanded ? deposits : deposits.slice(0, 10)).map((t) => (
                <TxPill key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No deposits found.</p>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">Deposits</h3>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-400">
              Total: ${fmtMoney(totals.deposits)}
            </div>
            {deposits.length > 10 && (
              <button
                onClick={() => setDepExpanded((s) => !s)}
                className="text-sm text-gray-300 hover:text-white transition"
              >
                {depExpanded ? "Collapse" : "View all"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* WITHDRAWALS — horizontal first, title below */}
      <motion.div
        className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-lg"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        <div className="p-5">
          {loading ? (
            <div className="flex gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="min-w-[260px] h-28 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : withdrawals.length ? (
            <div className="flex overflow-x-auto no-scrollbar pb-1 -mr-5 pr-5">
              {(witExpanded ? withdrawals : withdrawals.slice(0, 10)).map((t) => (
                <TxPill key={t.id} t={t} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No withdrawals found.</p>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">Withdrawals</h3>
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-400">
              Total: ${fmtMoney(totals.withdrawals)}
            </div>
            {withdrawals.length > 10 && (
              <button
                onClick={() => setWitExpanded((s) => !s)}
                className="text-sm text-gray-300 hover:text-white transition"
              >
                {witExpanded ? "Collapse" : "View all"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* DAILY TREND (optional) — chart first, title below */}
      <motion.div
        className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 shadow-lg"
        variants={fadeIn}
        initial="hidden"
        animate="show"
      >
        {trend.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g-dep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="g-wit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "none",
                  borderRadius: "10px",
                }}
              />
              <Area
                type="monotone"
                dataKey="deposits"
                stroke="#10b981"
                fill="url(#g-dep)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="withdrawals"
                stroke="#f43f5e"
                fill="url(#g-wit)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center mt-10">
            No daily trend data.
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <h3 className="text-lg font-semibold text-gray-200">
            Transactions (Daily Trend)
          </h3>
          <div className="text-sm text-gray-400">
            Deposits: ${fmtMoney(totals.deposits)} • Withdrawals: $
            {fmtMoney(totals.withdrawals)} • Net: ${fmtMoney(totals.net)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
