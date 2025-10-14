import { Server } from "socket.io";
import { verifyAccessToken, extractUserId } from "./config/jwt.js";

export function initSocket(server, app) {
  const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new Server(server, {
    path: process.env.WS_PATH || "/socket.io",
    cors: { origin: origins, credentials: true },
  });

  const SKIP_AUTH =
    String(process.env.SOCKET_AUTH_OFF || "").toLowerCase() === "true";
  const DEBUG = String(process.env.SOCKET_DEBUG || "").toLowerCase() === "true";

  io.use((socket, next) => {
    if (SKIP_AUTH) {
      if (DEBUG) console.debug("[WS auth] skipping auth");
      return next();
    }

    try {
      let rawAccessToken =
        socket.handshake?.auth?.token ||
        socket.handshake?.headers?.authorization ||
        socket.handshake?.query?.token;

      if (!rawAccessToken) {
        if (DEBUG) console.warn("[WS auth] no token source");
        return next(new Error("No token"));
      }

      const accessToken = String(rawAccessToken).startsWith("Bearer ")
        ? String(rawAccessToken).slice(7).trim()
        : String(rawAccessToken).trim();

      let payload;
      try {
        payload = verifyAccessToken(accessToken);
      } catch (e) {
        if (DEBUG) console.warn("[WS auth] verify failed:", e.message);
        return next(new Error("Auth failed"));
      }

      const userId = extractUserId(payload);
      if (!userId) {
        if (DEBUG) console.warn("[WS auth] payload missing user id");
        return next(new Error("Auth failed"));
      }

      socket.user = { id: String(userId) };
      if (DEBUG)
        console.debug("[WS auth] authorized", { userId: socket.user.id });
      next();
    } catch (e) {
      if (DEBUG) console.warn("[WS auth] unexpected:", e.message);
      next(new Error("Auth failed"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id || "anonymous";
    const room = `user:${userId}`;
    socket.join(room);

    console.log("[WS] connected", {
      userId,
      sid: socket.id,
      rooms: [...socket.rooms],
    });

    io.to(room).emit("connected", {
      type: "connected",
      userId,
      ts: Date.now(),
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] disconnected", { userId, sid: socket.id, reason });
    });
  });

  app.set("io", io);
  return io;
}
