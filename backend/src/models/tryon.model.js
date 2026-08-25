const mongoose = require("mongoose");

const tryOnSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    image_reference: {
      type: String,
      required: true,
    },

    person_detected: {
      type: Boolean,
      default: false,
    },

    pose_result: {
      valid: {
        type: Boolean,
        default: false,
      },

      confidence: {
        type: Number,
        default: null,
      },

      message: {
        type: String,
        default: "",
      },
    },

    body_measurements: {
      shoulder_width_ratio: {
        type: Number,
        default: null,
      },

      hip_width_ratio: {
        type: Number,
        default: null,
      },

      left_arm_ratio: {
        type: Number,
        default: null,
      },

      right_arm_ratio: {
        type: Number,
        default: null,
      },

      left_leg_ratio: {
        type: Number,
        default: null,
      },

      right_leg_ratio: {
        type: Number,
        default: null,
      },

      torso_ratio: {
        type: Number,
        default: null,
      },

      shoulder_to_hip_ratio: {
        type: Number,
        default: null,
      },
    },

    processing_time: {
      type: Number,
      default: null,
    },

    model_version: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }

  
);

const TryOn = mongoose.model("TryOn", tryOnSchema);

module.exports = TryOn;