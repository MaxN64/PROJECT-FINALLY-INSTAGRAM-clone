import multer from "multer";
import path from "path";
import fs from "fs";

const AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");
const POSTS_DIR = path.join(process.cwd(), "uploads", "posts");

fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(POSTS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const INVALID_NAME_PATTERN = /(\.{2}|[<>:"\\|?*\x00])/;

function sanitizeOriginalName(name) {
  const base = String(name || "")
    .replace(/\s+/g, " ")
    .trim();
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, "");
  const truncated = cleaned.slice(0, 120);
  return truncated || "upload";
}

function makeUploader({ fileSize }) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize },
    fileFilter: (_req, file, cb) => {
      if (!file.originalname || INVALID_NAME_PATTERN.test(file.originalname)) {
        const err = new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          file.fieldname
        );
        err.message = "Invalid file name";
        return cb(err);
      }
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        const err = new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          file.fieldname
        );
        err.message = "Unsupported file type";
        return cb(err);
      }
      file.sanitizedOriginalName = sanitizeOriginalName(file.originalname);
      return cb(null, true);
    },
  });
}

export const uploadAvatar = makeUploader({ fileSize: 2 * 1024 * 1024 });
export const uploadPost = makeUploader({ fileSize: 8 * 1024 * 1024 });

export { POSTS_DIR, AVATARS_DIR };
