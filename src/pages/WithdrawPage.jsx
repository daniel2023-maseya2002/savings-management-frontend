import { useContext, useState, useEffect } from "react";
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

  // ✅ Make sure user info (balance) is loaded
  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);

    // ✅ Basic validation
    if (!amt || amt <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }

    // ✅ Wait until user data (balance) is ready
    if (user?.balance === undefined || user?.balance === null) {
      toast.warn("Please wait — balance is still loading...");
      return;
    }

    // ✅ Local insufficient funds check
    if (amt > Number(user.balance)) {
      toast.error("Insufficient funds. Please enter a smaller amount.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/savings/withdraw/", { amount: amt });
      toast.success("Withdrawal successful!");
      await refreshUser();
      navigate("/");
    } catch (err) {
      console.error("Withdraw error:", err.response?.data);

      // ✅ Improved error extraction
      let msg = "Withdrawal failed. Please try again.";
      const data = err.response?.data;

      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.error) msg = data.error;
        else msg = JSON.stringify(data);
      }

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Withdraw</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Amount:</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Withdraw"}
        </button>
      </form>

      {/* ✅ Toast container — must be rendered once */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
