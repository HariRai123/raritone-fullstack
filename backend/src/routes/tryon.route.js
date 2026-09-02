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

/*
 * POST /api/tryon
 *
 * Form-data:
 * - productId      -> Text
 * - person_image   -> File
 */
router.post(
  "/",
  authMiddleware,
  handleImageUpload("person_image"),
  createTryOn
);

/*
 * Try-on session APIs
 */
router.get(
  "/session/:id",
  authMiddleware,
  getTryOnSessionById
);

router.post(
  "/session/:id/retry",
  authMiddleware,
  retryTryOnSession
);

/*
 * History
 */
router.get(
  "/history",
  authMiddleware,
  getTryOnHistory
);

router.get(
  "/history/:id",
  authMiddleware,
  getTryOnResultById
);

router.get(
  "/my-results",
  authMiddleware,
  getMyTryOnResults
);

module.exports = router;