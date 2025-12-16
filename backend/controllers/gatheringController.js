const Gathering = require("../models/Gathering");

const createGathering = async (req, res) => {
  try {
    const { name, dateTime, location, smId, attendees = [] } = req.body;
    const ownerId = smId || req.user?.id;

    if (!name || !dateTime || !location || !ownerId) {
      return res.status(400).json({ message: "name, dateTime, location, and smId are required" });
    }

    const gathering = await Gathering.create({ name, dateTime, location, smId: ownerId, attendees });
    res.status(201).json(gathering);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listGatherings = async (_req, res) => {
  try {
    const gatherings = await Gathering.find()
      .populate("smId", "name email")
      .populate("attendees", "name email");
    res.json(gatherings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGatheringById = async (req, res) => {
  try {
    const gathering = await Gathering.findById(req.params.id)
      .populate("smId", "name email")
      .populate("attendees", "name email");

    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    res.json(gathering);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGathering = async (req, res) => {
  try {
    const updates = req.body;
    const gathering = await Gathering.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("smId", "name email")
      .populate("attendees", "name email");

    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    res.json(gathering);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAttendee = async (req, res) => {
  try {
    const attendeeId = req.body.userId || req.user?.id;
    if (!attendeeId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const gathering = await Gathering.findById(req.params.id);
    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    const alreadyJoined = gathering.attendees.some(
      (id) => id.toString() === attendeeId.toString()
    );
    if (!alreadyJoined) {
      gathering.attendees.push(attendeeId);
      await gathering.save();
    }

    const populated = await gathering.populate("attendees", "name email");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGathering,
  listGatherings,
  getGatheringById,
  updateGathering,
  addAttendee,
};
