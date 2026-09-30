const mongoose = require("mongoose");

const threeDAssetSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      unique: true,
      required: true,
      index: true,
      trim: true,
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
      default: null,
      index: true,
    },

    assetUrl: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      default: null,
      trim: true,
    },

    format: {
      type: String,
      enum: ["glb", "gltf"],
      required: true,
      lowercase: true,
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
      trim: true,
    },

    source: {
      type: String,
      enum: [
        "ai_ml",
        "manual",
        "uploaded",
        "licensed",
        "generated",
      ],
      default: "ai_ml",
      trim: true,
    },

    license: {
      type: String,
      default: "",
      trim: true,
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
      trim: true,
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

/*
 * Useful indexes
 */

// Quickly find 3D assets for a product.
threeDAssetSchema.index({
  productId: 1,
  status: 1,
});

// Quickly find vendor assets.
threeDAssetSchema.index({
  vendorId: 1,
  createdAt: -1,
});

// Quickly find approved assets.
threeDAssetSchema.index({
  status: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "ThreeDAsset",
  threeDAssetSchema,
);