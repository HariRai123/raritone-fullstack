const express = require("express");
const multer = require("multer");

const authController = require("../controllers/auth.controller");

const firebaseAuthController = require(
  "../controllers/firebaseAuth.controller"
);

const firebaseMigrationController = require(
  "../controllers/firebaseMigration.controller"
);

const authMiddleWare = require(
  "../middleware/auth.middleware"
);

const router = express.Router();

/* ============================================================
   MULTER
============================================================ */

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

/* ============================================================
   LEGACY AUTH
============================================================ */

router.post(
  "/register",
  upload.single("profileImage"),
  authController.registerUser,
);

router.post(
  "/login",
  authController.loginUser,
);

/* ============================================================
   LEGACY → FIREBASE MIGRATION
============================================================ */

router.post(
  "/migrate",
  firebaseMigrationController.migrateLegacyUser,
);

/* ============================================================
   FIREBASE AUTH
============================================================ */

/*
 * LOGIN
 *
 * Existing MongoDB user required.
 * Does NOT create a new user.
 */
router.post(
  "/sync",
  authMiddleWare,
  firebaseAuthController.syncFirebaseUser,
);

/*
 * SIGNUP
 *
 * Creates a new MongoDB user.
 */
router.post(
  "/register-firebase",
  authMiddleWare,
  firebaseAuthController.registerFirebaseUser,
);

/* ============================================================
   PROFILE
============================================================ */

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