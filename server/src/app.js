const express = require("express");
const cors = require("cors");
const path = require("path");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const uploadRoutes = require("./routes/upload.routes");
const { errorHandler } = require("./middleware/error.middleware");

function createApp(ioRef) {
  const app = express();

  const allowedOrigins = new Set([
    env.CLIENT_URL,
    "http://127.0.0.1:57860",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
  ]);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS policy: origin not allowed"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use((req, _res, next) => {
    req.io = ioRef.current;
    next();
  });
  app.use("/uploads", express.static(path.resolve(env.UPLOAD_DIR)));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/conversations", chatRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
