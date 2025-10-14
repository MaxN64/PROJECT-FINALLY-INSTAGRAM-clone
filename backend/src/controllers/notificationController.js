import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const items = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("fromUser", "username name avatarUrl")
    .populate("post", "imageUrl");
  const normalized = items.map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
    actor: n.fromUser
      ? {
          username: n.fromUser.username,
          name: n.fromUser.name,
          avatarUrl: n.fromUser.avatarUrl,
        }
      : null,
    target: n.post
      ? {
          postId: n.post?._id?.toString?.() || n.post,
          previewUrl: n.post.imageUrl,
        }
      : null,
  }));
  res.json(normalized);
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { $set: { read: true } }
  );
  res.json({ ok: true });
});

export const markOneRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Notification.updateOne(
    { _id: id, user: req.user.id },
    { $set: { read: true } }
  );
  res.json({ ok: true });
});
