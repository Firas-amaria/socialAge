const mongoose = require("mongoose");

const SMApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    governmentIdNumber: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    references: { type: String, default: "", trim: true },
    employmentProof: {
      filename: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
    governmentIdImage: {
      filename: { type: String, default: "" },
      mimetype: { type: String, default: "" },
      size: { type: Number, default: 0 },
    },
    additionalDocuments: [
      {
        filename: { type: String, default: "" },
        mimetype: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SMApplication", SMApplicationSchema);
