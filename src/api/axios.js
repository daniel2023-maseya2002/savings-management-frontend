import axios from "axios";
import { toast } from "react-toastify";
import { setupAxiosInterceptors } from "../utils/axiosLoading";

// ✅ Base URL — works in both Vite and CRA
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

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
};

// ✅ Attach access token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const access = tokenService.getAccess();
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

// ✅ Response Interceptor
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

export default axiosInstance;
