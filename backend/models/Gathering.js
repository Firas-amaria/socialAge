const mongoose = require("mongoose");

const GatheringSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: {
      type: String,
      trim: true,
      match: /^\d{2}:\d{2}$/,
    },
    startTime: {
      type: String,
      trim: true,
      match: /^\d{2}:\d{2}$/,
    },
    endTime: {
      type: String,
      trim: true,
      match: /^\d{2}:\d{2}$/,
    },
    location: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    maxAttendees: { type: Number, min: 1, default: 30 },
    iconId: { type: String, trim: true },
    cardColor: { type: String, trim: true },
    description: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "active", "inactive", "cancelled"],
      default: "active",
    },
    type: {
      type: String,
      enum: ["free_for_all", "signup_required"],
      default: "free_for_all",
    },
    smId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gathering", GatheringSchema);
