const express = require("express");
const { authenticateUser } = require("../middleware/AuthMiddleware");
const { registerUser, loginUser, listUsersByRole } = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authenticateUser, listUsersByRole);

module.exports = router;
