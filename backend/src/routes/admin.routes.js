const express = require("express");
const authMiddleWare = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");
const { getUsers } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/admin/users", authMiddleWare, authorizeRoles("admin"), getUsers);

module.exports = router;
