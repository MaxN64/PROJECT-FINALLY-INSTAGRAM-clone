import mongoose from "mongoose";
import Like from "../models/likeModel.js";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";

const isValidId = (value) => mongoose.isValidObjectId(String(value));

export const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.body || {};
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  const existing = await Like.findOne({ post: postId, user: req.user.id });
  if (existing) {
    await existing.deleteOne();
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();
    return res.json({ liked: false });
  } else {
    await Like.create({ post: postId, user: req.user.id });
    post.likesCount += 1;
    await post.save();
    if (String(post.author) !== req.user.id) {
      await Notification.updateOne(
        {
          user: post.author,
          fromUser: req.user.id,
          post: post._id,
          type: "like",
        },
        {
          $setOnInsert: {
            user: post.author,
            fromUser: req.user.id,
            post: post._id,
            type: "like",
          },
          $set: { read: false },
        },
        { upsert: true }
      );
    }
    return res.json({ liked: true });
  }
});

export const postLikes = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const likes = await Like.find({ post: postId }).populate(
    "user",
    "username name avatarUrl"
  );
  res.json(likes);
});
