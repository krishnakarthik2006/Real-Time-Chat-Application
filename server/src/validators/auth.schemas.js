const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  email: z.string().trim().email("Enter a valid email address."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(64, "Password must be at most 64 characters."),
  confirmPassword: z.string().optional(), // validated client-side; ignored server-side
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  avatarSeed: z.string().trim().max(80).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters.")
      .max(64, "New password must be at most 64 characters."),
    confirmNewPassword: z.string().min(1, "Please confirm your new password."),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.confirmNewPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmNewPassword"],
        message: "Passwords do not match.",
      });
    }
    if (val.newPassword === val.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "New password must be different from your current password.",
      });
    }
  });

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};
