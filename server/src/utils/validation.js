const AppError = require("./app-error");

function parseWithSchema(schema, payload) {
  const result = schema.safeParse(payload);

  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(", ");
    throw new AppError(message || "Invalid request payload.", 400);
  }

  return result.data;
}

module.exports = {
  parseWithSchema,
};
