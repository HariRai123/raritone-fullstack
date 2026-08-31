const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const handleThreeDAssetUpload = require("../middleware/threeDAssetUpload.middleware");

const {
  createThreeDAsset,
  getThreeDAssetById,
  getProductThreeDAsset,
  reviewThreeDAsset,
  getAllThreeDAssets,
} = require("../controllers/threeDAsset.controller");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  handleThreeDAssetUpload,
  createThreeDAsset,
);

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin", "reviewer"),
  getAllThreeDAssets,
);

router.get(
  "/products/:productId/3d",
  getProductThreeDAsset,
);

router.put(
  "/:id/review",
  authMiddleware,
  authorizeRoles("admin", "reviewer"),
  reviewThreeDAsset,
);

router.get(
  "/:id",
  authMiddleware,
  getThreeDAssetById,
);

module.exports = router;