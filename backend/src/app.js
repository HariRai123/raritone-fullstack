const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const authRoutes = require("./routes/auth.route");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const tryonRoutes = require("./routes/tryon.route");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminRoutes);
app.use("/api/tryon", tryonRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Raritone backend is running",
  });
});

module.exports = app;

//