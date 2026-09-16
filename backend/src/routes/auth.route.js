const express = require("express");
const multer = require("multer");

const authController = require("../controllers/auth.controller");
const firebaseAuthController = require("../controllers/firebaseAuth.controller");
const firebaseMigrationController = require("../controllers/firebaseMigration.controller");

const authMiddleWare = require("../middleware/auth.middleware");
const firebaseRegistrationMiddleware = require("../middleware/firebaseRegistration.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// LEGACY AUTH
// ============================================================

router.post(
  "/register",
  upload.single("profileImage"),
  authController.registerUser,
);

router.post(
  "/login",
  authController.loginUser,
);

// ============================================================
// MIGRATION
// ============================================================

router.post(
  "/migrate",
  firebaseMigrationController.migrateLegacyUser,
);

// ============================================================
// FIREBASE LOGIN
//
// Existing MongoDB account required.
// ============================================================

router.post(
  "/sync",
  authMiddleWare,
  firebaseAuthController.syncFirebaseUser,
);

// ============================================================
// FIREBASE REGISTRATION
//
// IMPORTANT:
// DO NOT use authMiddleWare here.
//
// New Firebase users do not exist in MongoDB yet.
// ============================================================

router.post(
  "/register-firebase",
  firebaseRegistrationMiddleware,
  firebaseAuthController.registerFirebaseUser,
);

// ============================================================
// PROFILE
// ============================================================

router.get(
  "/profile",
  authMiddleWare,
  authController.getProfile,
);

router.put(
  "/profile",
  authMiddleWare,
  upload.single("profileImage"),
  authController.updateProfile,
);

module.exports = router;