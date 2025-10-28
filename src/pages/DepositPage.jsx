import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/savings/deposit/", { amount });
      toast.success("Deposit successful.");
      await refreshUser(); // update balance
      navigate("/");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Deposit failed. Try again.";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2>Deposit</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Amount (RWF / USD):</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Deposit"}</button>
      </form>
    </div>
  );
}