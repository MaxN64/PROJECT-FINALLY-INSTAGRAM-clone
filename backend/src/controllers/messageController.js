import mongoose from "mongoose";
import Message from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import asyncHandler from "../utils/asyncHandler.js";

function emitTo(io, userId, event, payload) {
  io.to(`user:${String(userId)}`).emit(event, payload);
}

const isValidId = (value) => mongoose.isValidObjectId(String(value));

export const sendMessage = asyncHandler(async (req, res) => {
  const { to, text } = req.body || {};
  const targetId = String(to || "").trim();
  const cleanText = String(text || "").trim();

  if (!isValidId(targetId)) {
    return res.status(400).json({ message: "Recipient is required" });
  }
  if (!cleanText) {
    return res.status(400).json({ message: "text is required" });
  }
  if (cleanText.length > 5000) {
    return res.status(400).json({ message: "Text exceeds 5000 characters" });
  }
  if (targetId === String(req.user.id)) {
    return res.status(400).json({ message: "Cannot message yourself" });
  }

  const recipient = await User.findById(targetId).select(
    "_id username avatarUrl"
  );
  if (!recipient) {
    return res.status(404).json({ message: "Recipient not found" });
  }

  let msg = await Message.create({
    from: req.user.id,
    to: recipient._id,
    text: cleanText,
  });

  await msg.populate([
    { path: "from", select: "username avatarUrl" },
    { path: "to", select: "username avatarUrl" },
  ]);

  await Notification.updateOne(
    { user: recipient._id, fromUser: req.user.id, type: "message" },
    {
      $setOnInsert: {
        user: recipient._id,
        fromUser: req.user.id,
        type: "message",
      },
      $set: { read: false },
    },
    { upsert: true }
  );

  const io = req.app.get("io");
  const payload = {
    _id: msg._id,
    from: msg.from?._id ?? msg.from,
    to: msg.to?._id ?? msg.to,
    text: msg.text,
    createdAt: msg.createdAt,
  };

  try {
    const rooms = Array.from(io.sockets.adapter.rooms.keys()).slice(0, 20);
    console.log("[WS] rooms (sample):", rooms);
  } catch (_) {}

  emitTo(io, recipient._id, "message:new", payload);
  emitTo(io, req.user.id, "message:new", payload);

  const room = io.sockets.adapter.rooms.get(`user:${String(recipient._id)}`);
  if (room && room.size > 0) {
    emitTo(io, req.user.id, "message:delivered", {
      messageId: msg._id,
      to: recipient._id,
      ts: Date.now(),
    });
  }

  res.status(201).json({
    _id: msg._id,
    from: msg.from,
    to: msg.to,
    text: msg.text,
    createdAt: msg.createdAt,
  });
});

export const conversation = asyncHandler(async (req, res) => {
  const { withUser } = req.params;
  if (!isValidId(withUser)) {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const msgs = await Message.find({
    $or: [
      { from: req.user.id, to: withUser },
      { from: withUser, to: req.user.id },
    ],
  })
    .populate("from", "username avatarUrl")
    .populate("to", "username avatarUrl")
    .sort({ createdAt: 1 });

  res.json(msgs);
});

export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id.toString();

  const messages = await Message.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .populate("from", "username avatarUrl")
    .populate("to", "username avatarUrl")
    .sort({ createdAt: -1 });

  const map = new Map();
  for (const msg of messages) {
    if (!msg.from || !msg.to) continue;
    const isFromMe = String(msg.from?._id || msg.from) === userId;
    const other = isFromMe ? msg.to : msg.from;
    if (!other) continue;
    const otherIdRaw = other?._id || other?.id || other;
    if (!otherIdRaw) continue;
    const otherId = otherIdRaw.toString();
    if (!map.has(otherId)) {
      map.set(otherId, {
        _id: otherId,
        participants: [other],
        lastMessage: msg,
        updatedAt: msg.createdAt,
      });
    }
  }

  res.json(Array.from(map.values()));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  if (!isValidId(conversationId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  const messages = await Message.find({
    $or: [
      { from: req.user.id, to: conversationId },
      { from: conversationId, to: req.user.id },
    ],
  })
    .populate("from", "username avatarUrl")
    .populate("to", "username avatarUrl")
    .sort({ createdAt: 1 });

  res.json(messages);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ message: "Invalid message id" });
  }
  const userId = req.user.id;

  const msg = await Message.findOne({ _id: id, to: userId });
  if (!msg) return res.status(404).json({ message: "Message not found" });

  if (!msg.readAt) {
    msg.readAt = new Date();
    await msg.save();

    const io = req.app.get("io");
    emitTo(io, String(msg.from), "message:read", {
      messageId: msg._id,
      by: userId,
      readAt: msg.readAt,
    });
  }

  res.json({ ok: true, readAt: msg.readAt });
});

export const getMessagesSince = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const cursorRaw = req.query.cursor;
  if (!cursorRaw) {
    return res.status(400).json({ message: "cursor required" });
  }

  const cursor = !Number.isNaN(Number(cursorRaw))
    ? new Date(Number(cursorRaw))
    : new Date(cursorRaw);

  if (Number.isNaN(cursor.getTime())) {
    return res.status(400).json({ message: "invalid cursor" });
  }

  const items = await Message.find({
    $and: [
      { createdAt: { $gt: cursor } },
      { $or: [{ from: userId }, { to: userId }] },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  res.json({ items });
});

export const createTestData = asyncHandler(async (req, res) => {
  if (String(process.env.NODE_ENV).toLowerCase() === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const currentUser = await User.findById(req.user.id);
  if (!currentUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const otherUsers = await User.find({ _id: { $ne: currentUser._id } })
    .limit(2)
    .select("_id");

  if (otherUsers.length < 1) {
    return res
      .status(400)
      .json({ message: "Need at least 1 other user to create test data" });
  }

  const now = Date.now();
  const twoWeeks = 2 * 7 * 24 * 60 * 60 * 1000;
  const otherUser1 = otherUsers[0];
  const otherUser2 = otherUsers[1] || otherUsers[0];

  const testMessages = [
    {
      from: otherUser1._id,
      to: currentUser._id,
      text: "Hey! How are you?",
      createdAt: new Date(now - twoWeeks),
    },
    {
      from: currentUser._id,
      to: otherUser1._id,
      text: "All good, thanks! What's new?",
      createdAt: new Date(now - twoWeeks + 60000),
    },
    {
      from: otherUser1._id,
      to: currentUser._id,
      text: "Getting ready to launch the project, it's going to be great!",
      createdAt: new Date(now - twoWeeks + 120000),
    },
    {
      from: otherUser2._id,
      to: currentUser._id,
      text: "Would love to discuss post ideas for next week",
      createdAt: new Date(now - twoWeeks + 300000),
    },
    {
      from: currentUser._id,
      to: otherUser2._id,
      text: "Let's call tomorrow morning and plan everything",
      createdAt: new Date(now - twoWeeks + 360000),
    },
  ];

  await Message.deleteMany({
    $or: [{ from: currentUser._id }, { to: currentUser._id }],
  });
  const created = await Message.insertMany(testMessages);

  res.json({
    message: "Test data created successfully",
    messages: created.length,
  });
});
