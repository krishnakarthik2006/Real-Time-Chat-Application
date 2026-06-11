const { z } = require("zod");

const directConversationSchema = z.object({
  recipientId: z.coerce.number().int().positive("Recipient id is required."),
});

const groupConversationSchema = z.object({
  name: z.string().trim().min(2, "Group name must be at least 2 characters.").max(120),
  participantIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Select at least one teammate for the group."),
});

const messageQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
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
    content: z.string().trim().max(2000).optional().default(""),
    messageType: z.enum(["text", "file"]).optional().default("text"),
    replyToMessageId: z.coerce.number().int().positive().optional(),
    fileName: z.string().trim().max(255).nullish(),
    fileUrl: z.string().trim().max(500).nullish(),
    fileSize: z.coerce.number().int().positive().nullish(),
    mimeType: z.string().trim().max(120).nullish(),
  })
  .superRefine((value, context) => {
    if (!value.content && !value.fileUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Message content or a file is required.",
      });
    }

    if (value.messageType === "file" && !value.fileUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File messages must include an uploaded file URL.",
      });
    }
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
    .array(z.coerce.number().int().positive())
    .min(1, "Choose at least one teammate to add."),
});

const updateGroupRoleSchema = z.object({
  role: z.enum(["member", "admin"]),
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
};
