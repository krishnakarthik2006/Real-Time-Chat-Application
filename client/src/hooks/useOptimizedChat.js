import { useCallback, useRef, useEffect, useState } from "react";
import { conversationApi } from "../utils/apiHelpers";

// Custom hook for conversation operations
export function useConversationOperations(token, onConversationUpdate) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markAsRead = useCallback(async (conversationId) => {
    if (!conversationId || !token) return;
    
    try {
      await conversationApi.markAsRead(conversationId, token);
      onConversationUpdate?.(conversationId, { unreadCount: 0 });
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
      setError(error.message);
    }
  }, [token, onConversationUpdate]);

  const sendMessage = useCallback(async (conversationId, payload) => {
    if (!conversationId || !token || !payload) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await conversationApi.sendMessage(conversationId, payload, token);
      return data.message;
    } catch (error) {
      console.error("Failed to send message:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const editMessage = useCallback(async (conversationId, messageId, content) => {
    if (!conversationId || !messageId || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await conversationApi.editMessage(conversationId, messageId, content, token);
      return data.message;
    } catch (error) {
      console.error("Failed to edit message:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteMessage = useCallback(async (conversationId, messageId) => {
    if (!conversationId || !messageId || !token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await conversationApi.deleteMessage(conversationId, messageId, token);
      return data.message;
    } catch (error) {
      console.error("Failed to delete message:", error);
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const searchMessages = useCallback(async (conversationId, query) => {
    if (!conversationId || !query || !token) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await conversationApi.searchMessages(conversationId, query, token);
      return data.messages;
    } catch (error) {
      console.error("Failed to search messages:", error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    markAsRead,
    sendMessage,
    editMessage,
    deleteMessage,
    searchMessages,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// Custom hook for typing indicators with debouncing
export function useTypingIndicator(socket, conversationId, userId) {
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!socket || !conversationId || isTypingRef.current) return;
    
    isTypingRef.current = true;
    socket.emit("typing:start", { conversationId });
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [socket, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socket || !conversationId || !isTypingRef.current) return;
    
    isTypingRef.current = false;
    socket.emit("typing:stop", { conversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, conversationId]);

  const handleTypingUpdate = useCallback(({ conversationId: cid, userId: uid, userName, isTyping }) => {
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
  }, [conversationId, userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    handleTypingUpdate,
  };
}

// Custom hook for message search with debouncing
export function useMessageSearch(searchQuery, conversationId, token, delay = 300) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchTimeoutRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query.trim() || !conversationId || !token) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messages = await conversationApi.searchMessages(conversationId, query, token);
      setResults(messages);
    } catch (error) {
      console.error("Search failed:", error);
      setError(error.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, token]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(searchQuery);
    }, delay);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, search, delay]);

  return {
    results,
    loading,
    error,
    clearResults: () => setResults([]),
  };
}

// Custom hook for local storage with sync
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
