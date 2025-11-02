import { ArrowDownCircle, DollarSign, Globe, RefreshCw } from "lucide-react";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RWF");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/savings/deposit/", { amount, currency });
      toast.success(`Deposit of ${amount} ${currency} successful 🎉`);
      await refreshUser();
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Deposit failed. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkReload = async () => {
    setLoading(true);
    try {
      await refreshUser();
      toast.info("Network refreshed successfully.");
    } catch {
      toast.error("Network error. Try again later.");
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
          <ArrowDownCircle className="w-9 h-9 text-emerald-400" />
          Deposit Funds
        </h1>
        <button
          onClick={handleNetworkReload}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl text-white 
          shadow-lg hover:shadow-emerald-700/40 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          Reload
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center items-center w-full px-8 py-10">
        <div
          className="w-full max-w-2xl bg-slate-800/60 border border-slate-700 rounded-3xl 
          shadow-2xl backdrop-blur-xl p-10 transform transition-all hover:scale-[1.01]"
        >
          <p className="text-gray-400 mb-6 text-sm">
            Add funds to your account securely. Choose your preferred currency and enter an amount to deposit.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Currency Selection */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Select Currency
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 
                  focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="RWF">RWF - Rwandan Franc</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                </select>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-gray-300 mb-2 font-medium">
                Amount ({currency})
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter amount in ${currency}`}
                  required
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-gray-200 
                  placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit */}
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
                  <ArrowDownCircle className="w-5 h-5" />
                  Deposit Now
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 border-t border-white/10 text-gray-500 text-sm bg-slate-900/60">
        Transactions are protected with{" "}
        <span className="text-emerald-400">256-bit encryption</span>.
      </footer>
    </div>
  );
}
