const path = require("path");
const asyncHandler = require("../utils/async-handler");
const env = require("../config/env");
const AppError = require("../utils/app-error");

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Choose a file to upload.", 400);
  }

  res.status(201).json({
    file: {
      fileName: req.file.originalname,
      fileUrl: `${env.API_BASE_URL}/uploads/${path.basename(req.file.path)}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    },
  });
});

module.exports = {
  uploadFile,
};
