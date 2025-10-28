import { createContext, useEffect, useState } from "react";
import axios, { tokenService } from "../api/axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("user_info");
    if (u) setUser(JSON.parse(u));
  }, []);

  const login = async ({ username, password, device_id }) => {
    const resp = await axios.post("/auth/login/", { username, password, device_id });
    const { access, refresh, user } = resp.data;
    tokenService.setTokens({ access, refresh });
    localStorage.setItem("user_info", JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    tokenService.clear();
    localStorage.removeItem("user_info");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};