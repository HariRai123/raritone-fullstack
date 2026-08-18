
const express = require("express");
const multer = require("multer");

const {
  analyzeTryOn,
  getMyTryOnResults,
  getTryOnResultById,
} = require("../controllers/tryon.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Allowed image types
|--------------------------------------------------------------------------
*/

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

/*
|--------------------------------------------------------------------------
| Multer configuration
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| POST /api/tryon/analyze
|--------------------------------------------------------------------------
|
| React
|   ↓
| Express
|   ↓
| FastAPI
|   ↓
| MongoDB
|   ↓
| React
|
*/

router.post(
  "/analyze",

  // JWT authentication
  authMiddleware,

  // Image upload + validation
  (req, res, next) => {
    upload.single("image")(
      req,
      res,
      (error) => {
        /*
        |--------------------------------------------------------------------------
        | Multer errors
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | Custom file filter error
        |--------------------------------------------------------------------------
        */

        if (error) {
          return res.status(400).json({
            message: error.message,
          });
        }

        /*
        |--------------------------------------------------------------------------
        | Continue to controller
        |--------------------------------------------------------------------------
        */

        next();
      }
    );
  },

  // Controller
  analyzeTryOn
);

/*
|--------------------------------------------------------------------------
| GET /api/tryon/my-results
|--------------------------------------------------------------------------
|
| Existing frontend endpoint.
|
| Returns all Try-On analyses belonging to
| the authenticated user.
|
*/

router.get(
  "/my-results",
  authMiddleware,
  getMyTryOnResults
);

/*
|--------------------------------------------------------------------------
| GET /api/tryon/history
|--------------------------------------------------------------------------
|
| Required task endpoint.
|
| Returns authenticated user's Try-On history.
|
*/

router.get(
  "/history",
  authMiddleware,
  getMyTryOnResults
);

/*
|--------------------------------------------------------------------------
| GET /api/tryon/history/:id
|--------------------------------------------------------------------------
|
| Required task endpoint.
|
| Returns ONE Try-On analysis.
|
| Important:
| The controller checks BOTH:
|
|   _id
|   user_id
|
| Therefore one user cannot access another
| user's Try-On result.
|
*/

router.get(
  "/history/:id",
  authMiddleware,
  getTryOnResultById
);

/*
|--------------------------------------------------------------------------
| Export router
|--------------------------------------------------------------------------
*/

module.exports = router;
