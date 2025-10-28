import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    if (user && Number(amount) > Number(user.balance)) {
      toast.error("Insufficient funds.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/savings/withdraw/", { amount });
      toast.success("Withdrawal successful.");
      await refreshUser();
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Withdrawal failed.";
      toast.error(msg);
      console.error(err);
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
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Withdraw"}</button>
      </form>
    </div>
  );
}