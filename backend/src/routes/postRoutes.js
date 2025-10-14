import express from "express";
import {
  createPost,
  listPosts,
  getPost,
  updatePost,
  deletePost,
  feed,
  explorePosts,
} from "../controllers/postController.js";
import { uploadPost } from "../config/upload.js";
import auth from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", auth, uploadPost.single("image"), createPost);

router.get("/", listPosts);
router.get("/feed", auth, feed);
router.get("/explore", explorePosts);
router.get("/:id", auth, getPost);
router.patch("/:id", auth, updatePost);
router.delete("/:id", auth, deletePost);

export default router;
