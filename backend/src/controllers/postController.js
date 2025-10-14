import crypto from "crypto";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import Post from "../models/postModel.js";
import Like from "../models/likeModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import Follow from "../models/followModel.js";
import { getExplorePosts } from "../models/exploreModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { POSTS_DIR } from "../config/upload.js";

fs.mkdirSync(POSTS_DIR, { recursive: true });

const MAX_STORAGE_BYTES =
  Number(process.env.POST_STORAGE_LIMIT_MB || 50) * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function resolveBaseUrl(req) {
  const configuredOrigin = (process.env.APP_ORIGIN || "").trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }
  const hostHeader = String(req.get("host") || "")
    .split(",")[0]
    .trim();
  const fallbackHost = hostHeader || req.hostname;
  return `${req.protocol}://${fallbackHost}`.replace(/\/$/, "");
}

function getAssetBaseUrl(req) {
  const configured = (
    process.env.ASSET_BASE_URL ||
    process.env.API_PUBLIC_BASE_URL ||
    ""
  ).trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }
  return resolveBaseUrl(req);
}

const ensureObjectId = (value) => mongoose.isValidObjectId(String(value));

function sanitizeOriginalName(name) {
  const base = String(name || "")
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "");
  const truncated = cleaned.slice(0, 120);
  return truncated || "upload";
}

async function processImage(buffer, mime) {
  const image = sharp(buffer, { failOnError: false }).rotate().resize({
    width: 2048,
    height: 2048,
    fit: "inside",
    withoutEnlargement: true,
  });

  if (mime === "image/png") {
    return {
      buffer: await image.png({ compressionLevel: 9 }).toBuffer(),
      extension: "png",
    };
  }
  if (mime === "image/webp") {
    return {
      buffer: await image.webp({ quality: 90, effort: 4 }).toBuffer(),
      extension: "webp",
    };
  }

  return {
    buffer: await image
      .jpeg({ quality: 85, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toBuffer(),
    extension: "jpg",
  };
}

async function calculateUsage(userId) {
  if (!mongoose.Types.ObjectId.isValid(String(userId))) {
    return 0;
  }
  const [result] = await Post.aggregate([
    { $match: { author: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: "$imageBytes" } } },
  ]);
  return result?.total || 0;
}

export const createPost = asyncHandler(async (req, res) => {
  const { caption } = req.body || {};
  const imageFile = req.file;

  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  if (!imageFile) {
    return res.status(400).json({ message: "Image is required" });
  }

  if (typeof caption === "string" && caption.length > 2200) {
    return res.status(400).json({ message: "Caption is too long (max 2200)" });
  }

  const originalName =
    imageFile.sanitizedOriginalName ||
    sanitizeOriginalName(imageFile.originalname);
  if (originalName !== imageFile.originalname) {
    console.warn(
      `[upload] sanitized original filename from "${imageFile.originalname}" to "${originalName}"`
    );
  }

  const detected = await fileTypeFromBuffer(imageFile.buffer);
  if (!detected || !SUPPORTED_MIME_TYPES.has(detected.mime)) {
    const err = new Error("Unsupported or unrecognized image type");
    err.status = 400;
    throw err;
  }

  const { buffer: processedBuffer, extension } = await processImage(
    imageFile.buffer,
    detected.mime
  );
  const incomingBytes = processedBuffer.length;

  const currentUsage = await calculateUsage(req.user.id);
  if (currentUsage + incomingBytes > MAX_STORAGE_BYTES) {
    return res.status(413).json({ message: "Storage quota exceeded" });
  }

  const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(POSTS_DIR, filename);
  const base = getAssetBaseUrl(req);
  const imageUrl = `${base}/uploads/posts/${filename}`;

  let wroteFile = false;
  try {
    await fsPromises.writeFile(filePath, processedBuffer);
    wroteFile = true;

    const post = await Post.create({
      author: req.user.id,
      caption,
      imageUrl,
      imageBytes: incomingBytes,
      originalFilename: originalName,
    });

    res.status(201).json(post);
  } catch (error) {
    if (wroteFile) {
      try {
        await fsPromises.unlink(filePath);
      } catch (_) {}
    }
    if (error.name === "ValidationError") {
      error.status = 400;
    }
    throw error;
  }
});

export const listPosts = asyncHandler(async (req, res) => {
  const { user } = req.query;
  const criteria = {};
  if (user) {
    const normalized = String(user).toLowerCase().trim();
    const owner = await User.findOne({ username: normalized }).select("_id");
    if (!owner) return res.status(404).json({ message: "User not found" });
    criteria.author = owner._id;
  }

  const posts = await Post.find(criteria)
    .sort({ createdAt: -1 })
    .populate("author", "username name avatarUrl");

  res.json(posts);
});

export const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!ensureObjectId(id)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const viewerId = req.user?.id ? String(req.user.id) : null;
  const post = await Post.findById(id)
    .populate("author", "username name avatarUrl")
    .lean();

  if (!post) return res.status(404).json({ message: "Post not found" });

  let author = post.author || null;
  if (author && viewerId) {
    const authorId = String(author._id || author.id);
    if (authorId !== viewerId) {
      const isFollowing = await Follow.exists({
        follower: viewerId,
        following: authorId,
      });
      author = { ...author, isFollowing: Boolean(isFollowing) };
    } else {
      author = { ...author, isFollowing: false };
    }
  }

  res.json({ ...post, author });
});

export const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!ensureObjectId(id)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (String(post.author) !== req.user.id)
    return res.status(403).json({ message: "Forbidden" });

  const { caption } = req.body || {};
  if (caption !== undefined) {
    if (String(caption).length > 2200) {
      return res
        .status(400)
        .json({ message: "Caption is too long (max 2200)" });
    }
    post.caption = caption;
  }
  await post.save();
  res.json(post);
});

export const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!ensureObjectId(id)) {
    return res.status(400).json({ message: "Invalid post id" });
  }
  const post = await Post.findById(id);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (String(post.author) !== req.user.id)
    return res.status(403).json({ message: "Forbidden" });

  if (post.imageUrl) {
    const filename = path.basename(post.imageUrl);
    const filePath = path.join(POSTS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        await fsPromises.unlink(filePath);
      } catch (_) {}
    }
  }

  await Like.deleteMany({ post: post._id });
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();
  res.json({ ok: true });
});

export const feed = asyncHandler(async (req, res) => {
  const viewerIdStr = String(req.user.id);
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);

  const rows = await Follow.find({ follower: req.user.id }).select("following");
  const followedIds = rows.map((row) => String(row.following));
  const followedSet = new Set(followedIds);

  const primaryAuthorIds = [...followedSet, viewerIdStr];

  const primaryPosts = await Post.find({ author: { $in: primaryAuthorIds } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "username name avatarUrl")
    .lean();

  const primaryWithFlag = primaryPosts.map((p) => {
    const authorIdStr = String(p.author?._id || p.author?.id);
    return {
      ...p,
      author: {
        ...p.author,
        isFollowing:
          authorIdStr !== viewerIdStr && followedSet.has(authorIdStr),
      },
    };
  });

  if (primaryWithFlag.length >= limit) {
    return res.json(primaryWithFlag);
  }

  const need = limit - primaryWithFlag.length;

  const extraPosts = await Post.find({
    author: { $nin: primaryAuthorIds },
  })
    .sort({ createdAt: -1 })
    .limit(need)
    .populate("author", "username name avatarUrl")
    .lean();

  const extraWithFlag = extraPosts.map((p) => ({
    ...p,
    author: {
      ...p.author,
      isFollowing: false,
    },
  }));

  return res.json([...primaryWithFlag, ...extraWithFlag]);
});

export const explorePosts = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 100);
  const posts = await getExplorePosts(limit);
  res.json(posts);
});
