const express = require("express");
const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const {
  getDashboardStats,
  getUsers,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/admin/users", authMiddleWare, authorizeRoles("admin"), getUsers);

router.get(
  "/admin/dashboard",
  authMiddleWare,
  authorizeRoles("admin"),
  getDashboardStats,
);

module.exports = router;
