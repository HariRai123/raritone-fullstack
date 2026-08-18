
const express = require("express");
const multer = require("multer");

const {
  analyzeTryOn,
  getMyTryOnResults,
  getTryOnResultById,
} = require("../controllers/tryon.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);


const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(
        new Error(
          "Only JPG, JPEG and PNG images are supported."
        )
      );
    }

    cb(null, true);
  },
});


router.post(
  "/analyze",
  authMiddleware,
  (req, res, next) => {
    upload.single("image")(
      req,
      res,
      (error) => {
        if (error instanceof multer.MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
              message:
                "Image size must be less than 10 MB.",
            });
          }

          return res.status(400).json({
            message: error.message,
          });
        }
        if (error) {
          return res.status(400).json({
            message: error.message,
          });
        }
        next();
      });
},analyzeTryOn);
router.get("/my-results",authMiddleware,getMyTryOnResults);
router.get("/history",authMiddleware,getMyTryOnResults);
router.get("/history/:id",authMiddleware,getTryOnResultById);
module.exports = router;
