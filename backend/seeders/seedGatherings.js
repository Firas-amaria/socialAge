const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");
const Gathering = require("../models/Gathering");

dotenv.config();

const SOCIAL_MANAGER_EMAIL = "socialm@gmail.com";
const USER1_EMAIL = "user1@gmail.com";
const USER1_CURRENT_GATHERING_NAME = "Coffee and Conversation";
const MANAGER_EMAILS = {
  user1: SOCIAL_MANAGER_EMAIL,
  manager2: "socialm2@gmail.com",
  manager3: "socialm3@gmail.com",
};
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
const formatTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};
const addHours = (date, hours) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};
const getCurrentWindow = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  const start = addHours(now, -1);
  const end = addHours(now, 1);
  return {
    date: formatDate(start),
    startTime: formatTime(start),
    endTime: formatTime(end),
  };
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

const buildGatheringsForManager = (managerKey, smId) => {
  const current = getCurrentWindow();

  const definitionsByManager = {
    user1: [
      {
        name: "Coffee and Conversation",
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        location: "Community Hall - Room A",
        iconId: "coffee",
        cardColor: "#4a90e2",
        description: "Current social coffee gathering.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Creative Art Hour",
        date: addDays(1),
        startTime: "11:00",
        endTime: "12:00",
        location: "Art Studio - Floor 2",
        iconId: "art",
        cardColor: "#f2c94c",
        description: "Guided drawing and painting practice.",
        status: "active",
        type: "signup_required",
      },
      {
        name: "Music Circle",
        date: addDays(2),
        startTime: "17:00",
        endTime: "18:00",
        location: "Main Lounge",
        iconId: "music",
        cardColor: "#8b6cfb",
        description: "Light sing-along and group music.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Board Games Afternoon",
        date: addDays(3),
        startTime: "14:00",
        endTime: "15:30",
        location: "Community Hall - Room B",
        iconId: "games",
        cardColor: "#4a90e2",
        description: "Easy board games in small groups.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Garden Walk",
        date: addDays(4),
        startTime: "10:30",
        endTime: "11:30",
        location: "Garden Room - Ground Floor",
        iconId: "outdoor",
        cardColor: "#4caf82",
        description: "Short guided walk outdoors.",
        status: "active",
        type: "free_for_all",
      },
    ],
    manager2: [
      {
        name: "Current Stretch Session",
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        location: "Community Hall - Room B",
        iconId: "fitness",
        cardColor: "#4caf82",
        description: "Current seated stretching session.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Poetry Reading Circle",
        date: addDays(1),
        startTime: "12:30",
        endTime: "13:30",
        location: "Library Corner - Room 1",
        iconId: "book",
        cardColor: "#8b6cfb",
        description: "Read and discuss short poems.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Soup and Stories Lunch",
        date: addDays(2),
        startTime: "12:00",
        endTime: "13:00",
        location: "Dining Hall - Section C",
        iconId: "food",
        cardColor: "#e66a6a",
        description: "Warm lunch and story sharing.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Indoor Plant Care Chat",
        date: addDays(3),
        startTime: "10:30",
        endTime: "11:30",
        location: "Garden Room - Ground Floor",
        iconId: "outdoor",
        cardColor: "#4caf82",
        description: "Practical tips for home plants.",
        status: "active",
        type: "signup_required",
      },
      {
        name: "Puzzle and Tea Hour",
        date: addDays(4),
        startTime: "15:30",
        endTime: "16:30",
        location: "Community Hall - Room B",
        iconId: "games",
        cardColor: "#94a3b8",
        description: "Relaxed puzzle tables with tea.",
        status: "active",
        type: "free_for_all",
      },
    ],
    manager3: [
      {
        name: "Current Book Talk",
        date: current.date,
        startTime: current.startTime,
        endTime: current.endTime,
        location: "Library Corner - Room 1",
        iconId: "book",
        cardColor: "#4a90e2",
        description: "Current guided reading discussion.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Morning Coffee Circle",
        date: addDays(1),
        startTime: "09:00",
        endTime: "10:00",
        location: "Community Hall - Room A",
        iconId: "coffee",
        cardColor: "#4a90e2",
        description: "Morning coffee and friendly chat.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Neighborhood Book Club",
        date: addDays(2),
        startTime: "11:00",
        endTime: "12:00",
        location: "Library Corner - Room 1",
        iconId: "book",
        cardColor: "#4a90e2",
        description: "Group discussion around short readings.",
        status: "active",
        type: "signup_required",
      },
      {
        name: "Healthy Snacks Demo",
        date: addDays(3),
        startTime: "13:30",
        endTime: "14:30",
        location: "Dining Hall - Section C",
        iconId: "food",
        cardColor: "#f2c94c",
        description: "Quick healthy snack ideas and tasting.",
        status: "active",
        type: "free_for_all",
      },
      {
        name: "Balance and Breathing",
        date: addDays(4),
        startTime: "10:30",
        endTime: "11:30",
        location: "Community Hall - Room A",
        iconId: "fitness",
        cardColor: "#4caf82",
        description: "Gentle balance and breathing practice.",
        status: "active",
        type: "free_for_all",
      },
    ],
  };

  const managerDefinitions = definitionsByManager[managerKey] || [];
  return managerDefinitions.map((item) => ({
    ...item,
    smId,
    address: item.location,
    location: makeMapLink(item.location),
  }));
};

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

    const managerEmails = Object.values(MANAGER_EMAILS);
    const socialManagers = await User.find({
      email: { $in: managerEmails },
      role: "SocialM",
    })
      .select("_id email")
      .lean();

    const managerByEmail = new Map(socialManagers.map((user) => [user.email, user]));
    const missingManagerEmails = managerEmails.filter((email) => !managerByEmail.has(email));
    if (missingManagerEmails.length) {
      throw new Error(
        `Missing social manager(s): ${missingManagerEmails.join(
          ", "
        )}. Run "npm run seed:users" first.`
      );
    }

    const elderlyUsers = await User.find({ role: "Elderly" }).select("_id").lean();
    if (!elderlyUsers.length) {
      throw new Error('No elderly users found. Run "npm run seed:users" first.');
    }
    const user1 = await User.findOne({ email: USER1_EMAIL, role: "Elderly" })
      .select("_id")
      .lean();
    if (!user1) {
      throw new Error(
        `Elderly user "${USER1_EMAIL}" not found. Ensure seedUsers marks this account as Elderly.`
      );
    }

    const gatherings = [
      ...buildGatheringsForManager("user1", managerByEmail.get(MANAGER_EMAILS.user1)._id),
      ...buildGatheringsForManager("manager2", managerByEmail.get(MANAGER_EMAILS.manager2)._id),
      ...buildGatheringsForManager("manager3", managerByEmail.get(MANAGER_EMAILS.manager3)._id),
    ];

    const results = [];
    for (const gathering of gatherings) {
      const { attendees, guestAttendees } = buildAttendeesForGathering(
        gathering.type,
        elderlyUsers
      );
      const ensuredAttendees = [...attendees];
      if (
        gathering.name === USER1_CURRENT_GATHERING_NAME &&
        !ensuredAttendees.some((id) => String(id) === String(user1._id))
      ) {
        ensuredAttendees.push(user1._id);
      }
      const result = await upsertGathering({
        ...gathering,
        attendees: ensuredAttendees,
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
