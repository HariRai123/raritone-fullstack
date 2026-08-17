const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/products.model");

async function createOrder(req, res) {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    const normalized = [];

    for (const item of items) {
      if (!mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({ message: "Invalid product id" });
      }

      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be at least 1" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: `${product.name} does not have enough stock` });
      }

      normalized.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity,
      });
    }

    const total = normalized.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      user: req.user.id,
      items: normalized,
      total,
      status: "confirmed",
    });

    for (const item of normalized) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const populated = await Order.findById(order._id).populate("user", "name email");

    return res.status(201).json({
      message: "Order placed successfully",
      order: populated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to place order", error: error.message });
  }
}

async function getMyOrders(req, res) {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: "Orders fetched successfully", orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch orders", error: error.message });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: "All orders fetched successfully", orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch all orders", error: error.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    ).populate("user", "name email role");

    if (!order) return res.status(404).json({ message: "Order not found" });

    return res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to update order", error: error.message });
  }
}

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };
