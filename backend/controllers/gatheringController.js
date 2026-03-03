const nodemailer = require("nodemailer");
const Gathering = require("../models/Gathering");
const User = require("../models/User");

const MANAGER_ROLES = ["SocialM", "Admin"];

const normalizeStatus = (value) => {
  if (!value) return undefined;
  const normalized = value === "cancel" ? "cancelled" : value;
  if (normalized === "denied") return "rejected";
  return normalized;
};

const canManageGatherings = (user) => MANAGER_ROLES.includes(user?.role);
const isValidHttpUrl = (value) => /^https?:\/\/\S+$/i.test((value || "").trim());
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const hasMailConfig = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let mailTransporter = null;
const getMailer = () => {
  if (!hasMailConfig()) return null;
  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return mailTransporter;
};

const sendRegistrationEmail = async ({ to, name, gathering, isGuest }) => {
  const transporter = getMailer();
  if (!transporter) {
    console.log("[gathering-email] skipped: SMTP config missing");
    return { attempted: false, sent: false, reason: "smtp_not_configured" };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!from || !to) {
    console.log("[gathering-email] skipped: sender/recipient missing", { hasFrom: Boolean(from), hasTo: Boolean(to) });
    return { attempted: false, sent: false, reason: "missing_sender_or_recipient" };
  }

  const subject = `Registration Confirmed: ${gathering.name || "Gathering"}`;
  const recipientName = name || "Participant";
  const text = [
    `Hi ${recipientName},`,
    "",
    `You are registered for: ${gathering.name || "-"}`,
    `Date: ${gathering.date || "-"}`,
    `Time: ${gathering.startTime || "--:--"} - ${gathering.endTime || "--:--"}`,
    `Place: ${gathering.address || "-"}`,
    `Map: ${gathering.location || "-"}`,
    "",
    isGuest ? "You registered as a guest attendee." : "You registered from your account.",
  ].join("\n");

  console.log("[gathering-email] sending", {
    to,
    gatheringId: gathering._id?.toString?.() || "",
    isGuest,
  });
  try {
    await transporter.sendMail({ from, to, subject, text });
    console.log("[gathering-email] sent", {
      to,
      gatheringId: gathering._id?.toString?.() || "",
      isGuest,
    });
    return { attempted: true, sent: true, reason: "sent" };
  } catch (error) {
    console.log("[gathering-email] failed", {
      to,
      gatheringId: gathering._id?.toString?.() || "",
      isGuest,
      error: error?.message || "unknown_error",
    });
    return { attempted: true, sent: false, reason: "send_failed", error: error?.message || "unknown_error" };
  }
};

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
    guestAttendees: Array.isArray(plain.guestAttendees) ? plain.guestAttendees : [],
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
      guestAttendees: [],
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
      attendees: gatherings.reduce(
        (sum, g) => sum + (g.attendees?.length || 0) + (g.guestAttendees?.length || 0),
        0
      ),
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
    console.log("[gathering-attendees] register request", {
      gatheringId: req.params.id,
      isLoggedIn: Boolean(req.user?.id),
      hasGuestPayload: Boolean(req.body?.guestName || req.body?.guestEmail),
    });

    const attendeeId = req.user?.id;
    const guestName = (req.body?.guestName || "").trim();
    const guestEmail = (req.body?.guestEmail || "").trim().toLowerCase();

    const gathering = await Gathering.findById(req.params.id);
    if (!gathering) {
      return res.status(404).json({ message: "Gathering not found" });
    }

    if (gathering.status === "cancelled") {
      return res.status(400).json({ message: "Cannot join a cancelled gathering" });
    }

    const guestCount = Array.isArray(gathering.guestAttendees) ? gathering.guestAttendees.length : 0;
    const maxAttendees = Number(gathering.maxAttendees || 0);
    const totalAttendees = gathering.attendees.length + guestCount;
    if (maxAttendees > 0 && totalAttendees >= maxAttendees) {
      return res.status(400).json({ message: "This gathering is already full" });
    }

    if (!attendeeId) {
      let emailDelivery = { attempted: false, sent: false, reason: "not_registered" };
      if (gathering.type !== "free_for_all") {
        return res.status(403).json({ message: "Login is required for this gathering type" });
      }
      if (!guestName || !guestEmail) {
        return res.status(400).json({ message: "guestName and guestEmail are required" });
      }
      if (!isValidEmail(guestEmail)) {
        return res.status(400).json({ message: "guestEmail must be a valid email address" });
      }

      const alreadyJoinedAsGuest = (gathering.guestAttendees || []).some(
        (guest) => (guest.email || "").toLowerCase() === guestEmail
      );
      if (!alreadyJoinedAsGuest) {
        gathering.guestAttendees.push({
          name: guestName,
          email: guestEmail,
          registeredAt: new Date(),
        });
        await gathering.save();
        emailDelivery = await sendRegistrationEmail({
          to: guestEmail,
          name: guestName,
          gathering,
          isGuest: true,
        });
      } else {
        emailDelivery = { attempted: false, sent: false, reason: "already_registered" };
        console.log("[gathering-attendees] guest already registered", {
          gatheringId: gathering._id?.toString?.() || "",
          guestEmail,
        });
      }
      const refreshed = await Gathering.findById(gathering._id).populate("attendees", "name email role");
      const response = normalizeGatheringForResponse(refreshed);
      response.registrationEmail = emailDelivery;
      response.registration = { mode: "guest", alreadyRegistered: alreadyJoinedAsGuest };
      return res.json(response);
    }

    let emailDelivery = { attempted: false, sent: false, reason: "not_registered" };
    const alreadyJoined = gathering.attendees.some(
      (id) => id.toString() === attendeeId.toString()
    );
    if (!alreadyJoined) {
      gathering.attendees.push(attendeeId);
      await gathering.save();
      const attendeeUser = await User.findById(attendeeId).select("name email");
      if (attendeeUser?.email) {
        emailDelivery = await sendRegistrationEmail({
          to: attendeeUser.email,
          name: attendeeUser.name,
          gathering,
          isGuest: false,
        });
      } else {
        emailDelivery = { attempted: false, sent: false, reason: "attendee_email_missing" };
        console.log("[gathering-email] skipped: attendee email not found", {
          attendeeId: attendeeId?.toString?.() || "",
          gatheringId: gathering._id?.toString?.() || "",
        });
      }
    } else {
      emailDelivery = { attempted: false, sent: false, reason: "already_registered" };
      console.log("[gathering-attendees] user already registered", {
        gatheringId: gathering._id?.toString?.() || "",
        attendeeId: attendeeId?.toString?.() || "",
      });
    }
    const populated = await gathering.populate("attendees", "name email role");
    const response = normalizeGatheringForResponse(populated);
    response.registrationEmail = emailDelivery;
    response.registration = { mode: "user", alreadyRegistered };
    res.json(response);
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
      guestAttendees: Array.isArray(gathering.guestAttendees) ? gathering.guestAttendees : [],
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
