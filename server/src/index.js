const http = require("http");
const { Server } = require("socket.io");
const env = require("./config/env");
const { initDatabase } = require("./config/db");
const createApp = require("./app");
const { setupSocket } = require("./services/socket.service");

async function start() {
  await initDatabase();

  const ioRef = { current: null };
  const app = createApp(ioRef);
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || origin === env.CLIENT_URL || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS policy: origin not allowed"));
      },
      credentials: true,
    },
  });

  ioRef.current = io;
  setupSocket(io);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${env.PORT} is already in use. Stop the existing server or set PORT in .env to a different value.`);
    } else {
      console.error("Server error:", error);
    }
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    console.log(`Chat server listening on http://localhost:${env.PORT}`);
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

start().catch((error) => {
  console.error("Unable to start the server.", error);
  process.exit(1);
});
