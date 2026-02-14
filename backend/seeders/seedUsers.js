const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");
const User = require("../models/User");

dotenv.config();

const users = [
  {
    name: "Admin User",
    email: "admin@gmail.com",
    password: "12345678",
    role: "Admin",
  },
  {
    name: "Social Manager",
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
    name: "Elderly User Two",
    email: "user2@gmail.com",
    password: "12345678",
    role: "Elderly",
  },
  {
    name: "Elderly User Three",
    email: "user3@gmail.com",
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
