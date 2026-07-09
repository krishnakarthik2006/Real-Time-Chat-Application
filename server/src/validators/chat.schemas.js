const { z } = require("zod");

const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id.");

const directConversationSchema = z.object({
  recipientId: objectIdSchema,
});

const groupConversationSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters.").max(120),
  participantIds: z
    .array(objectIdSchema)
    .min(1, "Select at least one person for the group."),
});

const messageQuerySchema = z.object({
  cursor: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const searchUsersQuerySchema = z.object({
  q: z.string().trim().max(50).optional().default(""),
});

const searchMessagesQuerySchema = z.object({
  q: z.string().trim().min(1, "Enter something to search for.").max(80),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const messageSchema = z
  .object({
    content: z.string().trim().max(4000).optional().default(""),
    messageType: z.enum(["text", "file", "audio", "poll", "event", "gif", "sticker"]).optional().default("text"),
    replyToMessageId: objectIdSchema.optional(),
    fileName: z.string().trim().max(255).nullish(),
    fileUrl: z.string().trim().max(500).nullish(),
    fileSize: z.coerce.number().int().positive().nullish(),
    mimeType: z.string().trim().max(120).nullish(),
    // Poll
    poll: z.object({
      question: z.string().trim().min(1).max(300),
      options: z.array(z.object({ text: z.string().trim().min(1).max(120) })).min(2).max(10),
      allowMultiple: z.boolean().optional().default(false),
    }).optional(),
    // Event
    event: z.object({
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().max(500).optional().default(""),
      eventType: z.enum(["birthday", "meeting", "reminder", "other"]).optional().default("other"),
      startsAt: z.string().datetime({ offset: true }).optional(),
    }).optional(),
    // GIF
    gifUrl:   z.string().trim().max(500).nullish(),
    gifTitle: z.string().trim().max(120).nullish(),
    // Sticker
    stickerUrl: z.string().trim().max(500).nullish(),
    // Link preview
    linkPreview: z.object({
      url:         z.string().trim().max(500),
      title:       z.string().trim().max(200).optional(),
      description: z.string().trim().max(400).optional(),
      image:       z.string().trim().max(500).optional(),
      siteName:    z.string().trim().max(80).optional(),
    }).optional(),
  })
  .superRefine((value, context) => {
    const hasContent = value.content;
    const hasFile    = value.fileUrl;
    const hasPoll    = value.poll;
    const hasEvent   = value.event;
    const hasGif     = value.gifUrl;
    const hasSticker = value.stickerUrl;

    if (!hasContent && !hasFile && !hasPoll && !hasEvent && !hasGif && !hasSticker) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Message content or a file is required." });
    }

    if (value.messageType === "file" && !value.fileUrl) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "File messages must include an uploaded file URL." });
    }
    if (value.messageType === "poll" && !value.poll) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Poll messages must include poll data." });
    }
    if (value.messageType === "event" && !value.event) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Event messages must include event data." });
    }
  });

const pollVoteSchema = z.object({
  optionIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
});

const pinMessageSchema = z.object({
  messageId: objectIdSchema,
});

const nicknameSchema = z.object({
  userId: objectIdSchema,
  nickname: z.string().trim().max(50),
});

const announcementSchema = z.object({
  isAnnouncement: z.boolean(),
});

const editMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Edited messages cannot be empty.")
    .max(2000, "Message must be at most 2000 characters."),
});

const renameGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters.").max(120),
});

const addGroupParticipantsSchema = z.object({
  participantIds: z
    .array(objectIdSchema)
    .min(1, "Choose at least one person to add."),
});

const updateGroupRoleSchema = z.object({
  role: z.enum(["member", "admin"]),
});

const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(12),
});

module.exports = {
  directConversationSchema,
  groupConversationSchema,
  messageQuerySchema,
  searchMessagesQuerySchema,
  searchUsersQuerySchema,
  messageSchema,
  editMessageSchema,
  renameGroupSchema,
  addGroupParticipantsSchema,
  updateGroupRoleSchema,
  reactionSchema,
  pollVoteSchema,
  pinMessageSchema,
  nicknameSchema,
  announcementSchema,
};
