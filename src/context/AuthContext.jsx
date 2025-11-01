import { createContext, useEffect, useState } from "react";
import axiosInstance, { tokenService } from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔄 Restore user + tokens on app load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user_info");
      const tokens = {
        access: tokenService.getAccess(),
        refresh: tokenService.getRefresh(),
      };

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (tokens?.access) {
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${tokens.access}`;
      }
    } catch (err) {
      console.error("⚠️ Failed to restore auth state:", err);
      localStorage.removeItem("user_info");
      tokenService.clear();
      setUser(null);
    }
  }, []);

  // 🧭 Sync user in memory and localStorage
  const syncLocalUser = (u) => {
    if (!u) {
      localStorage.removeItem("user_info");
      setUser(null);
      return;
    }
    localStorage.setItem("user_info", JSON.stringify(u));
    setUser(u);
  };

  // 🔐 Login and persist everything
  const login = (data) => {
    const { access, refresh, user } = data;
    tokenService.setTokens({ access, refresh });
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${access}`;
    syncLocalUser(user);
    return user;
  };

  // 🔁 Refresh user data (optional)
  const refreshUser = async () => {
    try {
      const res = await axiosInstance.get("/savings/balance/");
      const balance = res.data.balance ?? res.data;

      const newUser = {
        ...JSON.parse(localStorage.getItem("user_info") || "{}"),
        balance,
      };

      syncLocalUser(newUser);
      return newUser;
    } catch (err) {
      console.error("refreshUser error:", err);
      return null;
    }
  };

  // 🚪 Logout user cleanly
  const logout = () => {
    tokenService.clear();
    localStorage.removeItem("user_info");
    setUser(null);
    delete axiosInstance.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: syncLocalUser,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
