import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  listNotifications,
  markRead,
  markOneRead,
} from "../controllers/notificationController.js";

const router = Router();
router.get("/", auth, listNotifications);
router.post("/mark-read", auth, markRead); 
router.post("/mark-all-read", auth, markRead);
router.post("/:id/read", auth, markOneRead);
export default router;
