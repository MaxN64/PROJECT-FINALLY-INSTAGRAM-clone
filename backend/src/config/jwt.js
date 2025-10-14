import jwt from "jsonwebtoken";

const ACCESS_JWT_EXPIRES_IN = process.env.ACCESS_JWT_EXPIRES_IN || "15m";
const REFRESH_JWT_EXPIRES_IN = process.env.REFRESH_JWT_EXPIRES_IN || "30d";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in backend .env");
  process.exit(1);
}
if (!REFRESH_JWT_SECRET) {
  console.error(
    "FATAL: REFRESH_JWT_SECRET is not set in backend .env (fallback to JWT_SECRET failed)"
  );
  process.exit(1);
}

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_JWT_EXPIRES_IN,
    ...options,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function signRefreshToken(payload, options = {}) {
  return jwt.sign(payload, REFRESH_JWT_SECRET, {
    expiresIn: REFRESH_JWT_EXPIRES_IN,
    ...options,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_JWT_SECRET);
}

export function extractUserId(payload) {
  return String(
    payload?.id ??
      payload?._id ??
      payload?.userId ??
      payload?.uid ??
      payload?.sub ??
      ""
  ).trim();
}

export function getJwtExp(token) {
  try {
    const [, b64] = token.split(".");
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return typeof json?.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

export const TOKENS_CONFIG = {
  ACCESS_JWT_EXPIRES_IN,
  REFRESH_JWT_EXPIRES_IN,
};
