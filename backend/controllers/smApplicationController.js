const SMApplication = require("../models/SMApplication");

const ALLOWED_STATUSES = ["approved", "denied"];

const createApplication = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { status, realIdNumber, fullName, references = "" } = req.body;

    if (!userId || !status || !realIdNumber || !fullName) {
      return res.status(400).json({ message: "userId, status, realIdNumber, and fullName are required" });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }

    const application = await SMApplication.create({ userId, status, realIdNumber, fullName, references });
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const listApplications = async (_req, res) => {
  try {
    const applications = await SMApplication.find().populate("userId", "name email");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await SMApplication.findById(req.params.id).populate("userId", "name email");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
    }

    const updated = await SMApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Application not found" });
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
  updateApplicationStatus,
};
