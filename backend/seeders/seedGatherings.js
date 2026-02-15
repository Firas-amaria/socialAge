const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");
const Gathering = require("../models/Gathering");

dotenv.config();

const SOCIAL_MANAGER_EMAIL = "socialm@gmail.com";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (daysAhead) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysAhead);
  return formatDate(date);
};

const buildGatherings = (smId) => [
  {
    name: "Morning Coffee Circle",
    date: addDays(1),
    time: "09:00",
    location: "Community Hall - Room A",
    iconId: "coffee",
    cardColor: "#4a90e2",
    description: "Start the day with coffee and friendly conversation.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Creative Art Hour",
    date: addDays(2),
    time: "13:30",
    location: "Art Studio - Floor 2",
    iconId: "art",
    cardColor: "#f2c94c",
    description: "A guided art session focused on drawing and color.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Evening Music Meetup",
    date: addDays(3),
    time: "18:00",
    location: "Main Lounge",
    iconId: "music",
    cardColor: "#8b6cfb",
    description: "Light music, group singing, and social time.",
    status: "active",
    type: "free_for_all",
    smId,
  },
];

const upsertGathering = async (gatheringData) => {
  const filter = {
    smId: gatheringData.smId,
    name: gatheringData.name,
    date: gatheringData.date,
    time: gatheringData.time,
  };

  const existing = await Gathering.findOne(filter);
  if (!existing) {
    await Gathering.create(gatheringData);
    return {
      action: "created",
      summary: `${gatheringData.name} (${gatheringData.date} ${gatheringData.time})`,
    };
  }

  existing.location = gatheringData.location;
  existing.iconId = gatheringData.iconId;
  existing.cardColor = gatheringData.cardColor;
  existing.description = gatheringData.description;
  existing.status = gatheringData.status;
  existing.type = gatheringData.type;
  await existing.save();

  return {
    action: "updated",
    summary: `${gatheringData.name} (${gatheringData.date} ${gatheringData.time})`,
  };
};

const seedGatherings = async () => {
  try {
    await connectDB();

    const socialManager = await User.findOne({
      email: SOCIAL_MANAGER_EMAIL,
      role: "SocialM",
    });

    if (!socialManager) {
      throw new Error(
        `Social manager "${SOCIAL_MANAGER_EMAIL}" not found. Run "npm run seed:users" first.`
      );
    }

    const gatherings = buildGatherings(socialManager._id);

    const results = [];
    for (const gathering of gatherings) {
      const result = await upsertGathering(gathering);
      results.push(result);
    }

    console.log("Gatherings seed complete:");
    results.forEach((result) => {
      console.log(`- ${result.action}: ${result.summary}`);
    });
  } catch (error) {
    console.error("Gathering seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedGatherings();
