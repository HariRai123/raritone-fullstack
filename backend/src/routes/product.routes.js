const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  postProducts,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct,
} = require("../controllers/product.controller");

const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/products",
  authMiddleWare,
  authorizeRoles("admin", "vendor"),
  upload.single("image"),
  postProducts
);

router.get(
  "/products",
  getProducts
);

router.get(
  "/admin/products",
  authMiddleWare,
  authorizeRoles("admin"),
  getAdminProducts
);

router.get(
  "/products/:id",
  getProductById
);

router.put(
  "/products/:id",
  authMiddleWare,
  authorizeRoles("admin"),
  upload.single("image"),
  updateProduct
);

router.patch(
  "/products/:id/archive",
  authMiddleWare,
  authorizeRoles("admin"),
  archiveProduct
);

router.patch(
  "/products/:id/restore",
  authMiddleWare,
  authorizeRoles("admin"),
  restoreProduct
);

router.delete(
  "/products/:id",
  authMiddleWare,
  authorizeRoles("admin"),
  deleteProduct
);

module.exports = router;