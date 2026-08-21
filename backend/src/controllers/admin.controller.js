const User = require("../models/user.model");
const Order = require("../models/order.model");
const Product = require("../models/products.model");

async function getUsers(req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
}


async function getDashboardStats(req, res) {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),

      Product.countDocuments(),

      Order.countDocuments(),

      Order.countDocuments({ status: "pending" }),

      Order.countDocuments({ status: "confirmed" }),

      Order.countDocuments({ status: "shipped" }),

      Order.countDocuments({ status: "delivered" }),

      Order.countDocuments({ status: "cancelled" }),
    ]);

    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: {
            $in: ["confirmed", "shipped", "delivered"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$total",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult[0]?.totalRevenue || 0;

    const recentOrders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const lowStockProducts = await Product.find({
      stock: {
        $lte: 5,
      },
    })
      .sort({ stock: 1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      message: "Dashboard statistics fetched successfully",

      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,

        orders: {
          pending: pendingOrders,
          confirmed: confirmedOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },

      recentOrders,

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "GET DASHBOARD STATS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
}

module.exports = {
  getDashboardStats,
  getUsers
};
