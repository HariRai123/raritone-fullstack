const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const authRoutes = require("./routes/auth.route");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const tryonRoutes= require("./routes/tryon.route")
const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminRoutes);
app.use("/api/tryon",tryonRoutes)

module.exports = app;