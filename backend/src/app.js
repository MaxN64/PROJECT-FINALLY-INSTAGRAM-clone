import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import multer from "multer";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";

export function createApp() {
  const app = express();

  app.disable("etag");
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("Pragma", "no-cache");
    next();
  });

  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cspConnectSources = new Set(["'self'"]);
  for (const origin of allowedOrigins) {
    cspConnectSources.add(origin);
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
        cspConnectSources.add(url.origin);
      }
    } catch (_error) {}
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "connect-src": Array.from(cspConnectSources),
          "img-src": ["'self'", "data:", "blob:"],
          "script-src": ["'self'"],
          "style-src": ["'self'"],
          "frame-ancestors": ["'none'"],
          "object-src": ["'none'"],
          "base-uri": ["'self'"],
          "form-action": ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" },
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, origin);
        }
        const error = new Error("Origin not allowed");
        error.status = 403;
        return callback(error);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use(
    "/uploads/posts",
    express.static(path.join(uploadsDir, "posts"), {
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'none'; img-src 'self'"
        );
      },
    })
  );
  app.use(
    "/uploads/avatars",
    express.static(path.join(uploadsDir, "avatars"), {
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Disposition", "inline");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'none'; img-src 'self'"
        );
      },
    })
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/likes", likeRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/follows", followRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/search", searchRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);

    if (err instanceof multer.MulterError) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Uploaded file is too large"
          : err.message || "File upload error";
      return res.status(status).json({ message });
    }

    if (
      typeof err?.message === "string" &&
      err.message.toLowerCase().includes("sharp")
    ) {
      return res.status(415).json({ message: "Image processing failed" });
    }

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid identifier" });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    let status = Number.isInteger(err.statusCode)
      ? err.statusCode
      : Number.isInteger(err.status)
      ? err.status
      : 500;

    if (status < 400 || status > 599) {
      status = 500;
    }

    const message =
      status >= 500 ? "Server error" : err.message || "Request failed";
    res.status(status).json({ message });
  });

  return app;
}

export default createApp;
