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
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: toNumber(process.env.DB_PORT, 3306),
  DB_USER: process.env.DB_USER || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: process.env.DB_NAME || "real_time_chat_app",
  UPLOAD_DIR: path.resolve(__dirname, "..", "..", process.env.UPLOAD_DIR || "uploads"),
  MAX_FILE_SIZE_BYTES: toNumber(process.env.MAX_FILE_SIZE_MB, 5) * 1024 * 1024,
};
