import { createContext, useEffect, useState } from "react";
import axios, { tokenService } from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("user_info");
    if (u) setUser(JSON.parse(u));
  }, []);

  const syncLocalUser = (u) => {
    if (!u) {
      localStorage.removeItem("user_info");
      setUser(null);
      return;
    }
    localStorage.setItem("user_info", JSON.stringify(u));
    setUser(u);
  };

  const refreshUser = async () => {
    try {
      const res = await axios.get("/savings/balance/");
      // response expected { balance: "..." } or similar
      const balance = res.data.balance ?? res.data;
      const newUser = { ...JSON.parse(localStorage.getItem("user_info") || "{}"), balance };
      syncLocalUser(newUser);
      return newUser;
    } catch (err) {
      console.error("refreshUser error", err);
      return null;
    }
  };

  const login = async ({ username, password, device_id }) => {
    const resp = await axios.post("/auth/login/", { username, password, device_id });
    const { access, refresh, user } = resp.data;
    tokenService.setTokens({ access, refresh });
    syncLocalUser(user);
    return user;
  };

  const logout = () => {
    tokenService.clear();
    syncLocalUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: syncLocalUser, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};