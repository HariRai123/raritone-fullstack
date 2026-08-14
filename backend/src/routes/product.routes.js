const express= require("express");
const router =express.Router();
const multer = require("multer");
const { postProducts, getProducts, getProductById, updateProduct, deleteProduct } = require("../controllers/product.controller");
const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
router.post("/products",authMiddleWare,authorizeRoles("admin"),upload.single("image"),postProducts)
router.get("/products",getProducts)
router.get("/products/:id",getProductById)
router.put("/products/:id",authMiddleWare,authorizeRoles("admin"),upload.single("image"),updateProduct);
router.delete("/products/:id",authMiddleWare,authorizeRoles("admin"),deleteProduct)
module.exports=router