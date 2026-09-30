const express = require("express");

const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
   cancelMyOrder
} = require("../controllers/order.controller");

const router = express.Router();

router.use(authMiddleWare);

router.post("/orders", createOrder);

router.get("/orders", getMyOrders);

router.get("/orders/:id", getMyOrderById);


router.get(
  "/admin/orders",
  authorizeRoles("admin"),
  getAllOrders
);

router.patch(
  "/admin/orders/:id",
  authorizeRoles("admin"),
  updateOrderStatus
);

router.patch(
  "/orders/:id/cancel",
  cancelMyOrder,
);

module.exports = router;