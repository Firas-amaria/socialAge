const express = require("express");
const { authenticateUser } = require("../middleware/AuthMiddleware");
const {
  createGathering,
  listGatherings,
  getGatheringById,
  updateGathering,
  addAttendee,
} = require("../controllers/gatheringController");

const router = express.Router();

router.post("/", authenticateUser, createGathering);
router.get("/", listGatherings);
router.get("/:id", getGatheringById);
router.patch("/:id", authenticateUser, updateGathering);
router.post("/:id/attendees", authenticateUser, addAttendee);

module.exports = router;
