const fs = require("fs");
const path = require("path");
const multer = require("multer");
const env = require("../config/env");

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase()
      .slice(0, 40) || "file";

    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${baseName}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (allowedMimeTypes.has(file.mimetype) || file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/")) {
      callback(null, true);
      return;
    }

    callback(new Error("Unsupported file type"), false);
  },
});

module.exports = {
  upload,
};
