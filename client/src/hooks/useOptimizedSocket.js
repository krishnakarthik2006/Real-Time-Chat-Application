import { useCallback, useEffect, useRef, useState } from "react";
import { useChatSocket } from "./useChatSocket";

// Optimized socket event manager with batching and debouncing
export function useOptimizedSocket(token) {
  const socket = useChatSocket(token);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventListenersRef = useRef(new Map());
  const batchedEventsRef = useRef(new Map());
  const batchTimeoutRef = useRef(null);

  // Connection status monitoring
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    const handleConnect = () => {
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    };

    const handleDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      setConnectionStatus('error');
      setReconnectAttempts(prev => prev + 1);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [socket]);

  // Optimized event listener with automatic cleanup
  const addEventListener = useCallback((event, handler, options = {}) => {
    if (!socket) return;

    const { once = false, batch = false, batchDelay = 100 } = options;
    
    const wrappedHandler = (...args) => {
      if (batch) {
        // Batch events to reduce re-renders
        const existingBatch = batchedEventsRef.current.get(event) || [];
        batchedEventsRef.current.set(event, [...existingBatch, args]);
        
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
        }
        
        batchTimeoutRef.current = setTimeout(() => {
          const batchedArgs = batchedEventsRef.current.get(event) || [];
          batchedEventsRef.current.delete(event);
          handler(batchedArgs);
        }, batchDelay);
      } else {
        handler(...args);
      }
      
      if (once) {
        removeEventListener(event, wrappedHandler);
      }
    };

    socket.on(event, wrappedHandler);
    
    // Store listener for cleanup
    const listeners = eventListenersRef.current.get(event) || [];
    eventListenersRef.current.set(event, [...listeners, wrappedHandler]);

    return wrappedHandler;
  }, [socket]);

  // Remove event listener
  const removeEventListener = useCallback((event, handler) => {
    if (!socket) return;
    
    socket.off(event, handler);
    
    const listeners = eventListenersRef.current.get(event) || [];
    const updatedListeners = listeners.filter(l => l !== handler);
    eventListenersRef.current.set(event, updatedListeners);
  }, [socket]);

  // Remove all listeners for an event
  const removeAllListeners = useCallback((event) => {
    if (!socket) return;
    
    const listeners = eventListenersRef.current.get(event) || [];
    listeners.forEach(listener => socket.off(event, listener));
    eventListenersRef.current.delete(event);
  }, [socket]);

  // Cleanup all listeners
  const cleanup = useCallback(() => {
    eventListenersRef.current.forEach((listeners, event) => {
      listeners.forEach(listener => socket?.off(event, listener));
    });
    eventListenersRef.current.clear();
    batchedEventsRef.current.clear();
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
  }, [socket]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    socket,
    connectionStatus,
    reconnectAttempts,
    addEventListener,
    removeEventListener,
    removeAllListeners,
    cleanup,
  };
}

// Hook for managing conversation-specific socket events
export function useConversationSocket(socket, conversationId, userId) {
  const [isJoined, setIsJoined] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const joinConversation = useCallback(() => {
    if (socket && conversationId && !isJoined) {
      socket.emit('conversation:join', { conversationId });
      setIsJoined(true);
    }
  }, [socket, conversationId, isJoined]);

  const leaveConversation = useCallback(() => {
    if (socket && conversationId && isJoined) {
      socket.emit('conversation:leave', { conversationId });
      setIsJoined(false);
      setTypingUsers([]);
    }
  }, [socket, conversationId, isJoined]);

  const startTyping = useCallback(() => {
    if (socket && conversationId && isJoined) {
      socket.emit('typing:start', { conversationId });
      
      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  }, [socket, conversationId, isJoined]);

  const stopTyping = useCallback(() => {
    if (socket && conversationId && isJoined) {
      socket.emit('typing:stop', { conversationId });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [socket, conversationId, isJoined]);

  // Handle typing updates
  useEffect(() => {
    if (!socket) return;

    const handleTypingUpdate = ({ conversationId: cid, userId: uid, userName, isTyping }) => {
      if (cid !== conversationId || uid === userId) return;
      
      setTypingUsers(prev => {
        if (isTyping) {
          if (!prev.some(user => user.userId === uid)) {
            return [...prev, { userId: uid, userName }];
          }
        } else {
          return prev.filter(user => user.userId !== uid);
        }
        return prev;
      });
    };

    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [socket, conversationId, userId]);

  // Auto-join when conversation changes
  useEffect(() => {
    if (conversationId) {
      joinConversation();
    }
    
    return () => {
      leaveConversation();
    };
  }, [conversationId, joinConversation, leaveConversation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isJoined,
    typingUsers,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
  };
}

// Hook for managing message reactions via socket
export function useMessageReactions(socket) {
  const [reactions, setReactions] = useState({});

  const addReaction = useCallback((messageId, emoji) => {
    if (socket) {
      socket.emit('message:reaction:add', { messageId, emoji });
    }
  }, [socket]);

  const removeReaction = useCallback((messageId, emoji) => {
    if (socket) {
      socket.emit('message:reaction:remove', { messageId, emoji });
    }
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleReactionUpdate = ({ messageId, reactions: messageReactions }) => {
      setReactions(prev => ({
        ...prev,
        [messageId]: messageReactions
      }));
    };

    socket.on('message:reaction:update', handleReactionUpdate);

    return () => {
      socket.off('message:reaction:update', handleReactionUpdate);
    };
  }, [socket]);

  return {
    reactions,
    addReaction,
    removeReaction,
  };
}

// Hook for managing online presence
export function usePresence(socket) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [presenceByUserId, setPresenceByUserId] = useState({});

  useEffect(() => {
    if (!socket) return;

    const handlePresenceSnapshot = ({ onlineUserIds }) => {
      setOnlineUsers(onlineUserIds);
      setPresenceByUserId(prev => {
        const next = { ...prev };
        
        // Reset all to offline
        Object.keys(next).forEach(userId => {
          next[userId] = { ...next[userId], isOnline: false };
        });
        
        // Set online users
        onlineUserIds.forEach(userId => {
          next[userId] = { ...next[userId], isOnline: true };
        });
        
        return next;
      });
    };

    const handlePresenceUpdate = ({ userId, isOnline, lastSeen }) => {
      setPresenceByUserId(prev => ({
        ...prev,
        [userId]: {
          isOnline,
          lastSeen: lastSeen ?? prev[userId]?.lastSeen ?? null,
        }
      }));
    };

    socket.on('presence:snapshot', handlePresenceSnapshot);
    socket.on('presence:update', handlePresenceUpdate);

    return () => {
      socket.off('presence:snapshot', handlePresenceSnapshot);
      socket.off('presence:update', handlePresenceUpdate);
    };
  }, [socket]);

  return {
    onlineUsers,
    presenceByUserId,
  };
}
