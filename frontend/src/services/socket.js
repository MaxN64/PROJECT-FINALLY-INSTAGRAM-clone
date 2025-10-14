import { io } from "socket.io-client";
import { getAccessToken } from "./authToken";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
function originFrom(url) {
  try {
    return new URL(
      url,
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173"
    ).origin;
  } catch {
    return "http://localhost:4000";
  }
}
const WS_ORIGIN = import.meta.env.VITE_WS_URL || originFrom(API);
const WS_PATH = import.meta.env.VITE_WS_PATH || "/socket.io";

export let socket = null;

function buildAuth() {
  const t = getAccessToken();
  return t ? { token: `Bearer ${t}` } : undefined;
}

export function connectSocket() {
  try {
    if (socket) {
      socket.removeAllListeners();
      if (socket.connected) socket.disconnect();
    }
  } catch {}

  socket = io(WS_ORIGIN, {
    path: WS_PATH,
    transports: ["websocket"],
    withCredentials: true,
    auth: buildAuth(),
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("[WS] connected", socket.id);
  });
  socket.on("connect_error", (err) => {
    console.warn("[WS] connect_error:", err?.message || err);
  });
  socket.on("disconnect", (reason) => {
    console.warn("[WS] disconnected:", reason);
  });

  return socket;
}

export function reconnectWithFreshToken() {
  connectSocket();
}

export function getSocket() {
  if (!socket) connectSocket();
  return socket;
}

export function disconnectSocket() {
  try {
    if (socket) {
      socket.removeAllListeners();
      if (socket.connected) socket.disconnect();
    }
  } catch {}
}
