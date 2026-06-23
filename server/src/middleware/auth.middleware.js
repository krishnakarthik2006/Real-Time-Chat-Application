const { verifyToken } = require("../utils/auth");
const AppError = require("../utils/app-error");
const { findUserById } = require("../services/chat.service");

async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");

    if (!token) {
      throw new AppError("Authentication required.", 401);
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.id);

    if (!user) {
      throw new AppError("User not found.", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
      ? new AppError("Invalid or expired token.", 401)
      : error);
  }
}

module.exports = {
  requireAuth,
};
