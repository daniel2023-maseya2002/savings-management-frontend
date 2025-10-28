import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user, refreshUser } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const LOW_BALANCE_THRESHOLD = 100.0; // set to what makes sense

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/savings/transactions/");
        const results = res.data.results || res.data;
        setTransactions(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    // check for low balance and notify (simple client-side alert)
    if (user && Number(user.balance) < LOW_BALANCE_THRESHOLD) {
      toast.warn(`Low balance: ${user.balance}. Consider depositing.`);
    }
  }, [user]);

  const handleManualRefresh = async () => {
    await refreshUser();
    toast.success("Balance refreshed");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user?.username}</h1>
      <p>Email: {user?.email}</p>
      <p>Balance: {user?.balance}</p>
      <button onClick={handleManualRefresh}>Refresh balance</button>

      <h3>Recent transactions</h3>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>{t.tx_type} - {t.amount} - {new Date(t.created_at).toLocaleString()}</li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <Link to="/transactions">View all transactions</Link>
      </div>
    </div>
  );
}