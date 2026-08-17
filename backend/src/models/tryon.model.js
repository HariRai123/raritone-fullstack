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

    pose_result: {
      valid: {
        type: Boolean,
        default: false,
      },
      confidence: {
        type: Number,
        default: 0,
      },
      message: {
        type: String,
        default: "",
      },
    },

    body_measurements: {
      shoulder_ratio: {
        type: Number,
        default: null,
      },
      hip_ratio: {
        type: Number,
        default: null,
      },
      arm_ratio: {
        type: Number,
        default: null,
      },
      leg_ratio: {
        type: Number,
        default: null,
      },
    },

    person_detected: {
      type: Boolean,
      default: false,
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