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

    if (!firebaseUid) {
      return res.status(400).json({
        message: "Firebase user ID is missing",
      });
    }

    let user = await User.findOne({ firebaseUid });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({
          message: "Your account has been deactivated",
        });
      }

      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.profileImage = profileImage || user.profileImage;

      if (provider) {
        user.provider = provider;
      }

      await user.save();

      return res.status(200).json({
        message: "User synced successfully",
        user: user.toObject(),
      });
    }

    user = await User.create({
      firebaseUid,

      name: name || "Raritone User",

      email: email || undefined,

      phone: phone || undefined,

      profileImage: profileImage || "",

      provider: provider || (phone ? "phone" : "password"),

      role: "user",

      isActive: true,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: user.toObject(),
    });
  } catch (error) {
    console.error("Firebase user sync error:", error);

    return res.status(500).json({
      message: "Failed to sync user",
    });
  }
};

module.exports = {
  syncFirebaseUser,
};