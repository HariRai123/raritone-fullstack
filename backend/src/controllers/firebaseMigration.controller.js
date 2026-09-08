const bcrypt = require("bcryptjs");

const {
  firebaseAuth,
} = require("../config/firebaseAdmin");

const User = require("../models/user.model");

const migrateLegacyUser = async (req, res) => {
  try {
    const email = req.body.email
      ?.trim()
      .toLowerCase();

    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find the existing MongoDB user.
    // password has select:false in the schema,
    // so we explicitly include it.
    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        message:
          "This account does not require legacy password migration",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message:
          "Your account has been deactivated",
      });
    }

    // Verify old bcrypt password.
    const passwordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Already migrated
    if (user.firebaseUid) {
      const customToken =
        await firebaseAuth.createCustomToken(
          user.firebaseUid,
          {
            role: user.role,
          },
        );

      return res.status(200).json({
        message: "Account already migrated",
        customToken,
      });
    }

    let firebaseUser;

    try {
      firebaseUser =
        await firebaseAuth.getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    // Firebase account doesn't exist.
    if (!firebaseUser) {
      firebaseUser =
        await firebaseAuth.createUser({
          email,
          password,
          displayName: user.name,
          photoURL:
            user.profileImage || undefined,
        });
    } else {
      // Firebase account already exists.
      // Update the password so the old password
      // continues to work.
      firebaseUser =
        await firebaseAuth.updateUser(
          firebaseUser.uid,
          {
            password,
            displayName: user.name,
            photoURL:
              user.profileImage || undefined,
          },
        );
    }

    // Link Firebase identity to existing MongoDB user.
    user.firebaseUid = firebaseUser.uid;
    user.provider = "password";

    await user.save();

    // Create Firebase custom token.
    const customToken =
      await firebaseAuth.createCustomToken(
        firebaseUser.uid,
        {
          role: user.role,
        },
      );

    return res.status(200).json({
      message: "Account migrated successfully",
      customToken,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error(
      "Legacy user migration error:",
      error,
    );

    return res.status(500).json({
      message: "Failed to migrate account",
    });
  }
};

module.exports = {
  migrateLegacyUser,
};