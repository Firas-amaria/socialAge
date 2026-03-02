const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");
const Gathering = require("../models/Gathering");

dotenv.config();

const SOCIAL_MANAGER_EMAIL = "socialm@gmail.com";
const GUEST_FIRST_NAMES = [
  "Alex",
  "Sam",
  "Jordan",
  "Taylor",
  "Casey",
  "Riley",
  "Morgan",
  "Jamie",
  "Avery",
  "Parker",
  "Drew",
  "Quinn",
  "Reese",
  "Cameron",
  "Blake",
  "Kendall",
  "Harper",
  "Rowan",
  "Emerson",
  "Finley",
];
const GUEST_LAST_NAMES = [
  "Miller",
  "Davis",
  "Wilson",
  "Taylor",
  "Anderson",
  "Thomas",
  "Moore",
  "Jackson",
  "Martin",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "King",
  "Scott",
  "Green",
];
const GUEST_EMAIL_DOMAINS = ["guestmail.com", "mailinator.com", "example.net"];

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
const makeMapLink = (label) =>
  `https://maps.google.com/?q=${encodeURIComponent(label)}`;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};
const pickUnique = (items, count) => shuffle(items).slice(0, Math.max(0, count));
const buildGuestAttendees = (count) =>
  Array.from({ length: count }, () => {
    const firstName = GUEST_FIRST_NAMES[randomInt(0, GUEST_FIRST_NAMES.length - 1)];
    const lastName = GUEST_LAST_NAMES[randomInt(0, GUEST_LAST_NAMES.length - 1)];
    const suffix = randomInt(1000, 9999);
    const domain = GUEST_EMAIL_DOMAINS[randomInt(0, GUEST_EMAIL_DOMAINS.length - 1)];
    const base = `${firstName}.${lastName}.${suffix}`.toLowerCase();

    return {
      name: `${firstName} ${lastName}`,
      email: `${base}@${domain}`,
    };
  });
const buildAttendeesForGathering = (gatheringType, elderlyUsers) => {
  if (gatheringType === "signup_required") {
    const realUsers = pickUnique(elderlyUsers, Math.min(5, elderlyUsers.length));
    return {
      attendees: realUsers.map((user) => user._id),
      guestAttendees: [],
    };
  }

  const realUsers = pickUnique(elderlyUsers, Math.min(1, elderlyUsers.length));
  const guestCount = randomInt(12, 16);
  return {
    attendees: realUsers.map((user) => user._id),
    guestAttendees: buildGuestAttendees(guestCount),
  };
};

const buildGatherings = (smId) => [
  {
    name: "Morning Coffee Circle",
    date: addDays(1),
    startTime: "09:00",
    endTime: "10:00",
    location: "Community Hall - Room A",
    iconId: "coffee",
    cardColor: "#4a90e2",
    description: "Start the day with coffee and friendly conversation.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Gentle Stretch Session",
    date: addDays(1),
    startTime: "10:00",
    endTime: "11:00",
    location: "Community Hall - Room A",
    iconId: "fitness",
    cardColor: "#4caf82",
    description: "A light seated stretching class with slow movements and breathing breaks.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Creative Art Hour",
    date: addDays(2),
    startTime: "13:30",
    endTime: "15:00",
    location: "Art Studio - Floor 2",
    iconId: "art",
    cardColor: "#f2c94c",
    description: "A guided art session focused on drawing and color.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Acrylic Basics Workshop",
    date: addDays(2),
    startTime: "15:00",
    endTime: "16:30",
    location: "Art Studio - Floor 2",
    iconId: "art",
    cardColor: "#f2c94c",
    description: "Practice simple acrylic techniques and leave with a finished mini canvas.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Evening Music Meetup",
    date: addDays(3),
    startTime: "18:00",
    endTime: "19:30",
    location: "Main Lounge",
    iconId: "music",
    cardColor: "#8b6cfb",
    description: "Light music, group singing, and social time.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Classic Songs Circle",
    date: addDays(3),
    startTime: "17:00",
    endTime: "18:00",
    location: "Main Lounge",
    iconId: "music",
    cardColor: "#8b6cfb",
    description: "Sing familiar classics together with lyric sheets and easy group rhythm.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Board Games Afternoon",
    date: addDays(4),
    startTime: "14:00",
    endTime: "15:30",
    location: "Community Hall - Room B",
    iconId: "games",
    cardColor: "#4a90e2",
    description: "Play short board games in small groups with help choosing easy options.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Puzzle and Tea Hour",
    date: addDays(4),
    startTime: "15:30",
    endTime: "16:30",
    location: "Community Hall - Room B",
    iconId: "games",
    cardColor: "#94a3b8",
    description: "Relax with table puzzles, tea, and casual conversation at your own pace.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Neighborhood Book Talk",
    date: addDays(5),
    startTime: "11:00",
    endTime: "12:00",
    location: "Library Corner - Room 1",
    iconId: "book",
    cardColor: "#4a90e2",
    description: "Discuss a short story together with guided prompts and shared reflections.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Poetry Reading Circle",
    date: addDays(5),
    startTime: "12:30",
    endTime: "13:30",
    location: "Library Corner - Room 1",
    iconId: "book",
    cardColor: "#8b6cfb",
    description: "Read selected poems aloud and chat about favorite lines in a small group.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Indoor Plant Care Chat",
    date: addDays(6),
    startTime: "10:30",
    endTime: "11:30",
    location: "Garden Room - Ground Floor",
    iconId: "outdoor",
    cardColor: "#4caf82",
    description: "Learn practical plant care tips and swap easy routines for home greenery.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Garden Walk and Photos",
    date: addDays(6),
    startTime: "16:00",
    endTime: "17:00",
    location: "Garden Room - Ground Floor",
    iconId: "outdoor",
    cardColor: "#4caf82",
    description: "Take a short guided walk and capture seasonal flowers with phone cameras.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Soup and Stories Lunch",
    date: addDays(7),
    startTime: "12:00",
    endTime: "13:00",
    location: "Dining Hall - Section C",
    iconId: "food",
    cardColor: "#e66a6a",
    description: "Enjoy a warm soup lunch while sharing personal stories in roundtable groups.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Healthy Snacks Demo",
    date: addDays(7),
    startTime: "13:30",
    endTime: "14:30",
    location: "Dining Hall - Section C",
    iconId: "food",
    cardColor: "#f2c94c",
    description: "Watch quick snack recipes and taste simple options made with fresh ingredients.",
    status: "active",
    type: "signup_required",
    smId,
  },
  {
    name: "Memory Lane Coffee Chat",
    date: addDays(8),
    startTime: "09:30",
    endTime: "10:30",
    location: "Community Hall - Room A",
    iconId: "coffee",
    cardColor: "#4a90e2",
    description: "A friendly coffee meetup focused on old photos, memories, and light conversation.",
    status: "active",
    type: "free_for_all",
    smId,
  },
  {
    name: "Guided Breathing and Balance",
    date: addDays(8),
    startTime: "10:30",
    endTime: "11:30",
    location: "Community Hall - Room A",
    iconId: "fitness",
    cardColor: "#4caf82",
    description: "Practice easy breathing and balance exercises designed for comfort and safety.",
    status: "active",
    type: "signup_required",
    smId,
  },
].map((item) => ({
  ...item,
  address: item.location,
  location: makeMapLink(item.location),
}));

const upsertGathering = async (gatheringData) => {
  const filter = {
    smId: gatheringData.smId,
    name: gatheringData.name,
    date: gatheringData.date,
    startTime: gatheringData.startTime,
  };

  const existing = await Gathering.findOne(filter);
  if (!existing) {
    await Gathering.create(gatheringData);
    return {
      action: "created",
      summary: `${gatheringData.name} (${gatheringData.date} ${gatheringData.startTime}-${gatheringData.endTime})`,
    };
  }

  existing.startTime = gatheringData.startTime;
  existing.endTime = gatheringData.endTime;
  existing.location = gatheringData.location;
  existing.address = gatheringData.address;
  existing.iconId = gatheringData.iconId;
  existing.cardColor = gatheringData.cardColor;
  existing.description = gatheringData.description;
  existing.status = gatheringData.status;
  existing.type = gatheringData.type;
  existing.attendees = gatheringData.attendees;
  existing.guestAttendees = gatheringData.guestAttendees;
  await existing.save();

  return {
    action: "updated",
    summary: `${gatheringData.name} (${gatheringData.date} ${gatheringData.startTime}-${gatheringData.endTime})`,
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
    const elderlyUsers = await User.find({ role: "Elderly" }).select("_id").lean();
    if (!elderlyUsers.length) {
      throw new Error('No elderly users found. Run "npm run seed:users" first.');
    }

    const gatherings = buildGatherings(socialManager._id);

    const results = [];
    for (const gathering of gatherings) {
      const { attendees, guestAttendees } = buildAttendeesForGathering(
        gathering.type,
        elderlyUsers
      );
      const result = await upsertGathering({
        ...gathering,
        attendees,
        guestAttendees,
      });
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
