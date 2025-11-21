// src/pages/MyFeedbackPage.jsx
import { motion } from "framer-motion";
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    FileText,
    Loader2,
    MessageSquare,
    RefreshCcw,
    Send,
    Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

/**
 * My Feedback Page - User's feedback history
 * 
 * Features:
 * - View all submitted feedback
 * - Track status (open, in_progress, closed)
 * - See ratings and timestamps
 * - Quick link to submit new feedback
 */

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: "blue",
    icon: AlertTriangle,
    bg: "bg-blue-600/20",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  in_progress: {
    label: "In Progress",
    color: "amber",
    icon: Clock,
    bg: "bg-amber-600/20",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  closed: {
    label: "Closed",
    color: "emerald",
    icon: CheckCircle2,
    bg: "bg-emerald-600/20",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
};

export default function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
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
        open: feedbackList.filter((f) => f.status === "open").length,
        in_progress: feedbackList.filter((f) => f.status === "in_progress").length,
        closed: feedbackList.filter((f) => f.status === "closed").length,
      });
    } catch (err) {
      console.error("Load feedbacks error", err);
      toast.error("Could not load your feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.open;
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 h-[calc(100vh-96px)] flex flex-col gap-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
              <FileText className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
                My Feedback
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Track your feedback submissions and their status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300"
            >
              <Send className="w-4 h-4" />
              Submit New Feedback
            </Link>

            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 hover:from-emerald-600/30 hover:to-cyan-600/30 text-emerald-300 text-sm font-medium transition-all duration-300 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
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
                <p className="text-slate-400 text-sm">Total Submitted</p>
                <p className="text-3xl font-bold text-slate-100 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                <MessageSquare className="w-6 h-6 text-emerald-400" />
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
                <p className="text-slate-400 text-sm">Resolved</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats.closed}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feedback List */}
        <motion.div
          className="flex-1 overflow-hidden rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl"
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.2 }}
        >
          <div className="h-full overflow-y-auto custom-scrollbar p-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-6 rounded-full bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-6">
                  <MessageSquare className="w-16 h-16 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-2">No Feedback Yet</h3>
                <p className="text-slate-500 max-w-md mb-6">
                  You haven't submitted any feedback yet. Share your thoughts, suggestions, or report issues to help us improve.
                </p>
                <Link
                  to="/feedback"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all duration-300"
                >
                  <Send className="w-5 h-5" />
                  Submit Your First Feedback
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback, index) => {
                  const statusConfig = getStatusConfig(feedback.status);
                  const StatusIcon = statusConfig.icon;

                  return (
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
                              <Calendar className="w-4 h-4" />
                              <span>
                                Submitted {new Date(feedback.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            {feedback.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-amber-400 font-medium">
                                  {feedback.rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Status */}
                        <div className="flex flex-col gap-3 lg:items-end justify-center">
                          <div
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {statusConfig.label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
          background: rgba(16, 185, 129, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.7);
        }
      `}</style>
    </div>
  );
}