const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { connectDB } = require("../config/config");

dotenv.config();

const resetDb = async () => {
  try {
    await connectDB();
    await mongoose.connection.dropDatabase();
    console.log("Database reset complete: all collections dropped.");
  } catch (error) {
    console.error("Database reset failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

resetDb();
