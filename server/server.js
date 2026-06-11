const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const { Server } = require("socket.io");
const ChatMessage = require("./models/ChatMessage");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/chatapp");

// Socket.io connection
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (message) => {
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Routes
app.get("/messages", async (req, res) => {
  try {
    const messages = await ChatMessage.find();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/messages", async (req, res) => {
  try {
    const { user, message } = req.body;
    if (!user || !message) {
      return res
        .status(400)
        .json({ error: "User and message are required" });
    }
    const chatMessage = new ChatMessage({
      user,
      message,
    });
    await chatMessage.save();
    
    // Emit the new message to all connected clients
    io.emit('message', chatMessage);
    
    res.status(201).json(chatMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start of server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
