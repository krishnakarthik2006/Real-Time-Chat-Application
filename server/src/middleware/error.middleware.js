const AppError = require("../utils/app-error");

function errorHandler(error, _req, res, _next) {
  if (error?.name === "MulterError") {
    return res.status(400).json({
      message: error.message,
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: error.message || "Something went wrong.",
  });
}

module.exports = {
  errorHandler,
};
