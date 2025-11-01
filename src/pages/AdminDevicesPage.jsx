import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      // optionally pass ?status=pending
      const res = await axios.get("/admin/devices/?status=pending");
      // if paginated: const list = res.data.results || res.data
      const list = res.data.results ?? res.data;
      setDevices(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load devices.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const actOn = async (id, action) => {
    try {
      const url = `/admin/devices/${id}/${action}/`;
      await axios.post(url);
      toast.success(`Device ${action}d`);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.detail || `Failed to ${action}.`;
      toast.error(msg);
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "24px auto" }}>
      <h2>Admin — Device approvals</h2>
      <p>Pending devices</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Device id</th>
            <th>Requested at</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 && <tr><td colSpan={5}>No pending devices</td></tr>}
          {devices.map((d) => (
            <tr key={d.id}>
              <td>{d.username}</td>
              <td>{d.user_email}</td>
              <td>{d.device_id}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>
              <td>
                <button onClick={() => actOn(d.id, "approve")}>Approve</button>
                <button onClick={() => actOn(d.id, "reject")} style={{ marginLeft: 8 }}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}