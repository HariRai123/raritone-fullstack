const { getAuth } = require("firebase-admin/auth");

/*
  Firebase Registration Middleware

  Purpose:
  - Verify the Firebase ID token.
  - Extract Firebase user information.
  - DO NOT search MongoDB here.

  MongoDB user creation happens in:
  controllers/firebaseAuth.controller.js
*/

const firebaseRegistrationMiddleware = async (
  req,
  res,
  next,
) => {
  try {
    // --------------------------------------------------------
    // 1. Read Authorization header
    // --------------------------------------------------------

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message:
          "Authorization token is required",
      });
    }

    // --------------------------------------------------------
    // 2. Validate Bearer format
    // --------------------------------------------------------

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message:
          "Invalid authorization format",
      });
    }

    // --------------------------------------------------------
    // 3. Extract Firebase ID token
    // --------------------------------------------------------

    const idToken =
      authHeader.substring(7).trim();

    if (!idToken) {
      return res.status(401).json({
        message:
          "Firebase ID token is missing",
      });
    }

    // --------------------------------------------------------
    // 4. Verify Firebase token
    //
    // IMPORTANT:
    // Use getAuth() with the current firebase-admin API.
    // --------------------------------------------------------

    const decodedToken =
      await getAuth().verifyIdToken(
        idToken,
      );

    console.log(
      "🔥 FIREBASE REGISTRATION TOKEN VERIFIED",
    );

    console.log({
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      phone:
        decodedToken.phone_number || "",
      name: decodedToken.name || "",
      provider:
        decodedToken.firebase
          ?.sign_in_provider || "",
    });

    // --------------------------------------------------------
    // 5. Determine provider
    // --------------------------------------------------------

    const firebaseProvider =
      decodedToken.firebase
        ?.sign_in_provider;

    let provider = "password";

    if (
      firebaseProvider === "google.com"
    ) {
      provider = "google";
    } else if (
      firebaseProvider === "phone"
    ) {
      provider = "phone";
    }

    // --------------------------------------------------------
    // 6. Put Firebase user into req.user
    //
    // DO NOT query MongoDB.
    // The controller will create the user.
    // --------------------------------------------------------

    req.user = {
      firebaseUid:
        decodedToken.uid,

      email:
        decodedToken.email || "",

      phone:
        decodedToken.phone_number ||
        "",

      name:
        decodedToken.name || "",

      profileImage:
        decodedToken.picture || "",

      provider,
    };

    // --------------------------------------------------------
    // 7. Continue to controller
    // --------------------------------------------------------

    next();
  } catch (error) {
    console.error(
      "Firebase registration token verification failed:",
      error,
    );

    // --------------------------------------------------------
    // Invalid / expired token
    // --------------------------------------------------------

    if (
      error?.code ===
        "auth/id-token-expired"
    ) {
      return res.status(401).json({
        message:
          "Firebase authentication token has expired. Please sign in again.",
      });
    }

    if (
      error?.code ===
        "auth/id-token-revoked"
    ) {
      return res.status(401).json({
        message:
          "Firebase authentication token has been revoked. Please sign in again.",
      });
    }

    if (
      error?.code ===
        "auth/argument-error"
    ) {
      return res.status(401).json({
        message:
          "Invalid Firebase authentication token.",
      });
    }

    // --------------------------------------------------------
    // Generic authentication error
    // --------------------------------------------------------

    return res.status(401).json({
      message:
        "Firebase authentication failed.",
    });
  }
};

module.exports =
  firebaseRegistrationMiddleware;