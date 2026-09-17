const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
      unique: true,
    },

    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    password: {
      type: String,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "vendor"],
      default: "user",
    },

    profileImage: {
      type: String,
      default: "",
    },

    provider: {
      type: String,
      enum: ["password", "google", "phone"],
      required: true,
    },

    profileCompleted: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "User",
  userSchema,
);