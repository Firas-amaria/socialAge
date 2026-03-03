const nodemailer = require("nodemailer");
const SMApplication = require("../models/SMApplication");
const User = require("../models/User");

const ALLOWED_STATUSES = ["pending", "approved", "rejected", "denied"];
const ADMIN_ROLES = ["Admin"];

const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const createApplication = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const { governmentIdNumber, fullName, references = "" } = req.body;

    const employmentProof = req.files?.employmentProof?.[0];
    const governmentIdImage = req.files?.governmentIdImage?.[0];
    const additionalDocuments = req.files?.additionalDocuments || [];

    if (!governmentIdNumber || !fullName) {
      return res.status(400).json({ message: "governmentIdNumber and fullName are required" });
    }

    if (!employmentProof) {
      return res.status(400).json({ message: "employmentProof file is required" });
    }

    if (!governmentIdImage) {
      return res.status(400).json({ message: "governmentIdImage file is required" });
    }

    const existingPending = await SMApplication.findOne({ userId, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending application" });
    }

    const to = process.env.MAIL_TO;
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;
    if (!to || !from) {
      return res.status(400).json({ message: "Missing recipient or sender email (configure MAIL_TO and MAIL_FROM)" });
    }

    const applicationPayload = {
      userId,
      status: "pending",
      governmentIdNumber,
      fullName,
      references,
      employmentProof: {
        filename: employmentProof.originalname,
        mimetype: employmentProof.mimetype,
        size: employmentProof.size,
      },
      governmentIdImage: {
        filename: governmentIdImage.originalname,
        mimetype: governmentIdImage.mimetype,
        size: governmentIdImage.size,
      },
      additionalDocuments: additionalDocuments.map((file) => ({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      })),
    };

    const attachments = [employmentProof, governmentIdImage, ...additionalDocuments].map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));

    const text = [
      "New Social Manager application submitted.",
      "",
      `Full Name: ${fullName}`,
      `Government ID Number: ${governmentIdNumber}`,
      `References: ${references || "None provided"}`,
      `User Id: ${userId || "N/A"}`,
      "",
      "Files:",
      `- Employment Proof: ${employmentProof.originalname}`,
      `- Government ID Image: ${governmentIdImage.originalname}`,
      ...additionalDocuments.map((file, index) => `- Additional Document ${index + 1}: ${file.originalname}`),
    ].join("\n");

    await transporter.sendMail({
      from,
      to,
      subject: "New Social Manager Application",
      text,
      attachments,
    });

    const application = await SMApplication.create(applicationPayload);
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listApplications = async (_req, res) => {
  try {
    const userId = _req.user?.id;
    const role = _req.user?.role;

    const query = ADMIN_ROLES.includes(role) ? {} : { userId };
    const applications = await SMApplication.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name email role");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const role = req.user?.role;
    const application = await SMApplication.findById(req.params.id).populate("userId", "name email role");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (!ADMIN_ROLES.includes(role) && application.userId?._id?.toString() !== req.user?.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyLatestApplication = async (req, res) => {
  try {
    const userId = req.user?.id;
    const application = await SMApplication.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "name email role");

    if (!application) {
      return res.status(404).json({ message: "No application found for this user" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const role = req.user?.role;
    if (!ADMIN_ROLES.includes(role)) {
      return res.status(403).json({ message: "Only admins can update application status" });
    }

    const { status, adminNotes } = req.body;
    const normalizedStatus = status === "denied" ? "rejected" : status;

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }

    const updated = await SMApplication.findById(req.params.id);

    if (!updated) {
      return res.status(404).json({ message: "Application not found" });
    }
    const previousStatus = updated.status;

    updated.status = normalizedStatus;
    if (typeof adminNotes === "string") {
      updated.adminNotes = adminNotes.trim();
    }
    if (normalizedStatus === "approved" && previousStatus !== "approved") {
      updated.approvedAt = new Date();
    }
    if (normalizedStatus !== "approved" && previousStatus === "approved") {
      updated.approvedAt = null;
    }

    await updated.save();

    if (normalizedStatus === "approved" && updated.userId) {
      await User.findByIdAndUpdate(updated.userId, { role: "SocialM" });
    }

    if (normalizedStatus === "rejected" && updated.userId) {
      await User.findByIdAndUpdate(updated.userId, { role: "Elderly" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createApplication,
  listApplications,
  getApplicationById,
  getMyLatestApplication,
  updateApplicationStatus,
};
