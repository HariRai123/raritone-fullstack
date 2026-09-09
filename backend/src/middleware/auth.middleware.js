const { firebaseAuth } = require("../config/firebaseAdmin");
const User = require("../models/user.model");

async function authMiddleWare(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // --------------------------------------------------
    // 1. Check Authorization header
    // --------------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    // Expected:
    // Authorization: Bearer <firebase-id-token>

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid authentication format",
      });
    }

    // --------------------------------------------------
    // 2. Verify Firebase ID token
    // --------------------------------------------------

    const decodedToken =
      await firebaseAuth.verifyIdToken(token);

    console.log("FIREBASE TOKEN VERIFIED:", {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      provider:
        decodedToken.firebase?.sign_in_provider || null,
    });

    // --------------------------------------------------
    // 3. Find MongoDB user
    // --------------------------------------------------

    const user = await User.findOne({
      firebaseUid: decodedToken.uid,
    }).select(
      "_id firebaseUid name email phone role profileImage isActive"
    );

    if (!user) {
      console.error(
        "FIREBASE USER NOT FOUND IN MONGODB:",
        decodedToken.uid
      );

      return res.status(404).json({
        message: "User account not found",
      });
    }

    // --------------------------------------------------
    // 4. Check account status
    // --------------------------------------------------

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    // --------------------------------------------------
    // 5. Attach user to request
    // --------------------------------------------------

    req.user = {
      id: user._id.toString(),

      firebaseUid: user.firebaseUid,

      name: user.name,

      email:
        user.email ||
        decodedToken.email ||
        null,

      phone:
        user.phone ||
        decodedToken.phone_number ||
        null,

      profileImage:
        user.profileImage ||
        decodedToken.picture ||
        null,

      // IMPORTANT:
      // Role always comes from MongoDB.
      role: user.role,

      provider:
        decodedToken.firebase?.sign_in_provider ===
        "google.com"
          ? "google"
          : decodedToken.firebase?.sign_in_provider ===
              "phone"
            ? "phone"
            : "password",
    };

    // --------------------------------------------------
    // 6. Debug log
    // --------------------------------------------------

    console.log("FIREBASE AUTH SUCCESS:", {
      firebaseUid: req.user.firebaseUid,
      mongoUserId: req.user.id,
      email: req.user.email,
      role: req.user.role,
    });

    next();
  } catch (error) {
    console.error(
      "========== FIREBASE AUTH ERROR =========="
    );

    console.error("Code:", error.code);
    console.error("Message:", error.message);

    console.error(
      "========================================="
    );

    return res.status(401).json({
      message: "Invalid or expired Firebase token",
      code: error.code || "unknown",
    });
  }
}

module.exports = authMiddleWare;