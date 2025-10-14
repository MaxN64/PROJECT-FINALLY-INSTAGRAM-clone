import fs from "fs";
import path from "path";

import User from "../models/userModel.js";
import Follow from "../models/followModel.js";
import Notification from "../models/notificationModel.js";
import Post from "../models/postModel.js";
import Like from "../models/likeModel.js";
import Comment from "../models/commentModel.js";
import Message from "../models/messageModel.js";
import asyncHandler from "../utils/asyncHandler.js";

const POSTS_DIR = path.join(process.cwd(), "uploads", "posts");

export const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username: username.toLowerCase() }).select(
    "-passwordHash"
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  if (req.user && user._id.toString() !== req.user.id) {
    await Notification.updateOne(
      { user: user._id, fromUser: req.user.id, type: "profile_view" },
      {
        $setOnInsert: {
          user: user._id,
          fromUser: req.user.id,
          type: "profile_view",
        },
        $set: { read: false },
      },
      { upsert: true }
    );
  }

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
  ]);
  const payload = {
    ...user.toObject({ virtuals: true }),
    followersCount,
    followingCount,
  };
  res.json(payload);
});

function sanitizeWebsite(value) {
  if (value === undefined) return undefined;
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!url.protocol.startsWith("http")) {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch (_) {
    const err = new Error("Invalid website URL");
    err.status = 400;
    throw err;
  }
}

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "bio", "website"];
  const updates = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
      updates[key] = req.body[key];
    }
  }

  if (updates.name !== undefined) {
    updates.name = String(updates.name || "").trim();
    if (updates.name.length > 80) {
      return res
        .status(400)
        .json({ message: "Name must be at most 80 characters" });
    }
  }

  if (updates.bio !== undefined) {
    updates.bio = String(updates.bio || "").trim();
    if (updates.bio.length > 280) {
      return res
        .status(400)
        .json({ message: "Bio must be at most 280 characters" });
    }
  }

  if (updates.website !== undefined) {
    updates.website = sanitizeWebsite(updates.website);
  }

  if (
    req.body?.avatarUrl &&
    typeof req.body.avatarUrl === "string" &&
    req.body.avatarUrl.startsWith("data:image/")
  ) {
    updates.avatarUrl = req.body.avatarUrl;
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const [followersCount, followingCount] = await Promise.all([
    Follow.countDocuments({ following: user._id }),
    Follow.countDocuments({ follower: user._id }),
  ]);

  res.json({
    ...user.toObject({ virtuals: true }),
    followersCount,
    followingCount,
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ author: userId }).select("_id imageUrl");
    const postIds = posts.map((post) => post._id);

    for (const post of posts) {
      if (!post.imageUrl) continue;
      const filename = path.basename(post.imageUrl);
      const filePath = path.join(POSTS_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.warn("Failed to remove post asset", fileErr);
        }
      }
    }

    const cleanupPromises = [
      Follow.deleteMany({
        $or: [{ follower: userId }, { following: userId }],
      }),
      Like.deleteMany({ user: userId }),
      Comment.deleteMany({ author: userId }),
      Notification.deleteMany({
        $or: [{ user: userId }, { fromUser: userId }],
      }),
      Message.deleteMany({
        $or: [{ from: userId }, { to: userId }],
      }),
    ];

    if (postIds.length > 0) {
      cleanupPromises.push(
        Like.deleteMany({ post: { $in: postIds } }),
        Comment.deleteMany({ post: { $in: postIds } }),
        Notification.deleteMany({ post: { $in: postIds } }),
        Post.deleteMany({ _id: { $in: postIds } })
      );
    }

    await Promise.all(cleanupPromises);
    await User.findByIdAndDelete(userId);

    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete profile", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
});
