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
|
| Every order route requires Firebase authentication.
|
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

router.post("/", createOrder);

/*
 * Get My Orders
 *
 * GET /api/orders
 */

router.get("/", getMyOrders);

/*
 * Get My Order
 *
 * GET /api/orders/:id
 */

router.get("/:id", getMyOrderById);

/*
|--------------------------------------------------------------------------
| ADMIN ORDER ROUTES
|--------------------------------------------------------------------------
*/

/*
 * Get All Orders
 *
 * GET /api/orders/admin
 */

router.get(
  "/admin",
  authorizeRoles("admin"),
  getAllOrders
);

/*
 * Update Order Status
 *
 * PATCH /api/orders/admin/:id
 */

router.patch(
  "/admin/:id",
  authorizeRoles("admin"),
  updateOrderStatus
);

module.exports = router;