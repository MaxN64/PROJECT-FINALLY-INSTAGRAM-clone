import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import { toggleLike, postLikes } from "../controllers/likeController.js";

const router = Router();
router.post("/toggle", auth, toggleLike);
router.get("/post/:postId", auth, postLikes);
export default router;
