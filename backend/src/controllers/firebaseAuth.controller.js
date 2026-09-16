const User = require("../models/user.model");

/* ============================================================
   RESPONSE HELPER
============================================================ */

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

/* ============================================================
   FIREBASE LOGIN / SYNC
   EXISTING MONGODB ACCOUNT ONLY
============================================================ */

const syncFirebaseUser = async (req, res) => {
  console.log("🔥 SYNC ROUTE HIT");
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase user ID is missing",
      });
    }

    /* --------------------------------------------------------
       Find existing MongoDB account
    -------------------------------------------------------- */

    const user = await User.findOne({
      firebaseUid,
    });

    /* --------------------------------------------------------
       Account does not exist
       IMPORTANT:
       Login must NOT create an account.
    -------------------------------------------------------- */

    if (!user) {
      return res.status(404).json({
        message: "User account not found",
      });
    }

    /* --------------------------------------------------------
       Check account status
    -------------------------------------------------------- */

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    /* --------------------------------------------------------
       Update safe Firebase profile information
       -------------------------------------------------------- */

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

    /*
     * NEVER modify role from Firebase/mobile.
     */

    await user.save();

    return res.status(200).json({
      message: "User synced successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Firebase login sync error:", error);

    return res.status(500).json({
      message: "Failed to sync user",
      error: error.message,
    });
  }
};

/* ============================================================
   FIREBASE REGISTRATION
   CREATE NEW MONGODB ACCOUNT
============================================================ */

const registerFirebaseUser = async (req, res) => {
  console.log("🔥 REGISTER-FIREBASE ROUTE HIT");
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user || {};

    /* --------------------------------------------------------
       Basic validation
    -------------------------------------------------------- */

    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase user ID is missing",
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required",
      });
    }

    /* --------------------------------------------------------
       Check Firebase UID
    -------------------------------------------------------- */

    const existingFirebaseUser = await User.findOne({
      firebaseUid,
    });

    if (existingFirebaseUser) {
      return res.status(409).json({
        message:
          "An account already exists for this Firebase account. Please sign in instead.",
      });
    }

    /* --------------------------------------------------------
       Check email
       -------------------------------------------------------- */

    let existingEmailUser = null;

    if (email) {
      existingEmailUser = await User.findOne({
        email: email.toLowerCase(),
      });
    }

    if (existingEmailUser) {
      return res.status(409).json({
        message:
          "An account already exists with this email address. Please sign in instead.",
      });
    }

    /* --------------------------------------------------------
       Check phone
       -------------------------------------------------------- */

    let existingPhoneUser = null;

    if (phone) {
      existingPhoneUser = await User.findOne({
        phone,
      });
    }

    if (existingPhoneUser) {
      return res.status(409).json({
        message:
          "An account already exists with this phone number. Please sign in instead.",
      });
    }

    /* --------------------------------------------------------
       Determine safe provider
       -------------------------------------------------------- */

    let safeProvider = provider;

    if (!safeProvider) {
      if (phone) {
        safeProvider = "phone";
      } else {
        safeProvider = "password";
      }
    }

    const allowedProviders = [
      "password",
      "google",
      "phone",
    ];

    if (!allowedProviders.includes(safeProvider)) {
      safeProvider = "password";
    }

    /* --------------------------------------------------------
       Create MongoDB user
       -------------------------------------------------------- */

    const user = await User.create({
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

      provider: safeProvider,

      /*
       * New registrations are always normal users.
       */
      role: "user",

      isActive: true,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("Firebase registration error:", error);

    /* --------------------------------------------------------
       Mongo duplicate key protection
    -------------------------------------------------------- */

    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "An account already exists with the provided information.",
      });
    }

    return res.status(500).json({
      message: "Failed to register Firebase user",
      error: error.message,
    });
  }
};

module.exports = {
  syncFirebaseUser,
  registerFirebaseUser,
};