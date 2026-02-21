const express = require("express");
const { authenticateUser } = require("../middleware/AuthMiddleware");
const multer = require("multer");
const {
  createApplication,
  listApplications,
  getApplicationById,
  getMyLatestApplication,
  updateApplicationStatus,
} = require("../controllers/smApplicationController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!allowed) {
      return cb(new Error("Only image, PDF, or Word files are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/",
  authenticateUser,
  upload.fields([
    { name: "employmentProof", maxCount: 1 },
    { name: "governmentIdImage", maxCount: 1 },
    { name: "additionalDocuments", maxCount: 3 },
  ]),
  createApplication
);
router.get("/", authenticateUser, listApplications);
router.get("/me/latest", authenticateUser, getMyLatestApplication);
router.get("/:id", authenticateUser, getApplicationById);
router.patch("/:id/status", authenticateUser, updateApplicationStatus);

module.exports = router;
