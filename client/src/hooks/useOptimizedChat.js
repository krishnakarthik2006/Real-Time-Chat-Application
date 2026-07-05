import { useCallback, useRef, useState } from "react";
import { conversationApi } from "../utils/apiHelpers";

/**
 * Handles all REST conversation/message operations.
 * `onConversationUpdate` is stored in a ref so changing it never invalidates
 * the memoised callbacks — avoids unnecessary re-renders in the parent.
 */
export function useConversationOperations(token, onConversationUpdate) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const onUpdateRef = useRef(onConversationUpdate);

  // Keep the ref current without re-creating callbacks
  onUpdateRef.current = onConversationUpdate;

  const markAsRead = useCallback(async (conversationId) => {
    if (!conversationId || !token) return;
    try {
      await conversationApi.markAsRead(conversationId, token);
      onUpdateRef.current?.(conversationId, { unreadCount: 0 });
    } catch (err) {
      console.error("Failed to mark conversation as read:", err);
      setError(err.message);
    }
  }, [token]); // token is the only real dep now

  const sendMessage = useCallback(async (conversationId, payload) => {
    if (!conversationId || !token || !payload) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await conversationApi.sendMessage(conversationId, payload, token);
      return data.message;
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.message);
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
    } catch (err) {
      console.error("Failed to edit message:", err);
      setError(err.message);
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
    } catch (err) {
      console.error("Failed to delete message:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    markAsRead,
    sendMessage,
    editMessage,
    deleteMessage,
    loading,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}

/**
 * Persists a value to localStorage and keeps React state in sync.
 * Uses a functional updater inside setStoredValue so `key` is the only
 * stable dependency — no stale-closure issues.
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((current) => {
        const next = value instanceof Function ? value(current) : value;
        window.localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error(`localStorage write failed for "${key}":`, err);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      console.error(`localStorage remove failed for "${key}":`, err);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
