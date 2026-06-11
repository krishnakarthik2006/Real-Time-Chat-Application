const { verifyToken } = require("../utils/auth");
const {
  findUserById,
  isConversationParticipant,
  markPendingDirectMessagesDelivered,
  updateUserLastSeen,
} = require("./chat.service");
const { presenceService, userRoom, conversationRoom } = require("./presence.service");

function groupStatusesByConversation(items) {
  const grouped = new Map();

  items.forEach((item) => {
    const key = `${item.senderId}:${item.conversationId}`;
    const current = grouped.get(key) || {
      senderId: item.senderId,
      conversationId: item.conversationId,
      messageIds: [],
    };

    current.messageIds.push(item.id);
    grouped.set(key, current);
  });

  return Array.from(grouped.values());
}

function safelyHandle(handler) {
  return async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error("Socket handler failed.", error);
    }
  };
}

function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const payload = verifyToken(token);
      const user = await findUserById(payload.id);

      if (!user) {
        return next(new Error("User not found."));
      }

      socket.data.user = {
        id: user.id,
        name: user.name,
      };

      return next();
    } catch (_error) {
      return next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", safelyHandle(async (socket) => {
    const user = socket.data.user;

    presenceService.connect(user.id, socket.id);
    socket.join(userRoom(user.id));
    socket.emit("presence:snapshot", {
      onlineUserIds: presenceService.getOnlineUserIds(),
    });
    io.emit("presence:update", {
      userId: user.id,
      isOnline: true,
      lastSeen: null,
    });

    const deliveredMessages = await markPendingDirectMessagesDelivered(user.id);
    const groupedDeliveredStatuses = groupStatusesByConversation(deliveredMessages);

    groupedDeliveredStatuses.forEach((statusUpdate) => {
      io.to(userRoom(statusUpdate.senderId)).emit("message:status", {
        conversationId: statusUpdate.conversationId,
        messageIds: statusUpdate.messageIds,
        status: "delivered",
      });
    });

    socket.on("conversation:join", safelyHandle(async ({ conversationId }) => {
      const membership = await isConversationParticipant(Number(conversationId), user.id);

      if (membership) {
        socket.join(conversationRoom(conversationId));
      }
    }));

    socket.on("conversation:leave", safelyHandle(async ({ conversationId }) => {
      socket.leave(conversationRoom(conversationId));
    }));

    socket.on("typing:start", safelyHandle(async ({ conversationId }) => {
      const membership = await isConversationParticipant(Number(conversationId), user.id);

      if (membership) {
        socket.to(conversationRoom(conversationId)).emit("typing:update", {
          conversationId: Number(conversationId),
          userId: user.id,
          userName: user.name,
          isTyping: true,
        });
      }
    }));

    socket.on("typing:stop", safelyHandle(async ({ conversationId }) => {
      const membership = await isConversationParticipant(Number(conversationId), user.id);

      if (membership) {
        socket.to(conversationRoom(conversationId)).emit("typing:update", {
          conversationId: Number(conversationId),
          userId: user.id,
          userName: user.name,
          isTyping: false,
        });
      }
    }));

    socket.on("disconnect", safelyHandle(async () => {
      const stillOnline = presenceService.disconnect(user.id, socket.id);

      if (!stillOnline) {
        await updateUserLastSeen(user.id);
        io.emit("presence:update", {
          userId: user.id,
          isOnline: false,
          lastSeen: new Date().toISOString(),
        });
      }
    }));
  }));
}

module.exports = {
  setupSocket,
};
