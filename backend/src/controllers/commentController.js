import mongoose from "mongoose";
import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";
import Notification from "../models/notificationModel.js";
import CommentLike from "../models/commentLikeModel.js";
import asyncHandler from "../utils/asyncHandler.js";

const isValidId = (value) => mongoose.isValidObjectId(String(value));

export const addComment = asyncHandler(async (req, res) => {
  const { postId, text } = req.body || {};
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const trimmed = String(text || "").trim();
  if (!trimmed) return res.status(400).json({ message: "text is required" });
  if (trimmed.length > 1000) {
    return res.status(400).json({ message: "text exceeds 1000 characters" });
  }

  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });

  const comment = await Comment.create({
    post: postId,
    author: req.user.id,
    text: trimmed,
  });
  post.commentsCount += 1;
  await post.save();

  if (String(post.author) !== req.user.id) {
    await Notification.updateOne(
      {
        user: post.author,
        fromUser: req.user.id,
        post: post._id,
        type: "comment",
      },
      {
        $setOnInsert: {
          user: post.author,
          fromUser: req.user.id,
          post: post._id,
          type: "comment",
        },
        $set: { read: false },
      },
      { upsert: true }
    );
  }
  res.status(201).json(comment);
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid comment id" });
  }
  const comment = await Comment.findById(id);
  if (!comment) return res.status(404).json({ message: "Comment not found" });
  if (String(comment.author) !== req.user.id)
    return res.status(403).json({ message: "Forbidden" });
  await comment.deleteOne();
  await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });
  res.json({ ok: true });
});

export const listComments = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidId(postId)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const { limit } = req.query;

  let query = Comment.find({ post: postId })
    .sort({ createdAt: -1 })
    .populate("author", "username name avatarUrl")
    .lean();

  if (limit !== undefined) {
    const limitNum = Number(limit);
    if (!Number.isNaN(limitNum) && limitNum > 0) {
      query = query.limit(Math.min(limitNum, 50));
    }
  }

  const comments = await query.exec();
  if (comments.length === 0) {
    return res.json([]);
  }

  const commentIds = comments.map((item) => item._id);

  const [counts, viewerLikes] = await Promise.all([
    CommentLike.aggregate([
      { $match: { comment: { $in: commentIds } } },
      { $group: { _id: "$comment", count: { $sum: 1 } } },
    ]),
    CommentLike.find({ comment: { $in: commentIds }, user: req.user.id })
      .select("comment")
      .lean(),
  ]);

  const countMap = new Map(
    counts.map((entry) => [String(entry._id), entry.count])
  );
  const likedSet = new Set(viewerLikes.map((entry) => String(entry.comment)));

  const enriched = comments.map((comment) => ({
    ...comment,
    likesCount: countMap.get(String(comment._id)) || 0,
    viewerHasLiked: likedSet.has(String(comment._id)),
  }));

  res.json(enriched);
});
