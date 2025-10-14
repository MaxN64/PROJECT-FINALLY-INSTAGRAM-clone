import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/userModel.js";
import { verifyRefreshToken, extractUserId } from "../config/jwt.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  issueTokens,
  rotateRefresh,
  revokeAll,
} from "../utils/refresh.service.js";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-z0-9._]+$/i;

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
function normalizeName(value) {
  return String(value || "").trim();
}

function validatePassword(password) {
  const value = String(password || "");
  if (value.length < 8) return "Password must be at least 8 characters";
  if (value.length > 128) return "Password is too long";
  return null;
}

function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",

    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function clearRefreshCookie(res) {
  res.cookie("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 0,
  });
}

export const register = asyncHandler(async (req, res) => {
  const { email, password, username, name } = req.body || {};

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);
  const normalizedName = normalizeName(name);
  const passwordError = validatePassword(password);

  if (!normalizedEmail || !password || !normalizedUsername || !normalizedName) {
    return res
      .status(400)
      .json({ message: "email, password, username, name are required" });
  }

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  if (
    normalizedUsername.length < 3 ||
    normalizedUsername.length > 30 ||
    !usernameRegex.test(normalizedUsername)
  ) {
    return res.status(400).json({
      message:
        "Username must be 3-30 characters and contain only letters, numbers, dot or underscore",
    });
  }

  if (normalizedName.length > 80) {
    return res
      .status(400)
      .json({ message: "Name must be at most 80 characters" });
  }

  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const exists = await User.exists({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  });
  if (exists) {
    return res
      .status(409)
      .json({ message: "Email or username already in use" });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await User.create({
    email: normalizedEmail,
    username: normalizedUsername,
    name: normalizedName,
    passwordHash,
  });

  const { accessToken, refreshToken } = await issueTokens(user._id);
  setRefreshCookie(res, refreshToken);

  return res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
    },
    accessToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "identifier and password are required" });
  }

  const ident = String(identifier).toLowerCase().trim();
  const user = await User.findOne({
    $or: [{ email: ident }, { username: ident }],
  });
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const ok = await user.comparePassword(String(password));
  if (!ok) return res.status(400).json({ message: "Invalid credentials" });

  const { accessToken, refreshToken } = await issueTokens(user._id);
  setRefreshCookie(res, refreshToken);

  return res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
    },
    accessToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: "No refresh token" });

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (_e) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const userId = extractUserId(payload);
  const jti = payload?.jti;
  if (!userId || !jti) {
    return res.status(401).json({ message: "Invalid refresh payload" });
  }

  let tokens;
  try {
    tokens = await rotateRefresh(jti, userId);
  } catch (_err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const { accessToken, refreshToken } = tokens;
  setRefreshCookie(res, refreshToken);

  return res.json({ accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const userId = extractUserId(payload);
      if (userId) {
        await revokeAll(userId);
      }
    } catch (_err) {}
  }

  clearRefreshCookie(res);
  return res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatarUrl: user.avatarUrl || null,
    },
  });
});

export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (!emailRegex.test(normalized)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const user = await User.findOne({ email: normalized });

  const genericResponse = {
    ok: true,
    message:
      "If an account exists we have sent reset instructions to the provided email.",
  };

  if (!user) {
    if (process.env.NODE_ENV !== "production") {
      return res.json({ ...genericResponse, resetUrl: null });
    }
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  const origin = (process.env.APP_ORIGIN || "http://localhost:5173").replace(
    /\/$/,
    ""
  );
  const resetUrl = `${origin}/reset/confirm?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  if (process.env.NODE_ENV !== "production") {
    return res.json({ ...genericResponse, resetUrl });
  }
  return res.json(genericResponse);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) {
    return res.status(400).json({ message: "token and password are required" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res
      .status(400)
      .json({ message: "Password must be at least 8 characters" });
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Reset token is invalid or expired" });
  }

  user.passwordHash = await bcrypt.hash(String(password), 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return res.json({ ok: true, message: "Password updated" });
});
