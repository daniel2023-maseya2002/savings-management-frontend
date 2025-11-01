import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import axios from "../api/axios";
import { RefreshCw, BarChart3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/admin/analytics/");
      setData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600 animate-pulse">
        <BarChart3 className="w-10 h-10 mb-3 text-blue-500" />
        <p className="text-lg font-medium">Loading analytics...</p>
      </div>
    );

  if (!data)
    return (
      <div className="max-w-3xl mx-auto text-center mt-20 bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">No Analytics Available</h2>
        <p className="text-gray-600 mb-6">
          The analytics endpoint didn’t return any data. Try again or check your backend.
        </p>
        <button
          onClick={loadData}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          Retry
        </button>
      </div>
    );

  const summary = data?.summary || {};
  const totals = [
    { name: "Deposits (30d)", value: parseFloat(summary.total_deposits_last_30d) || 0 },
    { name: "Withdraws (30d)", value: parseFloat(summary.total_withdraws_last_30d) || 0 },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 font-[system-ui]">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-3xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
          Admin Analytics
        </h2>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow-md rounded-xl p-5 text-center hover:shadow-lg transition-all">
          <p className="text-gray-500">Total Users</p>
          <p className="text-3xl font-semibold text-blue-600">{summary.total_users ?? 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-5 text-center hover:shadow-lg transition-all">
          <p className="text-gray-500">Active Devices</p>
          <p className="text-3xl font-semibold text-green-600">{summary.active_devices ?? 0}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-5 text-center hover:shadow-lg transition-all">
          <p className="text-gray-500">Pending Devices</p>
          <p className="text-3xl font-semibold text-yellow-600">{summary.pending_devices ?? 0}</p>
        </div>
      </div>

      {/* Transactions Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-10 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Transactions (Last 30 Days)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
              <YAxis tick={{ fill: "#6b7280" }} />
              <Tooltip cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]}>
                <LabelList dataKey="value" position="top" fill="#111827" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users by Balance */}
      <div className="bg-white p-6 rounded-2xl shadow-md mb-10 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Top Users by Balance</h3>
        {data.top_users_by_balance?.length ? (
          <table className="w-full border-t border-gray-200 text-sm">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-gray-600 font-medium">User</th>
                <th className="py-2 px-3 text-gray-600 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.top_users_by_balance.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50 transition">
                  <td className="py-2 px-3">{u.username}</td>
                  <td className="py-2 px-3 text-right text-blue-600 font-medium">
                    ${parseFloat(u.balance || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic">No users found.</p>
        )}
      </div>

      {/* Low Balance Alerts */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Low Balance Alerts</h3>
        {data.recent_low_balance_alerts?.length ? (
          <table className="w-full border-t border-gray-200 text-sm">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-gray-600 font-medium">User</th>
                <th className="py-2 px-3 text-gray-600 font-medium">Message</th>
                <th className="py-2 px-3 text-gray-600 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_low_balance_alerts.map((alert) => (
                <tr key={alert.id} className="border-t hover:bg-gray-50 transition">
                  <td className="py-2 px-3">{alert.user__username}</td>
                  <td className="py-2 px-3 text-gray-700">{alert.message}</td>
                  <td className="py-2 px-3 text-right text-gray-500">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 italic">No recent alerts found.</p>
        )}
      </div>
    </div>
  );
}
