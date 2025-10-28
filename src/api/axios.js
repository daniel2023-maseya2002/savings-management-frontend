// src/api/axios.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

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
  },
};

axiosInstance.interceptors.request.use((config) => {
  const access = tokenService.getAccess();
  if (access) config.headers["Authorization"] = `Bearer ${access}`;
  return config;
});

let isRefreshing = false;
let subscribers = [];

function onRefreshed(newToken) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
}

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest) return Promise.reject(err);

    const status = err.response ? err.response.status : null;
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = tokenService.getRefresh();
      if (!refresh) {
        tokenService.clear();
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        const newAccess = res.data.access;
        tokenService.setTokens({ access: newAccess });
        axiosInstance.defaults.headers.common["Authorization"] = "Bearer " + newAccess;
        onRefreshed(newAccess);
        isRefreshing = false;
        originalRequest.headers["Authorization"] = "Bearer " + newAccess;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        tokenService.clear();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
