const { query, withTransaction } = require("../config/db");
const { sanitizeUser } = require("../utils/auth");
const AppError = require("../utils/app-error");
const { presenceService } = require("./presence.service");

const messageSelectClause = `
  SELECT
    m.id,
    m.conversation_id AS conversationId,
    m.content,
    m.message_type AS messageType,
    m.file_name AS fileName,
    m.file_url AS fileUrl,
    m.file_size AS fileSize,
    m.mime_type AS mimeType,
    m.status,
    m.reply_to_message_id AS replyToMessageId,
    m.is_deleted AS isDeleted,
    m.deleted_at AS deletedAt,
    m.edited_at AS editedAt,
    m.created_at AS createdAt,
    sender.id AS senderId,
    sender.name AS senderName,
    sender.email AS senderEmail,
    sender.avatar_seed AS senderAvatarSeed,
    replyMessage.id AS replyId,
    replyMessage.content AS replyContent,
    replyMessage.message_type AS replyMessageType,
    replyMessage.file_name AS replyFileName,
    replyMessage.file_url AS replyFileUrl,
    replyMessage.file_size AS replyFileSize,
    replyMessage.mime_type AS replyMimeType,
    replyMessage.is_deleted AS replyIsDeleted,
    replySender.id AS replySenderId,
    replySender.name AS replySenderName,
    replySender.email AS replySenderEmail,
    replySender.avatar_seed AS replySenderAvatarSeed
`;

const messageJoinClause = `
  FROM messages m
  JOIN users sender ON sender.id = m.sender_id
  LEFT JOIN messages replyMessage ON replyMessage.id = m.reply_to_message_id
  LEFT JOIN users replySender ON replySender.id = replyMessage.sender_id
`;

function mapAttachment(row, prefix = "") {
  const fileUrl = row[`${prefix}fileUrl`];

  if (!fileUrl) {
    return null;
  }

  return {
    name: row[`${prefix}fileName`],
    url: fileUrl,
    size: row[`${prefix}fileSize`],
    mimeType: row[`${prefix}mimeType`],
  };
}

function mapReplyRow(row) {
  if (!row.replyToMessageId) {
    return null;
  }

  const isDeleted = Boolean(row.replyIsDeleted);

  return {
    id: Number(row.replyId || row.replyToMessageId),
    content: isDeleted ? "" : row.replyContent || "",
    messageType: row.replyMessageType || "text",
    isDeleted,
    attachment: isDeleted ? null : mapAttachment(row, "reply"),
    sender: row.replySenderId
      ? {
          id: row.replySenderId,
          name: row.replySenderName,
          email: row.replySenderEmail,
          avatarSeed: row.replySenderAvatarSeed,
        }
      : null,
  };
}

function mapMessageRow(row) {
  const isDeleted = Boolean(row.isDeleted);

  return {
    id: Number(row.id),
    conversationId: row.conversationId,
    sender: {
      id: row.senderId,
      name: row.senderName,
      email: row.senderEmail,
      avatarSeed: row.senderAvatarSeed,
    },
    content: isDeleted ? "" : row.content || "",
    messageType: row.messageType,
    attachment: isDeleted ? null : mapAttachment(row),
    status: row.status,
    replyTo: mapReplyRow(row),
    isDeleted,
    deletedAt: row.deletedAt,
    editedAt: row.editedAt,
    createdAt: row.createdAt,
  };
}

function mapConversationRows(conversationRows, participantRows, unreadRows) {
  const unreadByConversation = new Map();
  const participantsByConversation = new Map();

  for (const row of unreadRows) {
    unreadByConversation.set(row.conversationId, Number(row.unreadCount));
  }

  for (const row of participantRows) {
    const current = participantsByConversation.get(row.conversationId) || [];

    current.push({
      id: row.id,
      name: row.name,
      email: row.email,
      avatarSeed: row.avatarSeed,
      role: row.role,
      lastSeen: row.lastSeen,
      lastReadMessageId: row.lastReadMessageId ? Number(row.lastReadMessageId) : null,
    });

    participantsByConversation.set(row.conversationId, current);
  }

  return conversationRows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    unreadCount: unreadByConversation.get(row.id) || 0,
    participants: participantsByConversation.get(row.id) || [],
    lastMessage: row.lastMessageId
      ? {
          id: Number(row.lastMessageId),
          content: row.lastMessageIsDeleted ? "" : row.lastMessageContent || "",
          messageType: row.lastMessageType,
          status: row.lastMessageStatus,
          createdAt: row.lastMessageAt,
          editedAt: row.lastMessageEditedAt,
          isDeleted: Boolean(row.lastMessageIsDeleted),
          attachment: row.lastMessageIsDeleted
            ? null
            : row.lastMessageFileUrl
              ? {
                  name: row.lastMessageFileName,
                  url: row.lastMessageFileUrl,
                  size: row.lastMessageFileSize,
                  mimeType: row.lastMessageMimeType,
                }
              : null,
          sender: {
            id: row.lastMessageSenderId,
            name: row.lastMessageSenderName,
            email: row.lastMessageSenderEmail,
            avatarSeed: row.lastMessageSenderAvatarSeed,
          },
        }
      : null,
  }));
}

async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] || null;
}

async function findUserById(userId) {
  const rows = await query("SELECT * FROM users WHERE id = ? LIMIT 1", [userId]);
  return rows[0] || null;
}

async function createUser({ name, email, passwordHash, avatarSeed }) {
  const result = await query(
    `
      INSERT INTO users (name, email, password_hash, avatar_seed)
      VALUES (?, ?, ?, ?)
    `,
    [name, email, passwordHash, avatarSeed],
  );

  return findUserById(result.insertId);
}

async function searchUsers(currentUserId, search) {
  const likeValue = `%${search}%`;
  const rows = await query(
    `
      SELECT id, name, email, avatar_seed, last_seen, created_at
      FROM users
      WHERE id <> ?
        AND (
          ? = ''
          OR name LIKE ?
          OR email LIKE ?
        )
      ORDER BY name ASC
      LIMIT 20
    `,
    [currentUserId, search, likeValue, likeValue],
  );

  return rows.map(sanitizeUser);
}

async function getConversationMembership(conversationId, userId) {
  const rows = await query(
    `
      SELECT
        c.id,
        c.name,
        c.type,
        c.created_by AS createdBy,
        cp.role
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.id = ? AND cp.user_id = ?
      LIMIT 1
    `,
    [conversationId, userId],
  );

  return rows[0] || null;
}

async function isConversationParticipant(conversationId, userId) {
  return getConversationMembership(conversationId, userId);
}

async function requireConversationMembership(conversationId, userId) {
  const membership = await getConversationMembership(conversationId, userId);

  if (!membership) {
    throw new AppError("Conversation not found.", 404);
  }

  return membership;
}

async function requireGroupAdmin(conversationId, userId) {
  const membership = await requireConversationMembership(conversationId, userId);

  if (membership.type !== "group") {
    throw new AppError("This action is only available for group conversations.", 400);
  }

  if (membership.role !== "admin") {
    throw new AppError("Only group admins can perform this action.", 403);
  }

  return membership;
}

async function getConversationParticipantIds(conversationId) {
  const rows = await query(
    "SELECT user_id AS userId FROM conversation_participants WHERE conversation_id = ?",
    [conversationId],
  );

  return rows.map((row) => row.userId);
}

async function getConversationParticipants(conversationIds) {
  if (!conversationIds.length) {
    return [];
  }

  const placeholders = conversationIds.map(() => "?").join(", ");

  return query(
    `
      SELECT
        cp.conversation_id AS conversationId,
        cp.role,
        cp.last_read_message_id AS lastReadMessageId,
        u.id,
        u.name,
        u.email,
        u.avatar_seed AS avatarSeed,
        u.last_seen AS lastSeen
      FROM conversation_participants cp
      JOIN users u ON u.id = cp.user_id
      WHERE cp.conversation_id IN (${placeholders})
      ORDER BY u.name ASC
    `,
    conversationIds,
  );
}

async function getUnreadCounts(userId, conversationIds) {
  if (!conversationIds.length) {
    return [];
  }

  const placeholders = conversationIds.map(() => "?").join(", ");

  return query(
    `
      SELECT
        cp.conversation_id AS conversationId,
        COUNT(m.id) AS unreadCount
      FROM conversation_participants cp
      JOIN messages m ON m.conversation_id = cp.conversation_id
      WHERE cp.user_id = ?
        AND cp.conversation_id IN (${placeholders})
        AND m.sender_id <> ?
        AND (
          cp.last_read_message_id IS NULL
          OR m.id > cp.last_read_message_id
        )
      GROUP BY cp.conversation_id
    `,
    [userId, ...conversationIds, userId],
  );
}

async function getConversationRowsForUser(userId, conversationIds = null) {
  if (Array.isArray(conversationIds) && !conversationIds.length) {
    return [];
  }

  const filterClause = Array.isArray(conversationIds)
    ? `AND c.id IN (${conversationIds.map(() => "?").join(", ")})`
    : "";

  const params = Array.isArray(conversationIds)
    ? [userId, ...conversationIds]
    : [userId];

  return query(
    `
      SELECT
        c.id,
        c.name,
        c.type,
        c.created_by AS createdBy,
        c.created_at AS createdAt,
        c.updated_at AS updatedAt,
        m.id AS lastMessageId,
        m.content AS lastMessageContent,
        m.message_type AS lastMessageType,
        m.file_name AS lastMessageFileName,
        m.file_url AS lastMessageFileUrl,
        m.file_size AS lastMessageFileSize,
        m.mime_type AS lastMessageMimeType,
        m.status AS lastMessageStatus,
        m.is_deleted AS lastMessageIsDeleted,
        m.edited_at AS lastMessageEditedAt,
        m.created_at AS lastMessageAt,
        sender.id AS lastMessageSenderId,
        sender.name AS lastMessageSenderName,
        sender.email AS lastMessageSenderEmail,
        sender.avatar_seed AS lastMessageSenderAvatarSeed
      FROM conversations c
      JOIN conversation_participants cp
        ON cp.conversation_id = c.id AND cp.user_id = ?
      ${filterClause}
      LEFT JOIN messages m
        ON m.id = (
          SELECT m2.id
          FROM messages m2
          WHERE m2.conversation_id = c.id
          ORDER BY m2.id DESC
          LIMIT 1
        )
      LEFT JOIN users sender ON sender.id = m.sender_id
      ORDER BY COALESCE(m.created_at, c.updated_at) DESC
    `,
    params,
  );
}

async function mapConversationsForUser(userId, conversationRows) {
  if (!conversationRows.length) {
    return [];
  }

  const conversationIds = conversationRows.map((row) => row.id);
  const [participantRows, unreadRows] = await Promise.all([
    getConversationParticipants(conversationIds),
    getUnreadCounts(userId, conversationIds),
  ]);

  return mapConversationRows(conversationRows, participantRows, unreadRows);
}

async function getConversationsForUser(userId) {
  const conversationRows = await getConversationRowsForUser(userId);
  return mapConversationsForUser(userId, conversationRows);
}

async function getConversationForUser(conversationId, userId) {
  const conversationRows = await getConversationRowsForUser(userId, [Number(conversationId)]);
  const conversations = await mapConversationsForUser(userId, conversationRows);
  return conversations[0] || null;
}

async function createOrGetDirectConversation(currentUserId, recipientId) {
  if (currentUserId === recipientId) {
    throw new AppError("You cannot start a direct conversation with yourself.", 400);
  }

  const recipient = await findUserById(recipientId);

  if (!recipient) {
    throw new AppError("Recipient not found.", 404);
  }

  const conversationId = await withTransaction(async (connection) => {
    const [existingRows] = await connection.execute(
      `
        SELECT c.id
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id
        WHERE c.type = 'direct'
          AND cp.user_id IN (?, ?)
        GROUP BY c.id
        HAVING COUNT(DISTINCT cp.user_id) = 2
          AND COUNT(*) = 2
        LIMIT 1
      `,
      [currentUserId, recipientId],
    );

    if (existingRows[0]) {
      return existingRows[0].id;
    }

    const [conversationResult] = await connection.execute(
      `
        INSERT INTO conversations (name, type, created_by)
        VALUES (NULL, 'direct', ?)
      `,
      [currentUserId],
    );

    const newConversationId = conversationResult.insertId;

    await connection.query(
      `
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES
          (?, ?, 'admin'),
          (?, ?, 'member')
      `,
      [newConversationId, currentUserId, newConversationId, recipientId],
    );

    return newConversationId;
  });

  return getConversationForUser(conversationId, currentUserId);
}

async function createGroupConversation(currentUserId, name, participantIds) {
  const uniqueParticipantIds = Array.from(
    new Set([currentUserId, ...participantIds.map(Number)].filter(Boolean)),
  );

  const existingUsers = await query(
    `
      SELECT id
      FROM users
      WHERE id IN (${uniqueParticipantIds.map(() => "?").join(", ")})
    `,
    uniqueParticipantIds,
  );

  if (existingUsers.length !== uniqueParticipantIds.length) {
    throw new AppError("One or more selected participants do not exist.", 404);
  }

  const conversationId = await withTransaction(async (connection) => {
    const [conversationResult] = await connection.execute(
      `
        INSERT INTO conversations (name, type, created_by)
        VALUES (?, 'group', ?)
      `,
      [name, currentUserId],
    );

    const newConversationId = conversationResult.insertId;
    const valuePlaceholders = uniqueParticipantIds.map(() => "(?, ?, ?)").join(", ");
    const params = uniqueParticipantIds.flatMap((participantId) => [
      newConversationId,
      participantId,
      participantId === currentUserId ? "admin" : "member",
    ]);

    await connection.query(
      `
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES ${valuePlaceholders}
      `,
      params,
    );

    return newConversationId;
  });

  return getConversationForUser(conversationId, currentUserId);
}

async function renameGroupConversation(currentUserId, conversationId, name) {
  await requireGroupAdmin(conversationId, currentUserId);

  await query(
    `
      UPDATE conversations
      SET name = ?, updated_at = NOW()
      WHERE id = ?
    `,
    [name, conversationId],
  );

  return getConversationForUser(conversationId, currentUserId);
}

async function addGroupParticipants(currentUserId, conversationId, participantIds) {
  await requireGroupAdmin(conversationId, currentUserId);

  const uniqueParticipantIds = Array.from(
    new Set(participantIds.map(Number).filter(Boolean)),
  );

  const existingUsers = await query(
    `
      SELECT id
      FROM users
      WHERE id IN (${uniqueParticipantIds.map(() => "?").join(", ")})
    `,
    uniqueParticipantIds,
  );

  if (existingUsers.length !== uniqueParticipantIds.length) {
    throw new AppError("One or more selected teammates do not exist.", 404);
  }

  const currentParticipants = await getConversationParticipantIds(conversationId);
  const newParticipantIds = uniqueParticipantIds.filter(
    (participantId) => !currentParticipants.includes(participantId),
  );

  if (newParticipantIds.length) {
    const placeholders = newParticipantIds.map(() => "(?, ?, 'member')").join(", ");
    const params = newParticipantIds.flatMap((participantId) => [conversationId, participantId]);

    await query(
      `
        INSERT INTO conversation_participants (conversation_id, user_id, role)
        VALUES ${placeholders}
      `,
      params,
    );
  }

  await query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [conversationId]);

  return getConversationForUser(conversationId, currentUserId);
}

async function updateGroupParticipantRole(currentUserId, conversationId, participantId, role) {
  await requireGroupAdmin(conversationId, currentUserId);

  const participantRows = await query(
    `
      SELECT role
      FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
      LIMIT 1
    `,
    [conversationId, participantId],
  );

  const participant = participantRows[0];

  if (!participant) {
    throw new AppError("Group member not found.", 404);
  }

  if (participant.role === role) {
    return getConversationForUser(conversationId, currentUserId);
  }

  if (participant.role === "admin" && role === "member") {
    const adminRows = await query(
      `
        SELECT COUNT(*) AS adminCount
        FROM conversation_participants
        WHERE conversation_id = ? AND role = 'admin'
      `,
      [conversationId],
    );

    if (Number(adminRows[0].adminCount) <= 1) {
      throw new AppError("A group must always have at least one admin.", 400);
    }
  }

  await query(
    `
      UPDATE conversation_participants
      SET role = ?
      WHERE conversation_id = ? AND user_id = ?
    `,
    [role, conversationId, participantId],
  );

  await query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [conversationId]);

  return getConversationForUser(conversationId, currentUserId);
}

async function removeGroupParticipant(currentUserId, conversationId, participantId) {
  await requireGroupAdmin(conversationId, currentUserId);

  if (Number(participantId) === Number(currentUserId)) {
    throw new AppError("Self-removal is not supported from admin controls.", 400);
  }

  const participantRows = await query(
    `
      SELECT role
      FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
      LIMIT 1
    `,
    [conversationId, participantId],
  );

  const participant = participantRows[0];

  if (!participant) {
    throw new AppError("Group member not found.", 404);
  }

  if (participant.role === "admin") {
    const adminRows = await query(
      `
        SELECT COUNT(*) AS adminCount
        FROM conversation_participants
        WHERE conversation_id = ? AND role = 'admin'
      `,
      [conversationId],
    );

    if (Number(adminRows[0].adminCount) <= 1) {
      throw new AppError("You cannot remove the last admin from a group.", 400);
    }
  }

  await query(
    `
      DELETE FROM conversation_participants
      WHERE conversation_id = ? AND user_id = ?
    `,
    [conversationId, participantId],
  );

  await query("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [conversationId]);

  return {
    conversation: await getConversationForUser(conversationId, currentUserId),
    removedUserId: Number(participantId),
  };
}

async function getMessagesForConversation(userId, conversationId, { cursor, limit }) {
  await requireConversationMembership(conversationId, userId);

  const rows = await query(
    `
      ${messageSelectClause}
      ${messageJoinClause}
      WHERE m.conversation_id = ?
        AND (? IS NULL OR m.id < ?)
      ORDER BY m.id DESC
      LIMIT ?
    `,
    [conversationId, cursor || null, cursor || null, limit],
  );

  return rows.reverse().map(mapMessageRow);
}

async function getMessageById(messageId) {
  const rows = await query(
    `
      ${messageSelectClause}
      ${messageJoinClause}
      WHERE m.id = ?
      LIMIT 1
    `,
    [messageId],
  );

  return rows[0] ? mapMessageRow(rows[0]) : null;
}

async function searchMessagesInConversation(userId, conversationId, search, limit) {
  await requireConversationMembership(conversationId, userId);

  const likeValue = `%${search}%`;
  const rows = await query(
    `
      ${messageSelectClause}
      ${messageJoinClause}
      WHERE m.conversation_id = ?
        AND m.is_deleted = 0
        AND (
          m.content LIKE ?
          OR COALESCE(m.file_name, '') LIKE ?
        )
      ORDER BY m.id DESC
      LIMIT ?
    `,
    [conversationId, likeValue, likeValue, limit],
  );

  return rows.map(mapMessageRow);
}

async function createMessage(userId, conversationId, payload) {
  await requireConversationMembership(conversationId, userId);

  if (payload.replyToMessageId) {
    const replyTargetRows = await query(
      `
        SELECT id
        FROM messages
        WHERE id = ? AND conversation_id = ?
        LIMIT 1
      `,
      [payload.replyToMessageId, conversationId],
    );

    if (!replyTargetRows[0]) {
      throw new AppError("The message you are replying to no longer exists.", 404);
    }
  }

  const participantIds = await getConversationParticipantIds(conversationId);
  const recipientIds = participantIds.filter((participantId) => participantId !== userId);
  const initialStatus =
    recipientIds.length && recipientIds.every((participantId) => presenceService.isOnline(participantId))
      ? "delivered"
      : "sent";

  const messageId = await withTransaction(async (connection) => {
    const [messageResult] = await connection.execute(
      `
        INSERT INTO messages (
          conversation_id,
          sender_id,
          content,
          message_type,
          file_name,
          file_url,
          file_size,
          mime_type,
          status,
          reply_to_message_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        conversationId,
        userId,
        payload.content || null,
        payload.messageType,
        payload.fileName || null,
        payload.fileUrl || null,
        payload.fileSize || null,
        payload.mimeType || null,
        initialStatus,
        payload.replyToMessageId || null,
      ],
    );

    await connection.execute("UPDATE conversations SET updated_at = NOW() WHERE id = ?", [conversationId]);

    return messageResult.insertId;
  });

  const message = await getMessageById(messageId);

  return {
    message,
    participantIds,
  };
}

async function updateMessage(userId, conversationId, messageId, content) {
  await requireConversationMembership(conversationId, userId);

  const rows = await query(
    `
      SELECT sender_id AS senderId, is_deleted AS isDeleted
      FROM messages
      WHERE id = ? AND conversation_id = ?
      LIMIT 1
    `,
    [messageId, conversationId],
  );

  const messageRow = rows[0];

  if (!messageRow) {
    throw new AppError("Message not found.", 404);
  }

  if (Number(messageRow.senderId) !== Number(userId)) {
    throw new AppError("You can only edit your own messages.", 403);
  }

  if (messageRow.isDeleted) {
    throw new AppError("Deleted messages cannot be edited.", 400);
  }

  await query(
    `
      UPDATE messages
      SET content = ?, edited_at = NOW()
      WHERE id = ?
    `,
    [content, messageId],
  );

  return {
    message: await getMessageById(messageId),
    participantIds: await getConversationParticipantIds(conversationId),
  };
}

async function deleteMessage(userId, conversationId, messageId) {
  await requireConversationMembership(conversationId, userId);

  const rows = await query(
    `
      SELECT sender_id AS senderId, is_deleted AS isDeleted
      FROM messages
      WHERE id = ? AND conversation_id = ?
      LIMIT 1
    `,
    [messageId, conversationId],
  );

  const messageRow = rows[0];

  if (!messageRow) {
    throw new AppError("Message not found.", 404);
  }

  if (Number(messageRow.senderId) !== Number(userId)) {
    throw new AppError("You can only delete your own messages.", 403);
  }

  if (messageRow.isDeleted) {
    throw new AppError("Message has already been deleted.", 400);
  }

  await query(
    `
      UPDATE messages
      SET
        content = NULL,
        file_name = NULL,
        file_url = NULL,
        file_size = NULL,
        mime_type = NULL,
        is_deleted = 1,
        deleted_at = NOW(),
        edited_at = NULL
      WHERE id = ?
    `,
    [messageId],
  );

  return {
    message: await getMessageById(messageId),
    participantIds: await getConversationParticipantIds(conversationId),
  };
}

async function markConversationAsRead(userId, conversationId) {
  await requireConversationMembership(conversationId, userId);

  const participantIds = await getConversationParticipantIds(conversationId);

  return withTransaction(async (connection) => {
    const [latestRows] = await connection.execute(
      `
        SELECT MAX(id) AS latestMessageId
        FROM messages
        WHERE conversation_id = ?
          AND sender_id <> ?
      `,
      [conversationId, userId],
    );

    const latestMessageId = latestRows[0]?.latestMessageId ? Number(latestRows[0].latestMessageId) : null;

    if (latestMessageId) {
      await connection.execute(
        `
          UPDATE conversation_participants
          SET last_read_message_id = CASE
            WHEN last_read_message_id IS NULL OR last_read_message_id < ?
              THEN ?
            ELSE last_read_message_id
          END
          WHERE conversation_id = ?
            AND user_id = ?
        `,
        [latestMessageId, latestMessageId, conversationId, userId],
      );
    }

    const [seenRows] = await connection.execute(
      `
        SELECT m.id
        FROM messages m
        JOIN conversation_participants cp
          ON cp.conversation_id = m.conversation_id
        WHERE m.conversation_id = ?
          AND m.status <> 'seen'
        GROUP BY m.id, m.sender_id
        HAVING SUM(
          CASE
            WHEN cp.user_id <> m.sender_id
              AND COALESCE(cp.last_read_message_id, 0) >= m.id
            THEN 1
            ELSE 0
          END
        ) = SUM(
          CASE
            WHEN cp.user_id <> m.sender_id
            THEN 1
            ELSE 0
          END
        )
      `,
      [conversationId],
    );

    const seenMessageIds = seenRows.map((row) => Number(row.id));

    if (seenMessageIds.length) {
      await connection.query(
        `
          UPDATE messages
          SET status = 'seen'
          WHERE id IN (${seenMessageIds.map(() => "?").join(", ")})
        `,
        seenMessageIds,
      );
    }

    return {
      participantIds,
      seenMessageIds,
    };
  });
}

async function markPendingDirectMessagesDelivered(userId) {
  const rows = await query(
    `
      SELECT
        m.id,
        m.sender_id AS senderId,
        m.conversation_id AS conversationId
      FROM messages m
      JOIN conversations c
        ON c.id = m.conversation_id
        AND c.type = 'direct'
      JOIN conversation_participants cp
        ON cp.conversation_id = c.id
        AND cp.user_id = ?
      WHERE m.sender_id <> ?
        AND m.status = 'sent'
    `,
    [userId, userId],
  );

  if (!rows.length) {
    return [];
  }

  await query(
    `
      UPDATE messages
      SET status = 'delivered'
      WHERE id IN (${rows.map(() => "?").join(", ")})
    `,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: Number(row.id),
    senderId: row.senderId,
    conversationId: row.conversationId,
  }));
}

async function updateUserLastSeen(userId) {
  await query("UPDATE users SET last_seen = NOW() WHERE id = ?", [userId]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  searchUsers,
  getConversationsForUser,
  getConversationForUser,
  createOrGetDirectConversation,
  createGroupConversation,
  renameGroupConversation,
  addGroupParticipants,
  updateGroupParticipantRole,
  removeGroupParticipant,
  getMessagesForConversation,
  searchMessagesInConversation,
  createMessage,
  updateMessage,
  deleteMessage,
  markConversationAsRead,
  isConversationParticipant,
  markPendingDirectMessagesDelivered,
  updateUserLastSeen,
};
