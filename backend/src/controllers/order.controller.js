const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Product = require("../models/products.model");

async function createOrder(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const {
      items,
      shippingAddress,
      paymentMethod = "online",
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate Items
    |--------------------------------------------------------------------------
    */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Order must contain at least one item",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Shipping Address
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Validate Email
    |--------------------------------------------------------------------------
    */

    const email = String(
      shippingAddress.email
    )
      .trim()
      .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Phone
    |--------------------------------------------------------------------------
    */

    const phone = String(
      shippingAddress.phone
    ).trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Invalid phone number",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate PIN
    |--------------------------------------------------------------------------
    */

    const pincode = String(
      shippingAddress.pincode
    ).trim();

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: "Invalid PIN code",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Payment Method
    |--------------------------------------------------------------------------
    */

    if (!["online", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Process Products
    |--------------------------------------------------------------------------
    */

    const normalized = [];

    for (const item of items) {
      if (!item?.productId) {
        return res.status(400).json({
          message: "Product ID is required",
        });
      }

      if (
        !mongoose.isValidObjectId(
          item.productId
        )
      ) {
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

      const product = await Product.findById(
        item.productId
      ).lean();

      if (!product) {
        return res.status(404).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if (
        Number(product.stock) < quantity
      ) {
        return res.status(400).json({
          message: `${product.name} does not have enough stock`,
        });
      }

      /*
      |--------------------------------------------------------------------------
      | NEVER TRUST FRONTEND PRICE
      |--------------------------------------------------------------------------
      */

      normalized.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: Number(product.price),
        quantity,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate Total From Database Prices
    |--------------------------------------------------------------------------
    */

    const total = normalized.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    /*
    |--------------------------------------------------------------------------
    | Create Order
    |--------------------------------------------------------------------------
    */

    const order = await Order.create({
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
    });

    /*
    |--------------------------------------------------------------------------
    | Reduce Stock
    |--------------------------------------------------------------------------
    */

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
          }
        );

      if (!updatedProduct) {
        /*
        | Stock changed while order was being processed.
        */

        await Order.findByIdAndDelete(
          order._id
        );

        return res.status(409).json({
          message:
            "Stock changed while placing your order. Please try again.",
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Get Final Order
    |--------------------------------------------------------------------------
    */

    const populatedOrder =
      await Order.findById(order._id)
        .populate(
          "user",
          "name email role"
        )
        .lean();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to place order",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Get My Orders
|--------------------------------------------------------------------------
*/

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
      .sort({
        createdAt: -1,
      });

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

/*
|--------------------------------------------------------------------------
| Get All Orders
|--------------------------------------------------------------------------
*/

async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate(
        "user",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });

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

/*
|--------------------------------------------------------------------------
| Update Order Status
|--------------------------------------------------------------------------
*/

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
      ).populate(
        "user",
        "name email role"
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
      .populate("user", "name email")
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
    console.error("GET ORDER BY ID ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch order",
    });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getMyOrderById
};