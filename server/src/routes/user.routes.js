const express = require("express");
const { listUsers } = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, listUsers);

module.exports = router;
