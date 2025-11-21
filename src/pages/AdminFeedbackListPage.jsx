// src/pages/AdminFeedbackListPage.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    Loader2,
    MessageSquare,
    RefreshCcw,
    Search,
    Star,
    Trash2,
    TrendingUp,
    User,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

/**
 * Admin Feedback Management - Modern Dark Theme
 * 
 * Features:
 * - View all user feedback submissions
 * - Filter by status (open, in_progress, closed)
 * - Update status inline
 * - Delete feedback
 * - Statistics dashboard
 * - Search functionality
 */

const STATUS_OPTIONS = [
  { value: "open", label: "Open", color: "blue", icon: AlertTriangle },
  { value: "in_progress", label: "In Progress", color: "amber", icon: Clock },
  { value: "closed", label: "Closed", color: "emerald", icon: CheckCircle2 },
];

export default function AdminFeedbackListPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, open: 0, in_progress: 0, closed: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/feedback/");
      const data = res.data.results ?? res.data;
      const feedbackList = Array.isArray(data) ? data : [];
      setFeedbacks(feedbackList);
      
      // Calculate stats
      setStats({
        total: feedbackList.length,
        open: feedbackList.filter(f => f.status === "open").length,
        in_progress: feedbackList.filter(f => f.status === "in_progress").length,
        closed: feedbackList.filter(f => f.status === "closed").length,
      });
    } catch (err) {
      console.error("Load admin feedbacks error", err);
      toast.error("Could not load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/feedback/${id}/status/`, { status: newStatus });
      toast.success("Status updated successfully");
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
      );
      // Recalculate stats
      const updatedList = feedbacks.map((f) => (f.id === id ? { ...f, status: newStatus } : f));
      setStats({
        total: updatedList.length,
        open: updatedList.filter(f => f.status === "open").length,
        in_progress: updatedList.filter(f => f.status === "in_progress").length,
        closed: updatedList.filter(f => f.status === "closed").length,
      });
    } catch (err) {
      console.error("Update status error", err);
      toast.error("Could not update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feedback permanently?")) return;
    try {
      await axios.delete(`/feedback/${id}/`);
      toast.success("Feedback deleted");
      setFeedbacks((prev) => prev.filter((f) => f.id !== id));
      load(); // Reload to update stats
    } catch (err) {
      console.error("Delete feedback", err);
      toast.error("Could not delete feedback");
    }
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks
    .filter((f) => statusFilter === "all" || f.status === statusFilter)
    .filter(
      (f) =>
        searchQuery === "" ||
        f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.user?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find((s) => s.value === status);
    return option?.color || "gray";
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 h-[calc(100vh-96px)] flex flex-col gap-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 shadow-lg shadow-blue-500/10">
              <MessageSquare className="w-8 h-8 text-blue-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Feedback Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage user feedback and track resolution status
              </p>
            </div>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 hover:from-blue-600/30 hover:to-purple-600/30 text-blue-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-blue-500/10 disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
        >
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/50 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Feedback</p>
                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/50 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Open</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{stats.open}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <AlertTriangle className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/50 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{stats.in_progress}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-slate-800/50 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Closed</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.closed}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="flex flex-col md:flex-row gap-4"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, message, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 text-slate-100 placeholder:text-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-800/50 text-slate-300 hover:bg-slate-800/70"
                }`}
              >
                All
              </button>
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    statusFilter === option.value
                      ? `bg-${option.color}-600/20 text-${option.color}-300 border border-${option.color}-500/30`
                      : "bg-slate-800/50 text-slate-300 hover:bg-slate-800/70"
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Feedback List */}
        <motion.div
          className="flex-1 overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
        >
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mb-4" />
                <p className="text-slate-500 text-lg">
                  {searchQuery || statusFilter !== "all"
                    ? "No feedback matches your filters"
                    : "No feedback submissions yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map((feedback, index) => (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/40 hover:border-slate-700/70 transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left: Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-100 mb-2">
                              {feedback.title}
                            </h3>
                            <p className="text-sm text-slate-400 leading-relaxed">
                              {feedback.message}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <User className="w-4 h-4" />
                            <span>{feedback.user || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                          </div>
                          {feedback.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                              <span className="text-amber-400 font-medium">{feedback.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col gap-3 lg:items-end">
                        <select
                          value={feedback.status}
                          onChange={(e) => updateStatus(feedback.id, e.target.value)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium outline-none transition-all cursor-pointer
                            ${
                              feedback.status === "open"
                                ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                                : feedback.status === "in_progress"
                                ? "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                            }
                          `}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-300 text-sm font-medium hover:bg-rose-600/30 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
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
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
}