const mongoose = require("mongoose");

const TryOnSession = require("../models/tryOnSession.model");
const ThreeDAsset = require("../models/ThreeDAsset.model");
const Product = require("../models/products.model");

function errorResponse(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

async function createThreeDTryOnSession(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const { productId, threeDAssetId } = req.body;

    if (!productId) {
      return errorResponse(
        res,
        400,
        "PRODUCT_ID_REQUIRED",
        "Product ID is required.",
      );
    }

    if (!threeDAssetId) {
      return errorResponse(
        res,
        400,
        "THREED_ASSET_ID_REQUIRED",
        "3D asset ID is required.",
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

    if (!mongoose.isValidObjectId(threeDAssetId)) {
      return errorResponse(
        res,
        400,
        "INVALID_THREED_ASSET_ID",
        "Invalid 3D asset ID.",
      );
    }

    const product = await Product.findById(productId)
      .select("_id name brand image price category")
      .lean();

    if (!product) {
      return errorResponse(
        res,
        404,
        "PRODUCT_NOT_FOUND",
        "Product not found.",
      );
    }

    const asset = await ThreeDAsset.findById(threeDAssetId)
      .select(
        "_id assetId productId assetUrl format polygonCount fileSize modelVersion status",
      )
      .lean();

    if (!asset) {
      return errorResponse(
        res,
        404,
        "THREED_ASSET_NOT_FOUND",
        "3D asset not found.",
      );
    }

    if (String(asset.productId) !== String(productId)) {
      return errorResponse(
        res,
        400,
        "ASSET_PRODUCT_MISMATCH",
        "The selected 3D asset does not belong to this product.",
      );
    }

    if (asset.status !== "approved") {
      return errorResponse(
        res,
        403,
        "THREED_ASSET_NOT_APPROVED",
        "This 3D asset is not available for try-on.",
      );
    }

    const session = await TryOnSession.create({
      userId: req.user.id,
      productId,
      threeDAssetId: asset._id,
      status: "pending",
      threeDModelVersion: asset.modelVersion || "3d-v1",
      message: "3D try-on session created.",
    });

    const populatedSession = await TryOnSession.findById(
      session._id,
    )
      .populate(
        "productId",
        "name brand image price category",
      )
      .populate(
        "threeDAssetId",
        "assetId assetUrl format polygonCount fileSize modelVersion status",
      )
      .lean();

    return res.status(201).json({
      success: true,
      message: "3D try-on session created successfully.",
      session: populatedSession,
    });
  } catch (error) {
    console.error(
      "CREATE 3D TRY-ON SESSION ERROR:",
      error,
    );

    return errorResponse(
      res,
      500,
      "THREED_TRYON_SESSION_FAILED",
      "Unable to create 3D try-on session.",
    );
  }
}

async function getThreeDTryOnSession(req, res) {
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

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(
        res,
        400,
        "INVALID_SESSION_ID",
        "Invalid 3D try-on session ID.",
      );
    }

    const session = await TryOnSession.findById(id)
      .populate(
        "productId",
        "name brand image price category",
      )
      .populate(
        "threeDAssetId",
        "assetId assetUrl format polygonCount fileSize modelVersion status",
      )
      .lean();

    if (!session) {
      return errorResponse(
        res,
        404,
        "SESSION_NOT_FOUND",
        "3D try-on session not found.",
      );
    }

    const isOwner =
      String(session.userId) === String(req.user.id);

    const isAdmin =
      String(req.user.role || "").toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse(
        res,
        403,
        "FORBIDDEN",
        "You are not authorized to access this session.",
      );
    }

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error(
      "GET 3D TRY-ON SESSION ERROR:",
      error,
    );

    return errorResponse(
      res,
      500,
      "SESSION_FETCH_FAILED",
      "Unable to fetch 3D try-on session.",
    );
  }
}

async function updateThreeDBodyData(req, res) {
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

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(
        res,
        400,
        "INVALID_SESSION_ID",
        "Invalid 3D try-on session ID.",
      );
    }

    const session = await TryOnSession.findById(id);

    if (!session) {
      return errorResponse(
        res,
        404,
        "SESSION_NOT_FOUND",
        "3D try-on session not found.",
      );
    }

    const isOwner =
      String(session.userId) === String(req.user.id);

    const isAdmin =
      String(req.user.role || "").toLowerCase() === "admin";

    if (!isOwner && !isAdmin) {
      return errorResponse(
        res,
        403,
        "FORBIDDEN",
        "You are not authorized to update this session.",
      );
    }

    const {
      avatarData,
      poseData,
      bodyData,
    } = req.body;

    if (
      avatarData !== undefined &&
      (typeof avatarData !== "object" ||
        avatarData === null)
    ) {
      return errorResponse(
        res,
        400,
        "INVALID_AVATAR_DATA",
        "Avatar data must be an object.",
      );
    }

    if (
      poseData !== undefined &&
      (typeof poseData !== "object" ||
        poseData === null)
    ) {
      return errorResponse(
        res,
        400,
        "INVALID_POSE_DATA",
        "Pose data must be an object.",
      );
    }

    if (
      bodyData !== undefined &&
      (typeof bodyData !== "object" ||
        bodyData === null)
    ) {
      return errorResponse(
        res,
        400,
        "INVALID_BODY_DATA",
        "Body data must be an object.",
      );
    }

    if (avatarData !== undefined) {
      session.avatarData = avatarData;
    }

    if (poseData !== undefined) {
      session.threeDPoseData = poseData;
    }

    if (bodyData !== undefined) {
      session.threeDBodyData = bodyData;
    }

    session.message = "3D body data updated.";

    await session.save();

    const updatedSession = await TryOnSession.findById(
      session._id,
    )
      .populate(
        "productId",
        "name brand image price category",
      )
      .populate(
        "threeDAssetId",
        "assetId assetUrl format polygonCount fileSize modelVersion status",
      )
      .lean();

    return res.status(200).json({
      success: true,
      message: "3D body data updated successfully.",
      session: updatedSession,
    });
  } catch (error) {
    console.error(
      "UPDATE 3D BODY DATA ERROR:",
      error,
    );

    return errorResponse(
      res,
      500,
      "BODY_DATA_UPDATE_FAILED",
      "Unable to update 3D body data.",
    );
  }
}

module.exports = {
  createThreeDTryOnSession,
  getThreeDTryOnSession,
  updateThreeDBodyData,
};