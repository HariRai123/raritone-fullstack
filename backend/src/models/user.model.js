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

    // Temporary field for existing users during migration.
    // Firebase will handle passwords for new authentication.
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

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;