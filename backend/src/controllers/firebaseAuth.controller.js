const User = require("../models/user.model");

const syncFirebaseUser = async (req, res) => {
  try {
    const {
      firebaseUid,
      email,
      phone,
      name,
      profileImage,
      provider,
    } = req.user;

    // Firebase UID is required
    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase user ID is missing",
      });
    }

    // --------------------------------------------------
    // Find existing MongoDB user
    // --------------------------------------------------
    let user = await User.findOne({
      firebaseUid,
    });

    // --------------------------------------------------
    // Existing user
    // --------------------------------------------------
    if (user) {
      // Check account status
      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account has been deactivated",
        });
      }

      // Update information received from Firebase
      user.name = name || user.name;

      user.email = email || user.email;

      user.phone = phone || user.phone;

      user.profileImage =
        profileImage || user.profileImage;

      if (provider) {
        user.provider = provider;
      }

      // IMPORTANT:
      // Do not update role here.
      //
      // Role must remain controlled by the database/admin.
      // Never accept role from Firebase/mobile client.

      await user.save();

      return res.status(200).json({
        message: "User synced successfully",
        user: {
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
        },
      });
    }

    // --------------------------------------------------
    // Create new MongoDB user
    // --------------------------------------------------
    user = await User.create({
      firebaseUid,

      name: name || "Raritone User",

      email: email || undefined,

      phone: phone || undefined,

      profileImage: profileImage || "",

      provider:
        provider || (phone ? "phone" : "password"),

      // New users always start as normal users
      role: "user",

      isActive: true,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
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
      },
    });
  } catch (error) {
    console.error("Firebase user sync error:", error);

    return res.status(500).json({
      message: "Failed to sync user",
      error: error.message,
    });
  }
};

module.exports = {
  syncFirebaseUser,
};