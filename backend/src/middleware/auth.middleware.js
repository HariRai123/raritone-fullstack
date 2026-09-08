const { firebaseAuth } = require("../config/firebaseAdmin");

async function authMiddleWare(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authentication token is required",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid authentication format",
      });
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);

    req.user = {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email || null,
      phone: decodedToken.phone_number || null,
      name: decodedToken.name || null,
      profileImage: decodedToken.picture || null,
      provider:
        decodedToken.firebase?.sign_in_provider === "google.com"
          ? "google"
          : decodedToken.firebase?.sign_in_provider === "phone"
            ? "phone"
            : "password",
    };
    next();
  } catch (error) {
    console.error("Firebase authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired Firebase token",
    });
  }
}

module.exports = authMiddleWare;
