const Gathering = require("../models/Gathering");

const MANAGER_ROLES = ["SocialM", "Admin"];

const normalizeStatus = (value) => {
  if (!value) return undefined;
  const normalized = value === "cancel" ? "cancelled" : value;
  if (normalized === "denied") return "rejected";
  return normalized;
};

const canManageGatherings = (user) => MANAGER_ROLES.includes(user?.role);
const isValidHttpUrl = (value) => /^https?:\/\/\S+$/i.test((value || "").trim());

const isOwnerOrAdmin = (user, gathering) => {
  if (!user || !gathering) return false;
  if (user.role === "Admin") return true;
  const ownerId = gathering.smId?._id || gathering.smId;
  return ownerId?.toString() === user.id?.toString();
};

const normalizeGatheringForResponse = (gathering) => {
  if (!gathering) return gathering;
  const plain =
    typeof gathering.toObject === "function"
      ? gathering.toObject()
      : gathering;
  const startTime = plain.startTime || plain.time || "";
  const endTime = plain.endTime || plain.time || "";
  const address = plain.address || plain.location || "";
  const normalized = {
    ...plain,
    startTime,
    endTime,
    address,
  };
  delete normalized.time;
  return normalized;
};

const buildPayload = (body = {}) => {
  const {
    name,
    date,
    startTime,
    endTime,
    location,
    address,
    maxAttendees,
    iconId,
    cardColor,
    description,
    notes,
    status,
    type,
  } = body;

  return {
    name,
    date,
    startTime,
    endTime,
    location,
    address,
    maxAttendees,
    iconId,
    cardColor,
    description,
    notes,
    status: normalizeStatus(status),
    type,
  };
};

const createGathering = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can create gatherings" });
    }

    const ownerId = req.user?.id;
    const payload = buildPayload(req.body);

    if (
      !payload.name ||
      !payload.date ||
      !payload.startTime ||
      !payload.endTime ||
      !payload.address ||
      !payload.location ||
      !ownerId
    ) {
      return res.status(400).json({
        message: "name, date, startTime, endTime, address, and location are required",
      });
    }
    if (!isValidHttpUrl(payload.location)) {
      return res.status(400).json({
        message: "location must be a valid http(s) URL",
      });
    }

    const gathering = await Gathering.create({
      ...payload,
      smId: ownerId,
      attendees: [],
    });

    const populated = await gathering.populate("smId", "name email role");
    res.status(201).json(normalizeGatheringForResponse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listGatherings = async (req, res) => {
  try {
    const status = req.query?.status;
    const query = {};
    if (status) query.status = normalizeStatus(status);

    const gatherings = await Gathering.find(query)
      .sort({ date: 1, startTime: 1, endTime: 1 })
      .populate("smId", "name email role")
      .populate("attendees", "name email");
    res.json(gatherings.map(normalizeGatheringForResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listMyGatherings = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can access this endpoint" });
    }

    const query =
      req.user.role === "Admin"
        ? {}
        : { smId: req.user.id };

    const gatherings = await Gathering.find(query)
      .sort({ createdAt: -1 })
      .populate("attendees", "name email role");

    res.json(gatherings.map(normalizeGatheringForResponse));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getManagerSummary = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can access this endpoint" });
    }

    const query = req.user.role === "Admin" ? {} : { smId: req.user.id };
    const gatherings = await Gathering.find(query);

    const summary = {
      total: gatherings.length,
      active: gatherings.filter((g) => g.status === "active").length,
      draft: gatherings.filter((g) => g.status === "draft").length,
      cancelled: gatherings.filter((g) => g.status === "cancelled").length,
      attendees: gatherings.reduce((sum, g) => sum + (g.attendees?.length || 0), 0),
      upcoming: gatherings
        .slice()
        .sort((a, b) => {
          const aStart = a.startTime || a.time || "";
          const bStart = b.startTime || b.time || "";
          return `${a.date} ${aStart}`.localeCompare(`${b.date} ${bStart}`);
        })
        .map(normalizeGatheringForResponse)
        .slice(0, 5),
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGatheringById = async (req, res) => {
  try {
    const gathering = await Gathering.findById(req.params.id)
      .populate("smId", "name email role")
      .populate("attendees", "name email role");

    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    res.json(normalizeGatheringForResponse(gathering));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGathering = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can update gatherings" });
    }

    const current = await Gathering.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    if (!isOwnerOrAdmin(req.user, current)) {
      return res.status(403).json({ message: "You can only update your own gatherings" });
    }

    const updates = buildPayload(req.body);
    if (updates.location && !isValidHttpUrl(updates.location)) {
      return res.status(400).json({
        message: "location must be a valid http(s) URL",
      });
    }
    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined || updates[key] === null || updates[key] === "") {
        delete updates[key];
      }
    });

    const gathering = await Gathering.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("smId", "name email role")
      .populate("attendees", "name email role");

    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    res.json(normalizeGatheringForResponse(gathering));
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

    if (gathering.status === "cancelled") {
      return res.status(400).json({ message: "Cannot join a cancelled gathering" });
    }

    const maxAttendees = Number(gathering.maxAttendees || 0);
    if (maxAttendees > 0 && gathering.attendees.length >= maxAttendees) {
      return res.status(400).json({ message: "This gathering is already full" });
    }

    const alreadyJoined = gathering.attendees.some(
      (id) => id.toString() === attendeeId.toString()
    );
    if (!alreadyJoined) {
      gathering.attendees.push(attendeeId);
      await gathering.save();
    }

    const populated = await gathering.populate("attendees", "name email role");
    res.json(normalizeGatheringForResponse(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGatheringAttendees = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can access this endpoint" });
    }

    const gathering = await Gathering.findById(req.params.id)
      .populate("smId", "name email role")
      .populate("attendees", "name email role");

    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    if (!isOwnerOrAdmin(req.user, gathering)) {
      return res.status(403).json({ message: "You can only view attendees for your own gatherings" });
    }

    res.json({
      _id: gathering._id,
      name: gathering.name,
      date: gathering.date,
      startTime: gathering.startTime || gathering.time || "",
      endTime: gathering.endTime || gathering.time || "",
      location: gathering.location,
      address: gathering.address || gathering.location || "",
      attendees: gathering.attendees,
      maxAttendees: gathering.maxAttendees,
      status: gathering.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelGathering = async (req, res) => {
  try {
    if (!canManageGatherings(req.user)) {
      return res.status(403).json({ message: "Only social managers can cancel gatherings" });
    }

    const gathering = await Gathering.findById(req.params.id);
    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    if (!isOwnerOrAdmin(req.user, gathering)) {
      return res.status(403).json({ message: "You can only cancel your own gatherings" });
    }

    gathering.status = "cancelled";
    await gathering.save();

    res.json({ message: "Gathering cancelled", gathering: normalizeGatheringForResponse(gathering) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGathering,
  listGatherings,
  listMyGatherings,
  getManagerSummary,
  getGatheringById,
  updateGathering,
  addAttendee,
  getGatheringAttendees,
  cancelGathering,
};
