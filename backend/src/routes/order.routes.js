const express = require("express");
const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(authMiddleWare);
router.post("/orders", createOrder);
router.get("/orders", getMyOrders);
router.get("/admin/orders", authorizeRoles("admin"), getAllOrders);
router.patch("/admin/orders/:id", authorizeRoles("admin"), updateOrderStatus);

module.exports = router;
