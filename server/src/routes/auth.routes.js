const express = require("express");
const { register, login, googleAuth, me } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/me", requireAuth, me);

module.exports = router;
