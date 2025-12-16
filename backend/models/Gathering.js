const mongoose = require("mongoose");

const GatheringSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    smId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gathering", GatheringSchema);
