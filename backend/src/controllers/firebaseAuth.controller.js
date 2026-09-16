const User = require("../models/user.model");

// ============================================================
// SERIALIZE USER
// ============================================================

const serializeUser = (user) => ({
  id: user._id,

  firebaseUid: user.firebaseUid,

  name: user.name,

  email: user.email,

  phone: user.phone,

  profileImage: user.profileImage,

  role: user.role,

  provider: user.provider,

  isActive: user.isActive,

  createdAt: user.createdAt,

  updatedAt: user.updatedAt,
});

// ============================================================
// FIREBASE LOGIN SYNC
//
// Existing account ONLY
// ============================================================

const syncFirebaseUser = async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    console.log(
      "🔥 FIREBASE LOGIN SYNC",
    );

    console.log({
      firebaseUid,
      email,
      phone,
      name,
      provider,
    });

    if (!firebaseUid) {
      return res.status(400).json({
        message:
          "Firebase user ID is missing",
      });
    }

    // Find existing MongoDB user
    const user = await User.findOne({
      firebaseUid,
    });

    if (!user) {
      console.log(
        "❌ USER ACCOUNT NOT FOUND",
        firebaseUid,
      );

      return res.status(404).json({
        message:
          "User account not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been deactivated",
      });
    }

    // Update user information when available
    if (name) {
      user.name = name;
    }

    if (email) {
      user.email = email.toLowerCase();
    }

    if (phone) {
      user.phone = phone;
    }

    if (profileImage) {
      user.profileImage = profileImage;
    }

    if (provider) {
      user.provider = provider;
    }

    await user.save();

    console.log(
      "✅ USER LOGIN SYNC SUCCESS",
      user._id,
    );

    return res.status(200).json({
      message:
        "User synced successfully",

      user: serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Firebase login sync error:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to sync user",

      error: error.message,
    });
  }
};

// ============================================================
// FIREBASE REGISTRATION
//
// New account
// ============================================================

const registerFirebaseUser = async (
  req,
  res,
) => {
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    console.log(
      "🔥 REGISTER FIREBASE USER CONTROLLER HIT",
    );

    console.log({
      firebaseUid,
      email,
      phone,
      name,
      provider,
    });

    // --------------------------------------------------------
    // Validate Firebase UID
    // --------------------------------------------------------

    if (!firebaseUid) {
      return res.status(400).json({
        message:
          "Firebase user ID is missing",
      });
    }

    // --------------------------------------------------------
    // Email or phone required
    // --------------------------------------------------------

    if (!email && !phone) {
      return res.status(400).json({
        message:
          "Email or phone is required",
      });
    }

    // --------------------------------------------------------
    // Check Firebase UID
    // --------------------------------------------------------

    const existingFirebaseUser =
      await User.findOne({
        firebaseUid,
      });

    if (existingFirebaseUser) {
      return res.status(409).json({
        message:
          "An account already exists for this Firebase account. Please sign in instead.",
      });
    }

    // --------------------------------------------------------
    // Check email
    // --------------------------------------------------------

    if (email) {
      const cleanEmail =
        email.trim().toLowerCase();

      const existingEmailUser =
        await User.findOne({
          email: cleanEmail,
        });

      if (existingEmailUser) {
        return res.status(409).json({
          message:
            "An account already exists with this email address. Please sign in instead.",
        });
      }
    }

    // --------------------------------------------------------
    // Check phone
    // --------------------------------------------------------

    if (phone) {
      const cleanPhone =
        phone.trim();

      const existingPhoneUser =
        await User.findOne({
          phone: cleanPhone,
        });

      if (existingPhoneUser) {
        return res.status(409).json({
          message:
            "An account already exists with this phone number. Please sign in instead.",
        });
      }
    }

    // --------------------------------------------------------
    // Determine provider
    // --------------------------------------------------------

    let safeProvider =
      provider;

    if (!safeProvider) {
      safeProvider = phone
        ? "phone"
        : "password";
    }

    const allowedProviders = [
      "password",
      "google",
      "phone",
    ];

    if (
      !allowedProviders.includes(
        safeProvider,
      )
    ) {
      safeProvider = "password";
    }

    // --------------------------------------------------------
    // CREATE MONGODB USER
    // --------------------------------------------------------

    const user =
      await User.create({
        firebaseUid,

        name:
          name?.trim() ||
          "Raritone User",

        email:
          email?.trim().toLowerCase() ||
          undefined,

        phone:
          phone?.trim() ||
          undefined,

        profileImage:
          profileImage || "",

        provider:
          safeProvider,

        role: "user",

        isActive: true,
      });

    console.log(
      "✅ FIREBASE USER CREATED IN MONGODB",
      user._id,
    );

    return res.status(201).json({
      message:
        "User registered successfully",

      user: serializeUser(user),
    });
  } catch (error) {
    console.error(
      "Firebase registration error:",
      error,
    );

    // MongoDB duplicate key
    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "An account already exists with the provided information.",
      });
    }

    return res.status(500).json({
      message:
        "Failed to register Firebase user",

      error: error.message,
    });
  }
};

module.exports = {
  syncFirebaseUser,
  registerFirebaseUser,
};