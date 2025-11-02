import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get("/notifications/");
      setItems(res.data.results ?? res.data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`/notifications/${id}/mark-read/`);
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleReload = async () => {
    setReloading(true);
    await load();
    setTimeout(() => setReloading(false), 500);
  };

  return (
    <div
      className="min-h-screen w-screen bg-gradient-to-br 
      from-gray-950 via-slate-900 to-gray-800 text-white overflow-x-hidden flex flex-col"
    >
      {/* Header */}
      <header className="flex justify-between items-center w-full px-10 py-6 bg-slate-900/70 backdrop-blur-md border-b border-white/10">
        <h1 className="text-3xl font-extrabold text-cyan-400 flex items-center gap-3">
          <Bell className="w-8 h-8 text-cyan-400" />
          Notifications
        </h1>
        <button
          onClick={handleReload}
          disabled={reloading}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 px-5 py-2.5 rounded-xl text-white 
          shadow-lg hover:shadow-cyan-700/40 transition-all disabled:opacity-60"
        >
          {reloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Reloading
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Refresh
            </>
          )}
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-6 py-10 w-full">
        {loading ? (
          <div className="flex flex-col justify-center items-center mt-20 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
            <p>Loading notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl px-10 py-16 text-center shadow-xl backdrop-blur-md">
            <BellOff className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">
              No notifications yet 🎉
            </h3>
            <p className="text-gray-500 mt-2">
              You’ll see system updates, alerts, and messages here.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-3xl flex flex-col gap-5">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col gap-3 p-6 rounded-2xl border transition-all duration-300 shadow-md backdrop-blur-lg ${
                  n.read
                    ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800/60"
                    : "bg-cyan-900/30 border-cyan-700 hover:bg-cyan-800/40"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {n.read ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-cyan-400" />
                    )}
                    <h4
                      className={`text-lg font-semibold ${
                        n.read ? "text-gray-300" : "text-white"
                      }`}
                    >
                      {n.title}
                    </h4>
                  </div>
                  <small className="text-gray-400">
                    {new Date(n.created_at).toLocaleString()}
                  </small>
                </div>

                <p className="text-gray-400 leading-relaxed">{n.body}</p>

                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="self-start mt-2 bg-cyan-600 hover:bg-cyan-700 text-white 
                    px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 
                    transition-all shadow hover:shadow-cyan-700/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-white/10 text-gray-500 text-sm bg-slate-900/60">
        Stay informed — we’ll keep your account updates right here 💬
      </footer>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
