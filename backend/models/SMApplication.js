const mongoose = require("mongoose");

const SMApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["approved", "denied"], required: true },
    realIdNumber: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    references: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SMApplication", SMApplicationSchema);
