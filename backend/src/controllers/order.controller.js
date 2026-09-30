const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Product = require("../models/products.model");


async function createOrder(req, res) {
  const session = await mongoose.startSession();

  try {


    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const {
      items,
      shippingAddress,
      paymentMethod = "cod",
    } = req.body;


    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }



    if (
      !shippingAddress ||
      typeof shippingAddress !== "object"
    ) {
      return res.status(400).json({
        message: "Shipping address is required",
      });
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "pincode",
    ];

    for (const field of requiredFields) {
      const value = shippingAddress[field];

      if (
        value === undefined ||
        value === null ||
        !String(value).trim()
      ) {
        return res.status(400).json({
          message: `${field} is required`,
        });
      }
    }


    const email = String(
      shippingAddress.email
    )
      .trim()
      .toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }



    const phone = String(
      shippingAddress.phone
    ).trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }


    const pincode = String(
      shippingAddress.pincode
    ).trim();

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: "Invalid PIN code",
      });
    }



    if (!["online", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }


    const normalized = [];

    for (const item of items) {
      if (!item?.productId) {
        return res.status(400).json({
          message: "Product ID is required",
        });
      }


      const productId = String(
        item.productId
      ).trim();

      if (!productId) {
        return res.status(400).json({
          message: "Invalid product id",
        });
      }

      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return res.status(400).json({
          message: "Quantity must be at least 1",
        });
      }

      const product = await Product.findOne({
        productId,
      }).session(session);

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${productId}`,
        });
      }


      if (Number(product.stock) < quantity) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock`,
        });
      }


      normalized.push({
        product: product._id,
        name: product.name,
        image: product.image || "",
        price: Number(product.price),
        quantity,
      });
    }

    const total = normalized.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );


    session.startTransaction();


    for (const item of normalized) {
      const updatedProduct =
        await Product.findOneAndUpdate(
          {
            _id: item.product,

            stock: {
              $gte: item.quantity,
            },
          },

          {
            $inc: {
              stock: -item.quantity,
            },
          },

          {
            new: true,
            session,
          }
        );

      if (!updatedProduct) {
        throw new Error(
          "STOCK_CHANGED_DURING_ORDER"
        );
      }
    }

    const createdOrders =
      await Order.create(
        [
          {
            user: req.user.id,

            items: normalized,

            shippingAddress: {
              firstName: String(
                shippingAddress.firstName
              ).trim(),

              lastName: String(
                shippingAddress.lastName
              ).trim(),

              email,

              phone,

              address: String(
                shippingAddress.address
              ).trim(),

              city: String(
                shippingAddress.city
              ).trim(),

              state: String(
                shippingAddress.state
              ).trim(),

              pincode,
            },

            total,

            status: "pending",

            paymentStatus: "pending",

            paymentMethod,
          },
        ],
        {
          session,
        }
      );

    const order = createdOrders[0];

    await session.commitTransaction();

    const populatedOrder =
      await Order.findById(order._id)
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "items.product",
          "name brand image price category"
        )
        .lean();

    return res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
 

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    if (
      error.message ===
      "STOCK_CHANGED_DURING_ORDER"
    ) {
      return res.status(409).json({
        message:
          "Stock changed while placing your order. Please try again.",
      });
    }

    return res.status(500).json({
      message: "Failed to place order",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  } finally {
    await session.endSession();
  }
}

async function getMyOrders(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const orders = await Order.find({
      user: req.user.id,
    })
      .populate(
        "user",
        "name email"
      )
      .populate(
        "items.product",
        "name brand image price category"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error(
      "GET MY ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
}

async function getMyOrderById(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: id,

      user: req.user.id,
    })
      .populate(
        "user",
        "name email"
      )
      .populate(
        "items.product",
        "name brand image price category"
      )
      .lean();

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER BY ID ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "name email role"
      )
      .populate(
        "items.product",
        "name brand image price category"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      message: "All orders fetched successfully",
      orders,
    });
  } catch (error) {
    console.error(
      "GET ALL ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch all orders",
    });
  }
}


async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order =
      await Order.findByIdAndUpdate(
        id,

        {
          status,
        },

        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "user",
          "name email role"
        )
        .populate(
          "items.product",
          "name brand image price category"
        );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    return res.status(200).json({
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to update order status",
    });
  }
}

async function cancelMyOrder(req, res) {
  const session = await mongoose.startSession();

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid order ID",
      });
    }

    session.startTransaction();

    const order = await Order.findOne({
      _id: id,
      user: req.user.id,
    }).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.status === "cancelled") {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Order is already cancelled",
      });
    }

    if (order.status === "shipped") {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "This order cannot be cancelled because it has already been shipped.",
      });
    }

    if (order.status === "delivered") {
      await session.abortTransaction();

      return res.status(400).json({
        message:
          "A delivered order cannot be cancelled.",
      });
    }

    for (const item of order.items) {
      const updatedProduct =
        await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

      if (!updatedProduct) {
        throw new Error(
          `PRODUCT_NOT_FOUND:${item.product}`,
        );
      }
    }

    order.status = "cancelled";

    if (
      order.paymentMethod === "cod"
    ) {
      order.paymentStatus = "pending";
    }

    await order.save({
      session,
    });

    await session.commitTransaction();

    const populatedOrder =
      await Order.findById(
        order._id,
      )
        .populate(
          "user",
          "name email role",
        )
        .populate(
          "items.product",
          "name brand image price category",
        )
        .lean();

    return res.status(200).json({
      message:
        "Order cancelled successfully",
      order: populatedOrder,
    });
  } catch (error) {
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "CANCEL ORDER ERROR:",
      error,
    );

    return res.status(500).json({
      message:
        "Failed to cancel order",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  } finally {
    await session.endSession();
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder
};