const multer = require("multer");
const sharp = require("sharp");
const { fileTypeFromBuffer } = require("file-type");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MIN_WIDTH = 300;
const MIN_HEIGHT = 500;

const MAX_WIDTH = 8000;
const MAX_HEIGHT = 8000;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WebP images are supported."));
    }

    cb(null, true);
  },
});

async function validateImageFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: "Please upload an image.",
        },
      });
    }

    const buffer = req.file.buffer;

    const detectedType = await fileTypeFromBuffer(buffer);

    if (!detectedType) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: "The uploaded file is not a valid image.",
        },
      });
    }

    if (!ALLOWED_MIME_TYPES.has(detectedType.mime)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: "Only JPG, PNG and WebP images are supported.",
        },
      });
    }

    if (!ALLOWED_EXTENSIONS.has(detectedType.ext)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: "Unsupported image format.",
        },
      });
    }

    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: "Unable to read image dimensions.",
        },
      });
    }

    const { width, height } = metadata;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return res.status(400).json({
        success: false,
        error: {
          code: "IMAGE_RESOLUTION_TOO_LOW",
          message: "Please upload a higher-resolution full-body image.",
        },
      });
    }
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      return res.status(400).json({
        success: false,
        error: {
          code: "IMAGE_RESOLUTION_TOO_LARGE",
          message: "The uploaded image resolution is too large.",
        },
      });
    }
    req.imageMetadata = {
      width,
      height,
      format: detectedType.ext,
      mimeType: detectedType.mime,
      size: buffer.length,
    };

    next();
  } catch (error) {
    console.error("IMAGE VALIDATION ERROR:", error);

    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_IMAGE",
        message: "The uploaded image could not be processed.",
      },
    });
  }
}

function handleImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: {
            code: "IMAGE_TOO_LARGE",
            message: "Image size must be less than 10 MB.",
          },
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          code: "IMAGE_UPLOAD_ERROR",
          message: "Unable to upload the image.",
        },
      });
    }

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_IMAGE",
          message: error.message,
        },
      });
    }

    validateImageFile(req, res, next);
  });
}

module.exports = {
  handleImageUpload,
};
