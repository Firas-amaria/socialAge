const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");
const SMApplication = require("../models/SMApplication");

dotenv.config();

const SOCIAL_MANAGER_EMAIL = "socialm@gmail.com";

const applicationTemplate = {
  governmentIdNumber: "SM-0001-APPROVED",
  fullName: "Social Manager",
  references: "Community center board recommendation on file.",
  adminNotes: "Approved through seed data for local testing.",
  status: "approved",
};

const upsertApplication = async (user) => {
  const latest = await SMApplication.findOne({ userId: user._id }).sort({ createdAt: -1 });

  if (!latest) {
    const created = await SMApplication.create({
      userId: user._id,
      ...applicationTemplate,
      approvedAt: new Date(),
    });
    return {
      action: "created",
      id: created._id.toString(),
      status: created.status,
    };
  }

  latest.governmentIdNumber = applicationTemplate.governmentIdNumber;
  latest.fullName = applicationTemplate.fullName;
  latest.references = applicationTemplate.references;
  latest.adminNotes = applicationTemplate.adminNotes;
  latest.status = "approved";
  latest.approvedAt = latest.approvedAt || new Date();
  await latest.save();

  return {
    action: "updated",
    id: latest._id.toString(),
    status: latest.status,
  };
};

const seedApplications = async () => {
  try {
    await connectDB();

    const manager = await User.findOne({ email: SOCIAL_MANAGER_EMAIL });
    if (!manager) {
      throw new Error(
        `User "${SOCIAL_MANAGER_EMAIL}" not found. Run "npm run seed:users" first.`
      );
    }

    if (manager.role !== "SocialM") {
      manager.role = "SocialM";
      await manager.save();
    }

    const result = await upsertApplication(manager);
    console.log("Applications seed complete:");
    console.log(`- ${result.action}: ${SOCIAL_MANAGER_EMAIL} (${result.status}) [${result.id}]`);
  } catch (error) {
    console.error("Applications seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedApplications();
