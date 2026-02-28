const express = require("express");
const { authenticateUser, optionalAuthenticateUser } = require("../middleware/AuthMiddleware");
const {
  createGathering,
  listGatherings,
  listMyGatherings,
  getManagerSummary,
  getGatheringById,
  updateGathering,
  addAttendee,
  getGatheringAttendees,
  cancelGathering,
} = require("../controllers/gatheringController");

const router = express.Router();

router.post("/", authenticateUser, createGathering);
router.get("/", listGatherings);
router.get("/mine", authenticateUser, listMyGatherings);
router.get("/manager/summary", authenticateUser, getManagerSummary);
router.get("/:id", getGatheringById);
router.patch("/:id", authenticateUser, updateGathering);
router.patch("/:id/cancel", authenticateUser, cancelGathering);
router.post("/:id/attendees", optionalAuthenticateUser, addAttendee);
router.get("/:id/attendees", authenticateUser, getGatheringAttendees);

module.exports = router;
