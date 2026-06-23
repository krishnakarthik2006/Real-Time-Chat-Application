const path = require("path");
require("dotenv").config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  PORT: toNumber(process.env.PORT, 5001),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5001",
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/",
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || "Real_Time_Chat_Application",
  UPLOAD_DIR: path.resolve(__dirname, "..", "..", process.env.UPLOAD_DIR || "uploads"),
  MAX_FILE_SIZE_BYTES: toNumber(process.env.MAX_FILE_SIZE_MB, 5) * 1024 * 1024,
};
