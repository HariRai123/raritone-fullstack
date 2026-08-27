const express = require("express");

const {
  createThreeDTryOnSession,
  getThreeDTryOnSession,
  updateThreeDBodyData,
} = require("../controllers/threeDTryOn.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/session",
  authMiddleware,
  createThreeDTryOnSession,
);

router.get(
  "/session/:id",
  authMiddleware,
  getThreeDTryOnSession,
);

router.patch(
  "/session/:id/body",
  authMiddleware,
  updateThreeDBodyData,
);

module.exports = router;