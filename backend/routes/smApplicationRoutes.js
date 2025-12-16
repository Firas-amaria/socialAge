const express = require("express");
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
  createApplication,
  listApplications,
  getApplicationById,
  updateApplicationStatus,
} = require("../controllers/smApplicationController");

const router = express.Router();

router.post("/", authenticateUser, createApplication);
router.get("/", authenticateUser, listApplications);
router.get("/:id", authenticateUser, getApplicationById);
router.patch("/:id/status", authenticateUser, updateApplicationStatus);

module.exports = router;
