import { Router } from "express";
import {
  register,
  login,
  me,
  requestPasswordReset,
  resetPassword,
  refresh,
  logout,
} from "../controllers/authController.js";
import auth from "../middlewares/authMiddleware.js";
import createRateLimiter from "../middlewares/rateLimit.js";

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, please try again later",
});

const resetLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password requests, please try again later",
});

const refreshLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: "Too many token refresh attempts, please slow down",
});

const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many registrations from this IP, please slow down",
});

const router = Router();

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/me", auth, me);

router.post("/password/forgot", resetLimiter, requestPasswordReset);
router.post("/password/reset", resetLimiter, resetPassword);

router.post("/refresh", refreshLimiter, refresh);
router.post("/logout", logout);

export default router;
