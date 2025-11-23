// src/api/axios.js
import axios from "axios";
import { toast } from "react-toastify";
import { setupAxiosInterceptors } from "../utils/axiosLoading";

// ✅ Base URL — works in both Vite and CRA
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||   // ✅ this one
  import.meta.env.VITE_API_BASE ||       // (optional fallback)
  process.env.REACT_APP_API_BASE_URL ||  // for CRA if ever needed
  "http://127.0.0.1:8000/api";           // local default


// ✅ Create axios instance first
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ✅ Now safely call setupAxiosInterceptors
setupAxiosInterceptors(axiosInstance);

// ✅ Token utilities
export const tokenService = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_info");
  },
  
  // NEW: Decode JWT to check expiry
  isTokenExpiringSoon: (token, bufferMinutes = 2) => {
    if (!token) return true;
    
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const { exp } = JSON.parse(jsonPayload);
      
      if (!exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      const bufferSeconds = bufferMinutes * 60;
      
      // Return true if token expires within buffer time
      return exp - now < bufferSeconds;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return true;
    }
  },
  
  // NEW: Get token expiry info
  getTokenExpiry: (token) => {
    if (!token) return null;
    
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const { exp } = JSON.parse(jsonPayload);
      
      if (!exp) return null;
      
      return {
        expiresAt: new Date(exp * 1000),
        secondsRemaining: exp - Math.floor(Date.now() / 1000),
      };
    } catch (error) {
      return null;
    }
  },
};

// ✅ Attach access token to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    let access = tokenService.getAccess();
    
    // NEW: Proactively refresh if token is expiring soon
    if (access && tokenService.isTokenExpiringSoon(access)) {
      console.log("🔄 Token expiring soon, refreshing proactively...");
      
      try {
        const newAccess = await refreshTokenSilently();
        if (newAccess) {
          access = newAccess;
        }
      } catch (error) {
        console.warn("Proactive refresh failed, will retry on 401:", error);
      }
    }
    
    if (access) config.headers.Authorization = `Bearer ${access}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// === Refresh logic ===
let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
}

// NEW: Silent refresh function (for proactive refresh)
async function refreshTokenSilently() {
  const refresh = tokenService.getRefresh();
  if (!refresh) return null;

  if (isRefreshing) {
    // Wait for ongoing refresh
    return new Promise((resolve) => {
      addSubscriber((newToken) => resolve(newToken));
    });
  }

  isRefreshing = true;
  
  try {
    const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
    const newAccess = res.data.access;

    if (!newAccess) throw new Error("No access token returned");

    tokenService.setTokens({ access: newAccess });
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

    onRefreshed(newAccess);
    console.log("✅ Token refreshed proactively");
    
    return newAccess;
  } catch (error) {
    console.error("Silent refresh failed:", error);
    return null;
  } finally {
    isRefreshing = false;
  }
}

// ✅ Response Interceptor (existing logic preserved)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const status = error.response ? error.response.status : null;

    // Only refresh for 401 errors
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const url = originalRequest.url || "";
      if (url.includes("/notifications")) {
        console.warn("Skipping logout for notifications request");
        return Promise.reject(error);
      }

      const refresh = tokenService.getRefresh();
      if (!refresh) {
        console.warn("No refresh token — clearing session");
        tokenService.clear();
        toast.info("Session expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((newToken) => {
            originalRequest.headers.Authorization = "Bearer " + newToken;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        const newAccess = res.data.access;

        if (!newAccess) throw new Error("No access token returned");

        tokenService.setTokens({ access: newAccess });
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccess}`;

        onRefreshed(newAccess);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.error("Token refresh failed", refreshErr);
        isRefreshing = false;
        tokenService.clear();
        toast.error("Your session has expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// NEW: Export utility to manually check/refresh token
export const checkAndRefreshToken = async () => {
  const access = tokenService.getAccess();
  
  if (!access) {
    console.log("No access token");
    return false;
  }
  
  const expiry = tokenService.getTokenExpiry(access);
  if (expiry) {
    console.log(`Token expires at: ${expiry.expiresAt.toLocaleString()}`);
    console.log(`Time remaining: ${Math.floor(expiry.secondsRemaining / 60)} minutes`);
  }
  
  if (tokenService.isTokenExpiringSoon(access)) {
    console.log("Token expiring soon, refreshing...");
    const newToken = await refreshTokenSilently();
    return !!newToken;
  }
  
  console.log("Token is still valid");
  return true;
};

export default axiosInstance;