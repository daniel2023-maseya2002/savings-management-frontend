import { ArrowUpCircle, RefreshCw, Wallet } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);

    if (!amt || amt <= 0) {
      toast.error("Enter a valid positive amount.");
      return;
    }

    if (user?.balance === undefined || user?.balance === null) {
      toast.warn("Please wait — your balance is still loading...");
      return;
    }

    if (amt > Number(user.balance)) {
      toast.error("Insufficient funds. Enter a smaller amount.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/savings/withdraw/", { amount: amt });
      toast.success(`Withdrawal of ${amt} successful 💸`);
      await refreshUser();
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      let msg = "Withdrawal failed. Try again.";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkReload = async () => {
    setLoading(true);
    try {
      await refreshUser();
      toast.info("Account refreshed successfully.");
    } catch {
      toast.error("Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br 
      from-gray-950 via-slate-900 to-gray-800 text-white"
    >
      {/* Header */}
      <header className="flex justify-between items-center w-full px-12 py-6 bg-slate-900/60 backdrop-blur-md border-b border-white/10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-400 flex items-center gap-3">
          <ArrowUpCircle className="w-9 h-9 text-emerald-400" />
          Withdraw Funds
        </h1>
        <button
          onClick={handleNetworkReload}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl text-white 
          shadow-lg hover:shadow-emerald-700/40 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center items-center w-full px-8 py-10">
        <div
          className="w-full max-w-2xl bg-slate-800/60 border border-slate-700 rounded-3xl 
          shadow-2xl backdrop-blur-xl p-10 transform transition-all hover:scale-[1.01]"
        >
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-300 mb-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Current Balance
            </h2>
            <p className="text-3xl font-bold text-emerald-400">
              {user?.balance !== undefined
                ? `${Number(user.balance).toLocaleString()} RWF`
                : "Loading..."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Withdrawal Amount (RWF)
              </label>
              <div className="relative">
                <ArrowUpCircle className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  required
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 
                  placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 text-white transition-all ${
                loading
                  ? "bg-emerald-800 cursor-not-allowed opacity-70"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-emerald-700/40"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-5 h-5" />
                  Withdraw Now
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-white/10 text-gray-500 text-sm bg-slate-900/60">
        Secure withdrawals powered by{" "}
        <span className="text-emerald-400">encrypted transactions</span>.
      </footer>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
