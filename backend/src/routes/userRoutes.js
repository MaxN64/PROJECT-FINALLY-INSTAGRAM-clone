import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import {
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/userController.js";

const router = Router();

router.patch("/me", auth, updateProfile);

router.delete("/me", auth, deleteProfile);
router.get("/:username", optionalAuth, getProfile);

export default router;
