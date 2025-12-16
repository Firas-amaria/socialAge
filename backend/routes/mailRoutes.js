const express = require("express");
const multer = require("multer");
const { sendImageEmail } = require("../controllers/mailController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/upload", upload.single("image"), sendImageEmail);

module.exports = router;
