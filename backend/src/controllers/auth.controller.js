const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const uploadFile = require("../services/storage.service");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerUser(req, res) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    let profileImage = "";

    if (req.file) {
      const imageResult = await uploadFile(
        req.file.buffer,
        `profile-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      );
      profileImage = imageResult.url;
    }

    // Role is intentionally not accepted from the client.
    // Every public registration starts as a normal user.
    const user = await User.create({
      name,
      email,
      password,
      profileImage,
      role: "user",
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
    console.error(error);
    return res.status(500).json({
      message: "Failed to register the user",
      error: error.message,
    });
  }
}

async function loginUser(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
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
    console.error(error);
    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
}

async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const name = req.body.name?.trim();

    if (name) user.name = name;

    if (req.file) {
      const imageResult = await uploadFile(
        req.file.buffer,
        `profile-${user._id}-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-")}`,
      );
      user.profileImage = imageResult.url;
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: await User.findById(user._id).select("-password"),
    });
  } catch (error) {
    console.error(error);
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
