// src/pages/FeedbackFormPage.jsx
import { motion } from "framer-motion";
import {
    AlertCircle,
    FileText,
    Globe,
    Loader2,
    MessageSquare,
    Send,
    Star
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";

/**
 * Feedback Form Page - Submit new feedback
 * 
 * Features:
 * - Title and message input
 * - Star rating system (1-5)
 * - Public/private toggle
 * - Form validation
 * - Success feedback
 * - Navigation to feedback history
 */

export default function FeedbackFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Please provide a title");
      return;
    }
    if (!message.trim()) {
      toast.error("Please provide a message");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message should be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        rating,
        is_public: isPublic,
      };

      const res = await axios.post("/feedback/", payload);
      
      toast.success("Feedback submitted successfully! Thank you for helping us improve.", {
        position: "top-right",
        autoClose: 3000,
      });

      // Reset form
      setTitle("");
      setMessage("");
      setRating(5);
      setIsPublic(false);

      // Navigate to feedback history after short delay
      setTimeout(() => {
        navigate("/my-feedback");
      }, 1500);
    } catch (err) {
      console.error("Submit feedback error", err);
      const msg = err?.response?.data?.detail || err?.response?.data?.message || "Could not send feedback";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen w-screen bg-[#0a0e1a] text-white pt-24 pb-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0f1629] to-slate-950 -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.08),transparent_50%)] -z-10"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(6,182,212,0.06),transparent_50%)] -z-10"></div>

      <div className="px-8 py-8 max-w-6xl mx-auto">
        <motion.div
          className="w-full"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                <MessageSquare className="w-12 h-12 text-emerald-300" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent mb-3">
              Send Feedback
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Share your thoughts, report issues, or suggest improvements. Your feedback helps us make the platform better.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-slate-800/50 bg-gradient-to-br from-slate-900/60 to-slate-950/60 backdrop-blur-xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Title
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary (e.g., 'Bug: Dashboard not loading')"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                  required
                />
                <p className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Keep it short and descriptive</span>
                  <span>{title.length}/100</span>
                </p>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  Message
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your feedback in detail... What happened? What did you expect? How can we improve?"
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none"
                  required
                />
                <p className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Minimum 10 characters</span>
                  <span>{message.length}/1000</span>
                </p>
              </div>

              {/* Rating Section */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Star className="w-4 h-4 text-amber-400" />
                  Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          star <= (hoveredRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-lg font-semibold text-slate-200">
                    {rating}/5
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {rating === 5 && "⭐ Excellent!"}
                  {rating === 4 && "👍 Good"}
                  {rating === 3 && "👌 Okay"}
                  {rating === 2 && "😕 Needs improvement"}
                  {rating === 1 && "😞 Poor"}
                </p>
              </div>

              {/* Public Toggle */}
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        Make feedback public
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Allow others to see this feedback (your name will be visible)
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-all cursor-pointer ${
                        isPublic
                          ? "bg-emerald-600"
                          : "bg-slate-700"
                      }`}
                      onClick={() => setIsPublic(!isPublic)}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          isPublic ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </div>
                </label>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-600/10 border border-blue-500/30">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">Your feedback matters!</p>
                  <p className="text-blue-400/80">
                    We review all feedback carefully. You'll be able to track the status of your submission in "My Feedback".
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 mt-2 border-t border-slate-800/50">
                <button
                  type="button"
                  onClick={() => navigate("/my-feedback")}
                  className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-800/70 transition-all order-2 sm:order-1"
                >
                  View My Feedback
                </button>

                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !message.trim()}
                  className={`inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-base font-bold shadow-xl transition-all duration-300 order-1 sm:order-2 ${
                    submitting || !title.trim() || !message.trim()
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/50 hover:shadow-emerald-500/70 hover:scale-105 active:scale-95"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Having trouble? Contact us at{" "}
              <a
                href="mailto:support@savingdm.com"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                support@savingdm.com
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}