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

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
  },
});

module.exports = {
  upload,
};
