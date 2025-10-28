import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/savings/transactions/");
        setTransactions(res.data.results || res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div>Loading...</div>;
  return (
    <div style={{ padding: 20 }}>
      <h2>Transactions</h2>
      <ul>
        {transactions.map((t) => (
          <li key={t.id}>{t.tx_type} — {t.amount} — {new Date(t.created_at).toLocaleString()}</li>
        ))}
      </ul>
    </div>
  );
}