import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./authToken";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing = false;
let waiters = [];

function queueRetry(resolve, reject) {
  waiters.push({ resolve, reject });
}

async function doRefresh() {
  try {
    const { data } = await api.post("/auth/refresh");
    const newAccess = data?.accessToken || "";
    if (!newAccess) throw new Error("No accessToken in refresh response");

    setAccessToken(newAccess);

    waiters.forEach((w) => w.resolve(newAccess));
  } catch (e) {
    clearAccessToken();

    waiters.forEach((w) => w.reject(e));
    throw e;
  } finally {
    refreshing = false;
    waiters = [];
  }
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    const message =
      data?.error?.message ||
      data?.message ||
      error?.message ||
      "Network error";

    const original = error?.config || {};
    if (status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queueRetry(
            (token) => {
              original.headers = original.headers || {};
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            (e) =>
              reject(Object.assign(e, { friendlyMessage: message, status }))
          );
        });
      }

      refreshing = true;
      return new Promise((resolve, reject) => {
        doRefresh()
          .then((token) => {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          })
          .catch((e) => {
            reject(Object.assign(e, { friendlyMessage: message, status }));
          });
      });
    }

    return Promise.reject(
      Object.assign(error, { friendlyMessage: message, status })
    );
  }
);

export const sendMessageApi = (to, text) => api.post("/messages", { to, text });
export const getConversationApi = (withUser, params) =>
  api.get(`/messages/with/${withUser}`, { params });
export const getConversationsApi = () => api.get("/messages/conversations");
export const getMessagesByConversationApi = (conversationId) =>
  api.get(`/messages/${conversationId}`);
export const markMessageReadApi = (id) => api.patch(`/messages/${id}/read`);
export const getMessagesSinceApi = (cursor) =>
  api.get("/messages/since", { params: { cursor } });
