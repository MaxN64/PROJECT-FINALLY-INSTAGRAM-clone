import { verifyAccessToken, extractUserId } from "../config/jwt.js";

const AUTH_MIDDLEWARE_DEBUG =
  String(process.env.AUTH_MIDDLEWARE_DEBUG || "").toLowerCase() === "true";

function debug(message, meta = {}) {
  if (AUTH_MIDDLEWARE_DEBUG) {
    console.debug(`[auth][protect] ${message}`, meta);
  }
}

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

export function protect(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    debug("missing token");
    return res.status(401).json({ message: "Not authorized: no token" });
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

export default protect;
