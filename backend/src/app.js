const express = require("express");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const authRoutes = require("./routes/auth.route");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const tryonRoutes = require("./routes/tryon.route");
const threeDAssetRoutes = require("./routes/threeDAsset.routes");
const threeDTryOnRoutes = require("./routes/threeDTryOn.routes");

const {
  getAllThreeDAssets,
} = require("./controllers/threeDAsset.controller");

const authMiddleware = require("./middleware/auth.middleware");
const authorizeRoles = require("./middleware/role.middleware");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use("/api", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", adminRoutes);
app.use("/api/tryon", tryonRoutes);

app.get(
  "/api/admin/3d-assets",
  authMiddleware,
  authorizeRoles("admin", "reviewer"),
  getAllThreeDAssets,
);

app.use(
  "/api/3d-assets",
  threeDAssetRoutes,
);

app.use(
  "/api/3d-tryon",
  threeDTryOnRoutes,
);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Raritone backend is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error("GLOBAL ERROR:", error);

  if (error.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "CORS origin is not allowed",
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

module.exports = app;