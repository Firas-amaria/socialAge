const express = require("express");
const { authenticateUser, authorizeRoles } = require("../middleware/AuthMiddleware");
const {
  registerUser,
  loginUser,
  listUsersByRole,
  listUsersForAdmin,
  setUserActiveStatus,
  deleteUserAccount,
  getCurrentUser,
  updateCurrentUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", authenticateUser, listUsersByRole);
router.get("/admin/list", authenticateUser, authorizeRoles(["Admin"]), listUsersForAdmin);
router.patch("/admin/:id/status", authenticateUser, authorizeRoles(["Admin"]), setUserActiveStatus);
router.delete("/admin/:id", authenticateUser, authorizeRoles(["Admin"]), deleteUserAccount);
router.get("/me", authenticateUser, getCurrentUser);
router.patch("/me", authenticateUser, updateCurrentUser);

module.exports = router;
