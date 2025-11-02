// src/utils/axiosLoading.js
import { create } from "zustand";

export const useGlobalLoading = create((set) => ({
  loading: false,
  activeRequests: 0,
  increment: () => set((s) => {
    const next = s.activeRequests + 1;
    return { activeRequests: next, loading: true };
  }),
  decrement: () => set((s) => {
    const next = Math.max(0, s.activeRequests - 1);
    return { activeRequests: next, loading: next > 0 };
  }),
  reset: () => set({ activeRequests: 0, loading: false }),
}));

export const setupAxiosInterceptors = (axiosInstance) => {
  const { increment, decrement } = useGlobalLoading.getState();

  axiosInstance.interceptors.request.use(
    (config) => {
      increment();
      return config;
    },
    (error) => {
      decrement();
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      decrement();
      return response;
    },
    (error) => {
      decrement();
      return Promise.reject(error);
    }
  );
};
