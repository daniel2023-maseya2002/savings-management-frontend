import React from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function TopNav() {
  const { user, logout } = React.useContext(AuthContext);

  return (
    <nav style={{ padding: 8, borderBottom: "1px solid #ccc" }}>
      <Link to="/" style={{ marginRight: 8 }}>Dashboard</Link>
      <Link to="/transactions" style={{ marginRight: 8 }}>Transactions</Link>
      <Link to="/deposit" style={{ marginRight: 8 }}>Deposit</Link>
      <Link to="/withdraw" style={{ marginRight: 8 }}>Withdraw</Link>

      {user?.is_staff && (
        <>
          <Link to="/admin" style={{ marginLeft: 12, marginRight: 8 }}>Admin</Link>
          <Link to="/admin/devices" style={{ marginRight: 8 }}>Devices</Link>
        </>
      )}

      <span style={{ float: "right" }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>{user.username}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </span>
    </nav>
  );
}

export default TopNav;
