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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Legacy routes
router.post(
  "/register",
  upload.single("profileImage"),
  authController.registerUser
);

router.post(
  "/login",
  authController.loginUser
);

// Legacy account → Firebase migration
router.post(
  "/migrate",
  firebaseMigrationController.migrateLegacyUser
);

// Firebase → MongoDB synchronization
router.post(
  "/sync",
  authMiddleWare,
  firebaseAuthController.syncFirebaseUser
);

// Protected profile routes
router.get(
  "/profile",
  authMiddleWare,
  authController.getProfile
);

router.put(
  "/profile",
  authMiddleWare,
  upload.single("profileImage"),
  authController.updateProfile
);

module.exports = router;