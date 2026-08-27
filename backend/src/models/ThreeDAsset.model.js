const mongoose = require("mongoose");

const threeDAssetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assetUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      default: null,
    },

    format: {
      type: String,
      enum: ["glb", "gltf"],
      required: true,
    },

    polygonCount: {
      type: Number,
      default: null,
      min: 0,
    },

    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },

    modelVersion: {
      type: String,
      default: "3d-v1",
    },

    status: {
      type: String,
      enum: [
        "generated",
        "validating",
        "pending_review",
        "approved",
        "rejected",
      ],
      default: "generated",
      index: true,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "threeDAssets",
  },
);

module.exports = mongoose.model("ThreeDAsset", threeDAssetSchema);