import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  addComment,
  deleteComment,
  listComments,
} from "../controllers/commentController.js";
import {
  listCommentLikes,
  toggleCommentLike,
} from "../controllers/commentLikeController.js";

const router = Router();

router.post("/", auth, addComment);
router.post("/:id/like", auth, toggleCommentLike);
router.get("/:id/likes", auth, listCommentLikes);
router.delete("/:id", auth, deleteComment);
router.get("/post/:postId", auth, listComments);

export default router;
