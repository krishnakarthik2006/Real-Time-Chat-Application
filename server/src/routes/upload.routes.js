const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { upload } = require("../middleware/upload.middleware");
const { uploadFile } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/", requireAuth, upload.single("file"), uploadFile);

module.exports = router;
