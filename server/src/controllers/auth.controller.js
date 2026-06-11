const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/async-handler");
const { parseWithSchema } = require("../utils/validation");
const { registerSchema, loginSchema } = require("../validators/auth.schemas");
const { createUser, findUserByEmail } = require("../services/chat.service");
const { sanitizeUser, signToken } = require("../utils/auth");
const AppError = require("../utils/app-error");

const register = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(registerSchema, req.body);
  const existingUser = await findUserByEmail(payload.email);

  if (existingUser) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await createUser({
    name: payload.name,
    email: payload.email,
    passwordHash,
    avatarSeed: payload.email.toLowerCase(),
  });

  res.status(201).json({
    token: signToken(user),
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const payload = parseWithSchema(loginSchema, req.body);
  const user = await findUserByEmail(payload.email);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const passwordsMatch = await bcrypt.compare(payload.password, user.password_hash);

  if (!passwordsMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json({
    token: signToken(user),
    user: sanitizeUser(user),
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
  });
});

module.exports = {
  register,
  login,
  me,
};
