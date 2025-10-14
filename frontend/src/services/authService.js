import { api } from "./api";

export const authService = {
  register: (payload) => api.post("/auth/register", payload),
  login: (payload) => api.post("/auth/login", payload),
  me: () => api.get("/auth/me"),

  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
};
