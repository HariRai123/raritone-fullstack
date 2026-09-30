const { getAuth } = require("firebase-admin/auth");


const firebaseRegistrationMiddleware = async (
  req,
  res,
  next,
) => {
  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message:
          "Authorization token is required",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message:
          "Invalid authorization format",
      });
    }


    const idToken =
      authHeader.substring(7).trim();

    if (!idToken) {
      return res.status(401).json({
        message:
          "Firebase ID token is missing",
      });
    }


    const decodedToken =
      await getAuth().verifyIdToken(
        idToken,
      );

    console.log(
      " FIREBASE REGISTRATION TOKEN VERIFIED",
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


    next();
  } catch (error) {
    console.error(
      "Firebase registration token verification failed:",
      error,
    );

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

    return res.status(401).json({
      message:
        "Firebase authentication failed.",
    });
  }
};

module.exports =
  firebaseRegistrationMiddleware;