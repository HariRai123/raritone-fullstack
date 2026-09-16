const admin = require("firebase-admin");

/*
  This middleware is ONLY for Firebase registration.

  IMPORTANT:
  It verifies the Firebase ID token,
  but it does NOT search MongoDB.

  This is necessary because the user is
  supposed to be created in MongoDB after
  Firebase authentication succeeds.
*/

const firebaseRegistrationMiddleware = async (
  req,
  res,
  next,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];

    if (!idToken) {
      return res.status(401).json({
        message: "Firebase ID token is missing",
      });
    }

    // Verify Firebase ID token
    const decodedToken =
      await admin.auth().verifyIdToken(idToken);

    console.log("🔥 FIREBASE REGISTRATION TOKEN VERIFIED");

    console.log({
      uid: decodedToken.uid,
      email: decodedToken.email,
      phone: decodedToken.phone_number,
      name: decodedToken.name,
      provider:
        decodedToken.firebase?.sign_in_provider,
    });

    /*
      We intentionally DO NOT query MongoDB here.

      The controller will create the MongoDB
      user after checking for duplicates.
    */

    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || "",
      phone: decodedToken.phone_number || "",
      name: decodedToken.name || "",
      profileImage: decodedToken.picture || "",
      provider:
        decodedToken.firebase?.sign_in_provider ===
        "google.com"
          ? "google"
          : decodedToken.firebase?.sign_in_provider ===
              "phone"
            ? "phone"
            : "password",
    };

    next();
  } catch (error) {
    console.error(
      "Firebase registration token verification failed:",
      error,
    );

    if (
      error?.code ===
        "auth/id-token-expired" ||
      error?.code ===
        "auth/id-token-revoked"
    ) {
      return res.status(401).json({
        message:
          "Firebase authentication token has expired. Please sign in again.",
      });
    }

    if (
      error?.code ===
      "auth/argument-error"
    ) {
      return res.status(401).json({
        message: "Invalid Firebase authentication token.",
      });
    }

    return res.status(401).json({
      message:
        "Firebase authentication failed.",
    });
  }
};

module.exports =
  firebaseRegistrationMiddleware;