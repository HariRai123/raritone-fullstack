const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      enum: ["Women", "Men", "Kids", "Unisex"],
      index: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    subcategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);


productSchema.index({
  gender: 1,
  category: 1,
  subcategory: 1,
});

productSchema.index({
  isActive: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Product", productSchema);