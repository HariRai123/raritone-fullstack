const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const uploadFile = require("../services/storage.service");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ======================================================
// REGISTER USER - LEGACY
// ======================================================

async function registerUser(req, res) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered",
      });
    }

    // Upload profile image
    let profileImage = "";

    if (req.file) {
      const safeFileName = req.file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

      const imageResult = await uploadFile(
        req.file.buffer,
        `profile-${Date.now()}-${safeFileName}`
      );

      profileImage = imageResult.url;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      profileImage,

      // Public registration always creates a user
      role: "user",

      // This endpoint is legacy
      provider: "password",

      isActive: true,
    });

    return res.status(201).json({
      message: "User registered successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      message: "Failed to register the user",
      error: error.message,
    });
  }
}

// ======================================================
// LOGIN USER - LEGACY
// ======================================================

async function loginUser(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Legacy JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
}

// ======================================================
// GET PROFILE
// ======================================================

async function getProfile(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await User.findById(
      req.user.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
}

// ======================================================
// UPDATE PROFILE
// ======================================================

async function updateProfile(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Update name
    const name = req.body.name?.trim();

    if (name) {
      user.name = name;
    }

    // Update profile image
    if (req.file) {
      const safeFileName = req.file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      );

      const imageResult = await uploadFile(
        req.file.buffer,
        `profile-${user._id}-${Date.now()}-${safeFileName}`
      );

      user.profileImage = imageResult.url;
    }

    await user.save();

    const updatedUser = await User.findById(
      user._id
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
};