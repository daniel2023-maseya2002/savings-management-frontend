import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);

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

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user?.username}</h1>
      <p>Email: {user?.email}</p>
      <p>Balance: {user?.balance}</p>

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