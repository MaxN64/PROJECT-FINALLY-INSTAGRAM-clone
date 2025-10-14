import express from "express";
import {
  sendMessage,
  conversation,
  getConversations,
  getMessages,
  markAsRead,
  getMessagesSince,
  createTestData,
} from "../controllers/messageController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/conversations", getConversations);

router.get("/since", getMessagesSince);

router.get("/with/:withUser", conversation);

router.get("/:conversationId", getMessages);

router.patch("/:id/read", markAsRead);

router.post("/", sendMessage);

router.post("/test-data", createTestData);

export default router;
