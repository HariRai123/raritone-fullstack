const admin = require("firebase-admin");

const firebaseOnlyMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const idToken = authHeader.replace("Bearer ", "").trim();

    if (!idToken) {
      return res.status(401).json({
        message: "Firebase ID token is required",
      });
    }

    const decodedToken = await admin
      .auth()
      .verifyIdToken(idToken);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error(
      "Firebase token verification failed:",
      error,
    );

    return res.status(401).json({
      message: "Invalid or expired Firebase token",
    });
  }
};

module.exports = firebaseOnlyMiddleware;