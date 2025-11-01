import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "../api/axios";

export default function UserDevicesPage() {
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get("/devices/");
      setDevices(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load devices.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!deviceId.trim()) return toast.error("Enter device id.");
    setLoading(true);
    try {
      await axios.post("/devices/", { device_id: deviceId });
      toast.success("Device registration requested.");
      setDeviceId("");
      await load();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Failed to register device.";
      toast.error(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
      <h2>Your devices</h2>
      <form onSubmit={handleRegister} style={{ marginBottom: 12 }}>
        <input
          placeholder="device-unique-id"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
        <button type="submit" disabled={loading}>{loading ? "Requesting..." : "Register device"}</button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Device id</th>
            <th>Status</th>
            <th>Requested at</th>
            <th>Verified at</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td>{d.device_id}</td>
              <td>{d.status}</td>
              <td>{new Date(d.created_at).toLocaleString()}</td>
              <td>{d.verified_at ? new Date(d.verified_at).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}