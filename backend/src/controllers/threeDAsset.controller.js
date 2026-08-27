const crypto = require("crypto");
const mongoose = require("mongoose");

const ThreeDAsset = require("../models/ThreeDAsset.model");
const Product = require("../models/products.model");
const uploadFile = require("../services/storage.service");

const {
  validateThreeDAsset,
  getAssetFormat,
} = require("../services/threeDAssetService");

function errorResponse(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function generateAssetId() {
  return `3D-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

async function createThreeDAsset(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    if (!req.file) {
      return errorResponse(
        res,
        400,
        "ASSET_REQUIRED",
        "3D asset file is required.",
      );
    }
    if (req.file.size > 25 * 1024 * 1024) {
      return errorResponse(
        res,
        400,
        "ASSET_TOO_LARGE",
        "3D asset size must be 25 MB or smaller.",
      );
    }
    const { productId, modelVersion } = req.body;

    if (!productId) {
      return errorResponse(
        res,
        400,
        "PRODUCT_ID_REQUIRED",
        "Product ID is required.",
      );
    }

    if (!mongoose.isValidObjectId(productId)) {
      return errorResponse(
        res,
        400,
        "INVALID_PRODUCT_ID",
        "Invalid product ID.",
      );
    }

    const product = await Product.findById(productId)
      .select("_id name brand image price category")
      .lean();

    if (!product) {
      return errorResponse(res, 404, "PRODUCT_NOT_FOUND", "Product not found.");
    }

    const format = getAssetFormat(req.file.originalname);

    if (!format) {
      return errorResponse(
        res,
        400,
        "INVALID_3D_FORMAT",
        "Only GLB and GLTF files are supported.",
      );
    }

    const validation = await validateThreeDAsset(req.file.buffer, format);

    if (!validation.valid) {
      return errorResponse(
        res,
        400,
        "INVALID_3D_ASSET",
        "The uploaded 3D asset is invalid.",
      );
    }

    const assetId = generateAssetId();

    const uploadResult = await uploadFile(
      req.file.buffer,
      `3d-assets/${assetId}.${format}`,
    );

    if (!uploadResult?.url) {
      return errorResponse(
        res,
        502,
        "ASSET_STORAGE_FAILED",
        "Unable to store the 3D asset.",
      );
    }

    const asset = await ThreeDAsset.create({
      assetId,
      productId,
      vendorId: req.user.id,
      assetUrl: uploadResult.url,
      format,
      polygonCount: validation.polygonCount,
      fileSize: req.file.size,
      modelVersion: modelVersion || "3d-v1",
      status: "pending_review",
      generatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "3D asset uploaded successfully and is pending review.",
      asset,
    });
  } catch (error) {
    console.error("CREATE 3D ASSET ERROR:", error);

    return errorResponse(
      res,
      500,
      "ASSET_UPLOAD_FAILED",
      "Unable to upload 3D asset.",
    );
  }
}

async function getThreeDAssetById(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const { id } = req.params;

    const query = mongoose.isValidObjectId(id) ? { _id: id } : { assetId: id };

    const isPrivileged = ["admin", "reviewer"].includes(
      String(req.user.role || "").toLowerCase(),
    );

    if (!isPrivileged) {
      query.status = "approved";
    }

    const asset = await ThreeDAsset.findOne(query)
      .populate("productId", "name brand image price category")
      .populate("vendorId", "name email")
      .populate("reviewedBy", "name email")
      .lean();

    if (!asset) {
      return errorResponse(res, 404, "ASSET_NOT_FOUND", "3D asset not found.");
    }

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("GET 3D ASSET ERROR:", error);

    return errorResponse(
      res,
      500,
      "ASSET_FETCH_FAILED",
      "Unable to fetch 3D asset.",
    );
  }
}

async function getProductThreeDAsset(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return errorResponse(
        res,
        400,
        "INVALID_PRODUCT_ID",
        "Invalid product ID.",
      );
    }

    const asset = await ThreeDAsset.findOne({
      productId,
      status: "approved",
    })
      .populate("productId", "name brand image price category")
      .lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: "THREED_ASSET_NOT_AVAILABLE",
          message: "No approved 3D asset is available for this product.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("GET PRODUCT 3D ASSET ERROR:", error);

    return errorResponse(
      res,
      500,
      "ASSET_FETCH_FAILED",
      "Unable to fetch product 3D asset.",
    );
  }
}

async function reviewThreeDAsset(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return errorResponse(
        res,
        400,
        "INVALID_REVIEW_STATUS",
        "Review status must be approved or rejected.",
      );
    }

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(
        res,
        400,
        "INVALID_ASSET_ID",
        "Invalid 3D asset ID.",
      );
    }

    const asset = await ThreeDAsset.findById(id);

    if (!asset) {
      return errorResponse(res, 404, "ASSET_NOT_FOUND", "3D asset not found.");
    }

    if (asset.status !== "pending_review") {
      return errorResponse(
        res,
        409,
        "ASSET_ALREADY_REVIEWED",
        "This 3D asset is not pending review.",
      );
    }

    if (status === "rejected" && !String(reason || "").trim()) {
      return errorResponse(
        res,
        400,
        "REJECTION_REASON_REQUIRED",
        "A rejection reason is required.",
      );
    }

    asset.status = status;
    asset.rejectionReason = status === "rejected" ? String(reason).trim() : "";
    asset.reviewedAt = new Date();
    asset.reviewedBy = req.user.id;

    await asset.save();

    return res.status(200).json({
      success: true,
      message:
        status === "approved"
          ? "3D asset approved successfully."
          : "3D asset rejected successfully.",
      asset,
    });
  } catch (error) {
    console.error("REVIEW 3D ASSET ERROR:", error);

    return errorResponse(
      res,
      500,
      "ASSET_REVIEW_FAILED",
      "Unable to review 3D asset.",
    );
  }
}

async function getAllThreeDAssets(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const assets = await ThreeDAsset.find({})
      .populate("productId", "name brand image price category")
      .populate("vendorId", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      assets,
    });
  } catch (error) {
    console.error("GET ALL 3D ASSETS ERROR:", error);

    return errorResponse(
      res,
      500,
      "ASSET_LIST_FAILED",
      "Unable to fetch 3D assets.",
    );
  }
}

module.exports = {
  createThreeDAsset,
  getThreeDAssetById,
  getProductThreeDAsset,
  reviewThreeDAsset,
  getAllThreeDAssets,
};
