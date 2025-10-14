import mongoose from "mongoose";
import Follow from "../models/followModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";

const isValidId = (value) => mongoose.isValidObjectId(String(value));

function getTargetId(req) {
  return req.body?.targetUserId || req.body?.userId || req.params?.userId;
}

async function ensureTargetExists(targetId) {
  if (!isValidId(targetId)) {
    const err = new Error("Invalid user id");
    err.status = 400;
    throw err;
  }
  const exists = await User.exists({ _id: targetId });
  if (!exists) {
    const err = new Error("Target user not found");
    err.status = 404;
    throw err;
  }
}

export const follow = asyncHandler(async (req, res) => {
  const targetId = getTargetId(req);

  if (!targetId) {
    return res.status(400).json({ message: "Target user is required" });
  }
  if (String(targetId) === String(req.user.id)) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  await ensureTargetExists(targetId);

  await Follow.updateOne(
    { follower: req.user.id, following: targetId },
    { $setOnInsert: { follower: req.user.id, following: targetId } },
    { upsert: true }
  );

  await Notification.updateOne(
    { user: targetId, fromUser: req.user.id, type: "follow" },
    {
      $setOnInsert: { user: targetId, fromUser: req.user.id, type: "follow" },
      $set: { read: false },
    },
    { upsert: true }
  );

  return res.json({ following: true });
});

export const unfollow = asyncHandler(async (req, res) => {
  const targetId = getTargetId(req);

  if (!targetId) {
    return res.status(400).json({ message: "Target user is required" });
  }
  if (String(targetId) === String(req.user.id)) {
    return res.status(400).json({ message: "Cannot unfollow yourself" });
  }

  if (isValidId(targetId)) {
    await Follow.deleteOne({ follower: req.user.id, following: targetId });
  }
  return res.json({ following: false });
});

export const toggle = asyncHandler(async (req, res) => {
  const targetId = getTargetId(req);

  if (!targetId) {
    return res.status(400).json({ message: "Target user is required" });
  }
  if (String(targetId) === String(req.user.id)) {
    return res.status(400).json({ message: "Cannot follow yourself" });
  }

  await ensureTargetExists(targetId);

  const existing = await Follow.findOne({
    follower: req.user.id,
    following: targetId,
  });

  if (existing) {
    await Follow.deleteOne({ _id: existing._id });
    return res.json({ following: false });
  } else {
    await Follow.create({ follower: req.user.id, following: targetId });

    await Notification.updateOne(
      { user: targetId, fromUser: req.user.id, type: "follow" },
      {
        $setOnInsert: {
          user: targetId,
          fromUser: req.user.id,
          type: "follow",
        },
        $set: { read: false },
      },
      { upsert: true }
    );

    return res.json({ following: true });
  }
});

export const followers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const rows = await Follow.find({ following: userId }).populate(
    "follower",
    "_id username name avatarUrl"
  );
  return res.json(rows.map((r) => r.follower));
});

export const following = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidId(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const rows = await Follow.find({ follower: userId }).populate(
    "following",
    "_id username name avatarUrl"
  );
  return res.json(rows.map((r) => r.following));
});
