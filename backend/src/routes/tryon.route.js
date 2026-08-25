const express = require("express");
const multer = require("multer");
const {
  createTryOn,
  getMyTryOnResults,
  getTryOnHistory,
  getTryOnResultById,
  getTryOnSessionById,
  retryTryOnSession,
} = require("../controllers/tryon.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(
        new Error("Only JPG, JPEG and PNG images are supported."),
      );
    }
    cb(null, true);
  },
});

function handleUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        message: "Image size must be less than 10 MB.",
      });
    }

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    next();
  });
}

// Create a session. VTON runs in the background.
// Preferred production endpoint:
router.post("/session", authMiddleware, handleUpload, createTryOn);
// Backward-compatible endpoint:
router.post("/", authMiddleware, handleUpload, createTryOn);

// Session status + polling.
router.get("/session/:id", authMiddleware, getTryOnSessionById);

// Retry a failed session.
router.post("/session/:id/retry", authMiddleware, retryTryOnSession);

// Authenticated history. Queries are always scoped by req.user.id.
router.get("/history", authMiddleware, getTryOnHistory);
router.get("/history/:id", authMiddleware, getTryOnResultById);
router.get("/my-results", authMiddleware, getMyTryOnResults);

module.exports = router;
