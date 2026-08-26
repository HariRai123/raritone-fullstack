const express = require("express");

const {
  createTryOn,
  getMyTryOnResults,
  getTryOnHistory,
  getTryOnResultById,
  getTryOnSessionById,
  retryTryOnSession,
} = require("../controllers/tryon.controller");

const authMiddleware = require("../middleware/auth.middleware");

const { handleImageUpload } = require("../middleware/upload.middleware");

const router = express.Router();

router.post("/session", authMiddleware, handleImageUpload, createTryOn);

router.post("/", authMiddleware, handleImageUpload, createTryOn);

router.get("/session/:id", authMiddleware, getTryOnSessionById);

router.post("/session/:id/retry", authMiddleware, retryTryOnSession);

router.get("/history", authMiddleware, getTryOnHistory);

router.get("/history/:id", authMiddleware, getTryOnResultById);

router.get("/my-results", authMiddleware, getMyTryOnResults);

module.exports = router;
