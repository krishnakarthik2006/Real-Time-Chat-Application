import { request } from "../api/client";

// Generic API request wrapper with error handling
export async function apiRequest(endpoint, options = {}) {
  const { method = "GET", token, body, isFormData = false, signal } = options;
  
  try {
    return await request(endpoint, {
      method,
      token,
      body,
      isFormData,
      signal,
    });
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

export const uploadApi = {
  async uploadFile(file, token) {
    const formData = new FormData();
    formData.append("file", file);

    const data = await apiRequest("/uploads", {
      method: "POST",
      token,
      body: formData,
      isFormData: true,
    });

    return data.file;
  },
};

// Specialized API functions for common patterns
export const conversationApi = {
  // Mark conversation as read
  async markAsRead(conversationId, token) {
    return apiRequest(`/conversations/${conversationId}/read`, {
      method: "POST",
      token,
    });
  },

  // Send message
  async sendMessage(conversationId, payload, token) {
    let nextPayload = { ...payload };

    if (typeof File !== "undefined" && payload?.file instanceof File) {
      const uploadedFile = await uploadApi.uploadFile(payload.file, token);

      nextPayload = {
        ...nextPayload,
        messageType: "file",
        fileName: uploadedFile.fileName,
        fileUrl: uploadedFile.fileUrl,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
      };

      delete nextPayload.file;
    }

    if (!nextPayload.messageType) {
      nextPayload.messageType = nextPayload.fileUrl ? "file" : "text";
    }

    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: "POST",
      token,
      body: nextPayload,
    });
  },

  // Edit message
  async editMessage(conversationId, messageId, content, token) {
    return apiRequest(`/conversations/${conversationId}/messages/${messageId}`, {
      method: "PATCH",
      token,
      body: { content },
    });
  },

  // Delete message
  async deleteMessage(conversationId, messageId, token) {
    return apiRequest(`/conversations/${conversationId}/messages/${messageId}`, {
      method: "DELETE",
      token,
    });
  },

  // Search messages
  async searchMessages(conversationId, query, token) {
    return apiRequest(`/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}&limit=20`, {
      token,
    });
  },

  // Create direct conversation
  async createDirect(recipientId, token) {
    return apiRequest("/conversations/direct", {
      method: "POST",
      token,
      body: { recipientId },
    });
  },

  // Create group conversation
  async createGroup(name, participantIds, token) {
    return apiRequest("/conversations/group", {
      method: "POST",
      token,
      body: { name, participantIds },
    });
  },

  // Rename group
  async renameGroup(conversationId, name, token) {
    return apiRequest(`/conversations/${conversationId}/group`, {
      method: "PATCH",
      token,
      body: { name },
    });
  },

  // Add group participants
  async addParticipants(conversationId, participantIds, token) {
    return apiRequest(`/conversations/${conversationId}/group/participants`, {
      method: "POST",
      token,
      body: { participantIds },
    });
  },

  // Update participant role
  async updateParticipantRole(conversationId, participantId, role, token) {
    return apiRequest(`/conversations/${conversationId}/group/participants/${participantId}`, {
      method: "PATCH",
      token,
      body: { role },
    });
  },

  // Remove participant
  async removeParticipant(conversationId, participantId, token) {
    return apiRequest(`/conversations/${conversationId}/group/participants/${participantId}`, {
      method: "DELETE",
      token,
    });
  },

  // Add reaction to a message
  async addReaction(conversationId, messageId, emoji, token) {
    return apiRequest(`/conversations/${conversationId}/messages/${messageId}/reactions`, {
      method: "POST",
      token,
      body: { emoji },
    });
  },

  // Remove reaction from a message
  async removeReaction(conversationId, messageId, emoji, token) {
    return apiRequest(
      `/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
      { method: "DELETE", token },
    );
  },
};

// User API functions
export const userApi = {
  // Search users
  async searchUsers(query, token) {
    return apiRequest(`/users?q=${encodeURIComponent(query)}&limit=20`, {
      token,
    });
  },
};
