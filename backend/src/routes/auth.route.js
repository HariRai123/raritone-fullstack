const express = require("express");
const multer = require("multer");

const authController = require("../controllers/auth.controller");
const firebaseAuthController = require("../controllers/firebaseAuth.controller");
const firebaseMigrationController = require("../controllers/firebaseMigration.controller");

const authMiddleWare = require("../middleware/auth.middleware");
const firebaseRegistrationMiddleware = require("../middleware/firebaseRegistration.middleware");

const router = express.Router();

// ============================================================
// MULTER
// ============================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ============================================================
// LEGACY EMAIL/PASSWORD AUTH
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
// FIREBASE MIGRATION
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
// Do NOT use the normal authMiddleWare here.
//
// The MongoDB user does not exist yet.
// The middleware only verifies Firebase.
//
// Firebase
//   ↓
// Registration Middleware
//   ↓
// Registration Controller
//   ↓
// MongoDB User.create()
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