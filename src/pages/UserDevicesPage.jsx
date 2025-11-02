import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleHelp,
  Cpu,
  KeyRound,
  Laptop,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";

/* ---------------------------- helpers ---------------------------- */
const cls = (...x) => x.filter(Boolean).join(" ");
const mapStatus = (raw) => {
  const s = (raw || "").toUpperCase();
  if (s === "APPROVED") return { key: "APPROVED", label: "Approved" };
  if (s === "PENDING") return { key: "PENDING", label: "Pending" };
  if (s === "REJECTED") return { key: "REJECTED", label: "Rejected" };
  return { key: "UNKNOWN", label: "Unknown" };
};
const pillClass = (key) =>
  ({
    APPROVED:
      "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    PENDING:
      "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    REJECTED:
      "bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]",
    UNKNOWN:
      "bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20 shadow-[0_0_20px_rgba(148,163,184,0.12)]",
  }[key] || "");

/* Top thin network loader */
function useTopLoader(active) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    let interval;
    if (active) {
      setWidth(8);
      interval = setInterval(() => {
        setWidth((w) => (w < 90 ? w + Math.random() * 8 : w));
      }, 220);
    } else {
      setWidth(100);
      const t = setTimeout(() => setWidth(0), 380);
      return () => clearTimeout(t);
    }
    return () => clearInterval(interval);
  }, [active]);
  return width;
}

/* Floating orb component for background sparkle */
const Orb = ({ delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 0.7, scale: 1 }}
    transition={{ duration: 1.2, delay }}
    className={cls(
      "absolute blur-3xl rounded-full",
      "bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-fuchsia-500/10",
      className
    )}
  />
);

/* ---------------------------- main ---------------------------- */
export default function UserDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const topWidth = useTopLoader(loading || refreshing || submitting);

  const load = async () => {
    const res = await axios.get("/devices/");
    const data = (Array.isArray(res.data) ? res.data : []).map((d) => ({
      id: d.id,
      device_id: d.device_id,
      created_at: d.created_at,
      verified_at: d.verified_at,
      status: mapStatus(d.status),
    }));
    setDevices(data);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        console.error(e);
        toast.error("Failed to load devices.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceId.trim()) return toast.error("Enter a valid device ID.");
    setSubmitting(true);
    try {
      await axios.post("/devices/", { device_id: deviceId.trim() });
      toast.success("Device registration requested.");
      setDeviceId("");
      await load();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to register device.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await load();
    } catch (e) {
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const counts = useMemo(() => {
    const total = devices.length;
    const approved = devices.filter((d) => d.status.key === "APPROVED").length;
    const pending = devices.filter((d) => d.status.key === "PENDING").length;
    const rejected = devices.filter((d) => d.status.key === "REJECTED").length;
    return { total, approved, pending, rejected };
  }, [devices]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Aurora / gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(6,182,212,.15),transparent),radial-gradient(800px_400px_at_90%_-10%,rgba(16,185,129,.12),transparent),radial-gradient(700px_400px_at_50%_120%,rgba(168,85,247,.08),transparent)]" />
        <Orb delay={0.2} className="left-[-10%] top-[-8%] w-[40rem] h-[40rem]" />
        <Orb delay={0.6} className="right-[-12%] top-[10%] w-[34rem] h-[34rem]" />
        <Orb delay={1} className="left-[20%] bottom-[-14%] w-[42rem] h-[42rem]" />
      </div>

      {/* top shimmering border */}
      <div className="fixed left-0 top-0 z-40 h-[3px] w-full bg-transparent">
        <div
          className="h-full bg-[linear-gradient(90deg,#22d3ee,40%,#34d399,60%,#22d3ee)] transition-[width] duration-200"
          style={{ width: `${topWidth}%` }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 px-6 md:px-10 pt-10 pb-24">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-cyan-400/30 bg-white/5 p-3 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
              <ShieldCheck className="h-8 w-8 text-cyan-300" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
                Registered Devices
              </h1>
              <p className="text-sm text-gray-400">
                Zero-trust access. Approve devices before they can log in.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={cls(
              "group inline-flex items-center gap-2 rounded-xl px-4 py-2.5",
              "bg-emerald-500/15 ring-1 ring-emerald-400/30 text-emerald-300",
              "hover:bg-emerald-500/25 transition-all shadow-[inset_0_0_0_0_rgba(0,0,0,0.2)]",
              refreshing && "opacity-60 cursor-not-allowed"
            )}
          >
            {refreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refreshing…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform" />
                Refresh
              </>
            )}
          </button>
        </motion.header>

        {/* Stat cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 8 },
            show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
          }}
          className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              title: "Total Devices",
              value: counts.total,
              icon: <Cpu className="h-5 w-5 text-cyan-300" />,
              ring: "from-cyan-500/20 to-cyan-500/5",
            },
            {
              title: "Approved",
              value: counts.approved,
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
              ring: "from-emerald-500/20 to-emerald-500/5",
            },
            {
              title: "Pending",
              value: counts.pending,
              icon: <AlertTriangle className="h-5 w-5 text-amber-300" />,
              ring: "from-amber-500/20 to-amber-500/5",
            },
            {
              title: "Rejected",
              value: counts.rejected,
              icon: <Ban className="h-5 w-5 text-rose-300" />,
              ring: "from-rose-500/20 to-rose-500/5",
            },
          ].map((c) => (
            <motion.div
              key={c.title}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ scale: 1.02 }}
              className={cls(
                "rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl shadow-xl",
                "bg-gradient-to-b",
                c.ring
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{c.title}</span>
                <div className="rounded-xl border border-white/10 bg-white/5 p-2">{c.icon}</div>
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Register device */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto mt-10 max-w-4xl rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl"
        >
          <div className="mb-4 flex items-center gap-2 text-gray-300">
            <KeyRound className="h-5 w-5 text-cyan-300" />
            <h2 className="text-lg font-semibold">Add a new device</h2>
          </div>

          <form onSubmit={handleRegister} className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <input
                placeholder="Enter device unique ID (e.g., DANIEL-LAPTOP-01)"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                className={cls(
                  "w-full rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-white",
                  "placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                )}
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">
                <CircleHelp className="h-4 w-4" />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className={cls(
                "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold",
                "bg-cyan-600 hover:bg-cyan-700 transition-colors",
                "ring-1 ring-cyan-400/30 shadow-[0_10px_30px_-10px_rgba(34,211,238,0.5)]",
                submitting && "opacity-60 cursor-not-allowed"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Register Device
                </>
              )}
            </button>
          </form>

          <p className="mt-2 text-xs text-gray-500">
            Use a memorable ID like <code>DANIEL-LAPTOP-01</code> or <code>DANIEL-PHONE</code>.
            Your admin reviews new devices before they can log in.
          </p>
        </motion.div>

        {/* Devices table */}
        <div className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-cyan-300" />
              <h3 className="text-lg font-semibold text-gray-100">Your Devices</h3>
            </div>
            <div className="text-xs text-gray-400">Secure access management</div>
          </div>

          {loading ? (
            <div className="space-y-3 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl border border-white/5 bg-white/5" />
              ))}
            </div>
          ) : devices.length === 0 ? (
            <div className="px-6 py-16 text-center text-gray-500">No devices registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3">Device ID</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Requested</th>
                    <th className="px-6 py-3">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {devices.map((d) => (
                      <motion.tr
                        key={d.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="hover:bg-white/5"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2">
                              <Laptop className="h-4 w-4 text-cyan-300" />
                            </div>
                            <span className="font-medium text-gray-100">{d.device_id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cls(
                              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs",
                              pillClass(d.status.key)
                            )}
                          >
                            {d.status.key === "APPROVED" && <CheckCircle2 className="h-4 w-4" />}
                            {d.status.key === "PENDING" && <AlertTriangle className="h-4 w-4" />}
                            {d.status.key === "REJECTED" && <Ban className="h-4 w-4" />}
                            {d.status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {d.created_at ? new Date(d.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {d.verified_at ? new Date(d.verified_at).toLocaleString() : "—"}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subtle footer accent */}
        <div className="pointer-events-none mx-auto mt-12 h-24 max-w-5xl rounded-full bg-[radial-gradient(closest-side,rgba(34,211,238,0.12),transparent)]" />
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
