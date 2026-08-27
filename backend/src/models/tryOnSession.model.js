const mongoose = require("mongoose");

const tryOnSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    inputImageReference: { type: String, default:null},
    resultImageReference: { type: String, default: null },
    aiModelVersion: { type: String, default: "pose-v1" },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    errorCode: {
      type: String,
      default: null,
    },
    processingTime: { type: Number, default: null },
    personDetected: { type: Boolean, default: false },
    poseResult: { type: mongoose.Schema.Types.Mixed, default: {} },
    bodyMeasurements: { type: mongoose.Schema.Types.Mixed, default: {} },
    message: { type: String, default: "" },
    errorMessage: { type: String, default: "" },
    threeDAssetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ThreeDAsset",
      default: null,
      index: true,
    },

    avatarData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    threeDPoseData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    threeDBodyData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    threeDResultReference: {
      type: String,
      default: null,
    },

    threeDModelVersion: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, collection: "tryOnSessions" },
);

module.exports = mongoose.model("TryOnSession", tryOnSessionSchema);
