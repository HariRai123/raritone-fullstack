const express = require("express");
const multer = require("multer");
const authController = require("../controllers/auth.controller");
const authMiddleWare = require("../middleware/auth.middleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/register", upload.single("profileImage"), authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/profile", authMiddleWare, authController.getProfile);
router.put("/profile", authMiddleWare, upload.single("profileImage"), authController.updateProfile);

module.exports = router;
