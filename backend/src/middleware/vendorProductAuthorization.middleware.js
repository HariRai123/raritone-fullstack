const mongoose = require("mongoose");

const Product = require("../models/products.model");

async function authorizeVendorProduct(req, res, next) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
    }

    const role = String(req.user.role || "").toLowerCase();

    // Admins/reviewers don't need vendor ownership validation.
    if (role === "admin" || role === "reviewer") {
      return next();
    }

    if (role !== "vendor") {
      return res.status(403).json({
        success: false,
        error: {
          code: "VENDOR_ACCESS_REQUIRED",
          message: "Only vendors can manage 3D assets.",
        },
      });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "PRODUCT_ID_REQUIRED",
          message: "Product ID is required.",
        },
      });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PRODUCT_ID",
          message: "Invalid product ID.",
        },
      });
    }

    const product = await Product.findById(productId)
      .select("_id vendorId")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Product not found.",
        },
      });
    }

    if (
      !product.vendorId ||
      String(product.vendorId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: {
          code: "VENDOR_PRODUCT_FORBIDDEN",
          message:
            "You are not authorized to manage 3D assets for this product.",
        },
      });
    }

    next();
  } catch (error) {
    console.error(
      "VENDOR PRODUCT AUTHORIZATION ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      error: {
        code: "AUTHORIZATION_FAILED",
        message: "Unable to verify vendor authorization.",
      },
    });
  }
}

module.exports = authorizeVendorProduct;