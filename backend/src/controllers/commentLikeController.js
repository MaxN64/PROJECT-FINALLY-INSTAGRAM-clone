import mongoose from "mongoose";
import Comment from "../models/commentModel.js";
import CommentLike from "../models/commentLikeModel.js";
import asyncHandler from "../utils/asyncHandler.js";

const isValidId = (value) => mongoose.isValidObjectId(String(value));

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid comment id" });
  }
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });

  const existing = await CommentLike.findOne({
    comment: id,
    user: req.user.id,
  });

  if (existing) {
    await existing.deleteOne();
    const likesCount = await CommentLike.countDocuments({ comment: id });
    return res.json({ liked: false, likesCount });
  }

  await CommentLike.create({ comment: id, user: req.user.id });
  const likesCount = await CommentLike.countDocuments({ comment: id });
  return res.json({ liked: true, likesCount });
});

export const listCommentLikes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid comment id" });
  }
  const likes = await CommentLike.find({ comment: id })
    .sort({ createdAt: -1 })
    .populate("user", "_id username name avatarUrl");
  return res.json(likes);
});
