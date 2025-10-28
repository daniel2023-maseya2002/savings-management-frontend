import { useEffect, useState } from "react";
import axios from "../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // If backend exposes admin stats endpoint, call it. Example: /admin/stats/
        const res = await axios.get("/admin/stats/"); // adapt to your actual endpoint
        setStats(res.data);
      } catch (err) {
        // If endpoint doesn't exist yet, ignore
        console.warn("No admin stats endpoint or error", err);
      }
    };
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin dashboard</h2>
      {stats ? (
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      ) : (
        <p>No admin stats endpoint available. You can add endpoints for reports, device approvals, etc.</p>
      )}
    </div>
  );
}
