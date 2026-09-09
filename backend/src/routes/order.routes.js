const express = require("express");

const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(authMiddleWare);

/*
|--------------------------------------------------------------------------
| USER ORDER ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Create Order
 *
 * POST /api/orders
 */
router.post("/orders", createOrder);

/*
 * Get My Orders
 *
 * GET /api/orders
 */
router.get("/orders", getMyOrders);

/*
 * Get My Order
 *
 * GET /api/orders/:id
 */
router.get("/orders/:id", getMyOrderById);

/*
|--------------------------------------------------------------------------
| ADMIN ORDER ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Get All Orders
 *
 * GET /api/admin/orders
 */
router.get(
  "/admin/orders",
  authorizeRoles("admin"),
  getAllOrders
);

/*
 * Update Order Status
 *
 * PATCH /api/admin/orders/:id
 */
router.patch(
  "/admin/orders/:id",
  authorizeRoles("admin"),
  updateOrderStatus
);

module.exports = router;