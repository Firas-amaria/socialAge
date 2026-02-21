const express = require("express");
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
  registerUser,
  loginUser,
  listUsersByRole,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authenticateUser, listUsersByRole);
router.get("/me", authenticateUser, getCurrentUser);
router.patch("/me", authenticateUser, updateCurrentUser);

module.exports = router;
