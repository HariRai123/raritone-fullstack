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
| Every order route requires the user to be logged in.
|
*/

router.use(authMiddleWare);

/*
|--------------------------------------------------------------------------
| User Order Routes
|--------------------------------------------------------------------------
*/

/*
 * Create a new order
 *
 * POST /api/orders
 */
router.post("/orders", createOrder);

/*
 * Get all orders belonging to logged-in user
 *
 * GET /api/orders
 */
router.get("/orders", getMyOrders);

/*
 * Get one specific order belonging to logged-in user
 *
 * GET /api/orders/:id
 *
 * IMPORTANT:
 * getMyOrderById checks:
 *
 * {
 *   _id: id,
 *   user: req.user.id
 * }
 *
 * Therefore one user cannot access another user's order.
 */
router.get("/orders/:id", getMyOrderById);

/*
|--------------------------------------------------------------------------
| Admin Order Routes
|--------------------------------------------------------------------------
*/

/*
 * Get all orders
 *
 * GET /api/admin/orders
 *
 * Admin only
 */
router.get(
  "/admin/orders",
  authorizeRoles("admin"),
  getAllOrders
);

/*
 * Update order status
 *
 * PATCH /api/admin/orders/:id
 *
 * Admin only
 */
router.patch(
  "/admin/orders/:id",
  authorizeRoles("admin"),
  updateOrderStatus
);

module.exports = router;