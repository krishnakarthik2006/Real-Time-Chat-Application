const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signToken(user) {
  const id = user.id || (user._id ? String(user._id) : "");
  return jwt.sign(
    {
      id,
      email: user.email,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

function sanitizeUser(row) {
  const id = row?._id ? String(row._id) : String(row.id);

  return {
    id,
    name: row.name,
    email: row.email,
    avatarSeed: row.avatarSeed,
    lastSeen: row.lastSeen,
    createdAt: row.createdAt,
  };
}

module.exports = {
  signToken,
  verifyToken,
  sanitizeUser,
};
