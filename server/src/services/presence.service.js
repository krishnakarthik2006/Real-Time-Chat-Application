class PresenceService {
  constructor() {
    this.userSockets = new Map();
  }

  connect(userId, socketId) {
    const key = String(userId);
    const sockets = this.userSockets.get(key) || new Set();
    sockets.add(socketId);
    this.userSockets.set(key, sockets);
  }

  disconnect(userId, socketId) {
    const key = String(userId);
    const sockets = this.userSockets.get(key);

    if (!sockets) {
      return false;
    }

    sockets.delete(socketId);

    if (!sockets.size) {
      this.userSockets.delete(key);
      return false;
    }

    this.userSockets.set(key, sockets);
    return true;
  }

  isOnline(userId) {
    return this.userSockets.has(String(userId));
  }

  getOnlineUserIds() {
    return Array.from(this.userSockets.keys()).map(Number);
  }
}

function userRoom(userId) {
  return `user:${userId}`;
}

function conversationRoom(conversationId) {
  return `conversation:${conversationId}`;
}

module.exports = {
  presenceService: new PresenceService(),
  userRoom,
  conversationRoom,
};
