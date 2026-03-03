const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");

dotenv.config();

const users = [
  {
    name: "Nora Bennett",
    email: "admin@gmail.com",
    password: "12345678",
    role: "Admin",
  },
  {
    name: "Daniel Harper",
    email: "socialm@gmail.com",
    password: "12345678",
    role: "SocialM",
  },
  {
    name: "Elderly User One",
    email: "user1@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Omar Khalil",
    email: "socialm2@gmail.com",
    password: "12345678",
    role: "SocialM",
  },
  {
    name: "Leah Friedman",
    email: "socialm3@gmail.com",
    password: "12345678",
    role: "SocialM",
  },
  {
    name: "Evelyn Brooks",
    email: "user2@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "George Sullivan",
    email: "user3@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Margaret Ellis",
    email: "user4@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Harold Dixon",
    email: "user5@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Ruth Whitman",
    email: "user6@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Walter Hayes",
    email: "user7@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Helen Foster",
    email: "user8@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Samuel Price",
    email: "user9@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Dorothy Lane",
    email: "user10@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Arthur Cole",
    email: "user11@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Gloria Ramsey",
    email: "user12@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Franklin Moss",
    email: "user13@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
];

const upsertUser = async (userData) => {
  const existing = await User.findOne({ email: userData.email });
  if (!existing) {
    await User.create(userData);
    return { action: "created", email: userData.email };
  }

  existing.name = userData.name;
  existing.role = userData.role;
  existing.isActive = true;
  existing.password = userData.password;
  await existing.save();
  return { action: "updated", email: userData.email };
};

const seedUsers = async () => {
  try {
    await connectDB();

    const results = [];
    for (const userData of users) {
      const result = await upsertUser(userData);
      results.push(result);
    }

    console.log("✅ Users seed complete:");
    results.forEach((result) => {
      console.log(`- ${result.action}: ${result.email}`);
    });
  } catch (error) {
    console.error("❌ User seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedUsers();
