import { verifyAccessToken, extractUserId } from "../config/jwt.js";

const OPTIONAL_AUTH_DEBUG =
  String(
    process.env.AUTH_OPTIONAL_DEBUG || process.env.AUTH_MIDDLEWARE_DEBUG || ""
  ).toLowerCase() === "true";

function debug(message, meta = {}) {
  if (OPTIONAL_AUTH_DEBUG) {
    console.debug(`[auth][optional] ${message}`, meta);
  }
}

export default function optionalAuth(req, res, next) {
  const header = req.headers?.authorization || "";
  if (!header.startsWith("Bearer ")) {
    debug("no bearer header");
    return next();
  }

  const token = header.slice(7).trim();
  if (!token) {
    debug("empty token");
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const id = extractUserId(payload);
    if (!id) {
      debug("token payload missing id");
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = { id };
    debug("authorized", { id });
    next();
  } catch (e) {
    debug("verification failed", { error: e.message });
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
