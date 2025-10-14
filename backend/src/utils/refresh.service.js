import crypto from "crypto";
import RefreshToken from "../models/refreshTokenModel.js";
import { signAccessToken, signRefreshToken, getJwtExp } from "../config/jwt.js";

function toUserId(userId) {
  return userId?.toString?.() || String(userId || "").trim();
}

function calculateExpiresAt(token) {
  const exp = getJwtExp(token);
  if (typeof exp === "number") {
    return new Date(exp * 1000);
  }
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + thirtyDaysMs);
}

async function assertRefreshTokenIsActive(jti, userId) {
  if (!jti || !userId) {
    throw new Error("Invalid refresh token payload");
  }

  const tokenEntry = await RefreshToken.findOne({ jti, userId });
  if (!tokenEntry) {
    throw new Error("Refresh token not registered");
  }
  if (tokenEntry.revokedAt) {
    throw new Error("Refresh token revoked");
  }
  if (tokenEntry.expiresAt && tokenEntry.expiresAt <= new Date()) {
    throw new Error("Refresh token expired");
  }

  return tokenEntry;
}

export async function issueTokens(userId) {
  const normalizedId = toUserId(userId);
  if (!normalizedId) {
    throw new Error("Cannot issue tokens without user id");
  }

  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({ id: normalizedId, sub: normalizedId });
  const refreshToken = signRefreshToken({ sub: normalizedId, jti });

  await RefreshToken.create({
    jti,
    userId: normalizedId,
    revokedAt: null,
    expiresAt: calculateExpiresAt(refreshToken),
  });

  return { accessToken, refreshToken, jti };
}

export async function rotateRefresh(oldJti, userId) {
  const normalizedId = toUserId(userId);
  const record = await assertRefreshTokenIsActive(oldJti, normalizedId);

  await RefreshToken.updateOne(
    { _id: record._id },
    { $set: { revokedAt: new Date() } }
  );

  return issueTokens(normalizedId);
}

export async function revokeAll(userId) {
  const normalizedId = toUserId(userId);
  if (!normalizedId) return;

  await RefreshToken.updateMany(
    { userId: normalizedId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

export async function ensureRefreshTokenActive(jti, userId) {
  return assertRefreshTokenIsActive(jti, toUserId(userId));
}
