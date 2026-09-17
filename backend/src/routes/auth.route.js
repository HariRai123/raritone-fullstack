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


/*
|--------------------------------------------------------------------------
| Legacy Authentication
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  upload.single("profileImage"),
  authController.registerUser,
);

router.post(
  "/login",
  authController.loginUser,
);

router.post(
  "/migrate",
  firebaseMigrationController.migrateLegacyUser,
);


/*
|--------------------------------------------------------------------------
| Firebase Authentication
|--------------------------------------------------------------------------
*/

/*
 * Existing Firebase user login
 */
router.post(
  "/sync",
  authMiddleWare,
  firebaseAuthController.syncFirebaseUser,
);


/*
 * New Firebase user registration
 */
router.post(
  "/register-firebase",
  firebaseRegistrationMiddleware,
  firebaseAuthController.registerFirebaseUser,
);


/*
|--------------------------------------------------------------------------
| Profile
|--------------------------------------------------------------------------
*/

/*
 * Get authenticated profile
 */
router.get(
  "/profile",
  authMiddleWare,
  authController.getProfile,
);


/*
 * Update authenticated Firebase profile
 */
router.put(
  "/profile",
  authMiddleWare,
  upload.single("profileImage"),
  firebaseAuthController.updateFirebaseProfile
);

module.exports = router;