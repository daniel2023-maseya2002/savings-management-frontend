// src/lib/chatAuth.js
import axios, { tokenService } from "../api/axios"; // adjust path if utils is elsewhere

// Endpoints (relative to axios baseURL)
export const ENDPOINTS = {
  MESSAGE: "/chat/message/",
  HISTORY: "/chat/history/",
  ALL: "/chat/all/",
  REFRESH: "/auth/token/refresh/", // used by axios refresh logic in your utils
};

// Token helpers (wrap tokenService)
export function getAccessToken() {
  return tokenService.getAccess();
}
export function getRefreshToken() {
  return tokenService.getRefresh();
}
export function saveTokens({ access, refresh }) {
  tokenService.setTokens({ access, refresh });
}
export function clearAuth() {
  tokenService.clear();
}

// Optional small wrapper for axios calls used by chat pages
export async function apiGet(url, params = {}) {
  const res = await axios.get(url, { params });
  return res.data;
}
export async function apiPost(url, data = {}) {
  const res = await axios.post(url, data);
  return res.data;
}
