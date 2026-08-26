const mongoose = require("mongoose");

const TryOnSession = require("../models/tryOnSession.model");
const Product = require("../models/products.model");
const uploadFile = require("../services/storage.service");

const {
  generateTryOn,
  AI_SERVICE_URL,
  AIServiceError,
} = require("../services/ai.service");

function errorResponse(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function getPoseResult(personDetected) {
  return {
    valid: Boolean(personDetected),
    confidence: null,
    message: personDetected
      ? "Person image accepted by the VTON service."
      : "Person could not be processed. Please upload a clear full-body image.",
  };
}

function publicSession(session) {
  return {
    id: session._id,

    userId: session.userId,

    productId: session.productId,

    product: session.productId?.name ? session.productId : undefined,

    inputImageReference: session.inputImageReference,

    resultImageReference: session.resultImageReference,

    aiModelVersion: session.aiModelVersion,

    status: session.status,

    processingTime: session.processingTime,

    personDetected: session.personDetected,

    poseResult: session.poseResult,

    bodyMeasurements: session.bodyMeasurements,

    message: session.message,

    errorCode: session.errorCode,

    errorMessage: session.errorMessage,

    retryCount: session.retryCount,

    createdAt: session.createdAt,

    updatedAt: session.updatedAt,
  };
}

async function processSession(sessionId) {
  const startedAt = Date.now();

  const session = await TryOnSession.findById(sessionId);

  if (!session) {
    console.error("TRY-ON SESSION NOT FOUND:", sessionId);

    return;
  }

  try {
    await TryOnSession.findByIdAndUpdate(sessionId, {
      status: "processing",

      message: "Preparing your virtual try-on. AI generation is in progress.",

      errorCode: null,

      errorMessage: "",
    });

    const product = await Product.findById(session.productId)
      .select("name brand image price category stock")
      .lean();

    if (!product) {
      const error = new Error("Selected product no longer exists.");

      error.code = "PRODUCT_NOT_FOUND";

      throw error;
    }

    const aiResult = await generateTryOn({
      personImageUrl: session.inputImageReference,

      garmentImageUrl: product.image,

      productCategory: product.category,
    });

    if (!aiResult || !aiResult.buffer || !aiResult.buffer.length) {
      const error = new AIServiceError(
        "AI_INVALID_RESPONSE",
        "The AI service returned an empty try-on image.",
        {
          retryable: false,
        },
      );

      throw error;
    }

    const resultUpload = await uploadFile(
      aiResult.buffer,

      `try-on-result-${sessionId}-${Date.now()}.png`,
    );

    if (!resultUpload?.url) {
      const error = new Error("Unable to store the generated try-on image.");

      error.code = "RESULT_STORAGE_FAILED";

      throw error;
    }

    const processingTime = (Date.now() - startedAt) / 1000;

    await TryOnSession.findByIdAndUpdate(sessionId, {

      status: "completed",

      resultImageReference: resultUpload.url,

      aiModelVersion: aiResult.modelVersion,

      processingTime,

      personDetected: true,

      poseResult: getPoseResult(true),

      bodyMeasurements: {},

      message: "Virtual try-on generated successfully.",

      errorCode: null,

      errorMessage: "",
    });

    console.log(
      `TRY-ON ${sessionId} completed in ${processingTime.toFixed(2)}s`,
    );
  } catch (error) {
    const processingTime = (Date.now() - startedAt) / 1000;

    const errorCode =
      error instanceof AIServiceError
        ? error.code
        : error.code || "TRYON_FAILED";

    const errorMessage =
      error instanceof AIServiceError
        ? error.message
        : error.message || "The virtual try-on could not be completed.";

    console.error(
      "TRY-ON BACKGROUND PROCESSING ERROR:",
      errorCode,
      errorMessage,
    );

    await TryOnSession.findByIdAndUpdate(sessionId, {
      status: "failed",

      processingTime,

      errorCode,

      errorMessage,

      message: "The virtual try-on could not be completed.",
    });
  }
}

async function createTryOn(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(res, 401, "UNAUTHORIZED", "Please login first.");
    }

    if (!req.file) {
      return errorResponse(
        res,
        400,
        "INVALID_IMAGE",
        "Please upload a valid full-body image.",
      );
    }

    const { productId } = req.body;

    if (!productId) {
      return errorResponse(
        res,
        400,
        "INVALID_PRODUCT",
        "productId is required.",
      );
    }

    if (!mongoose.isValidObjectId(productId)) {
      return errorResponse(
        res,
        400,
        "INVALID_PRODUCT",
        "The selected product ID is invalid.",
      );
    }

    const product = await Product.findById(productId)
      .select("name brand image price category stock")
      .lean();

    if (!product) {
      return errorResponse(
        res,
        404,
        "PRODUCT_NOT_FOUND",
        "The selected product was not found.",
      );
    }

    if (!product.image) {
      return errorResponse(
        res,
        400,
        "GARMENT_IMAGE_MISSING",
        "This product does not have a garment image for virtual try-on.",
      );
    }

    const imageResult = await uploadFile(
      req.file.buffer,

      `try-on-session-${Date.now()}.jpg`,
    );

    if (!imageResult?.url) {
      return errorResponse(
        res,
        502,
        "IMAGE_STORAGE_FAILED",
        "Unable to store the uploaded image.",
      );
    }

    const session = await TryOnSession.create({
      userId: req.user.id,

      productId,

      inputImageReference: imageResult.url,

      status: "pending",

      message: "Try-on session created. Waiting for AI processing.",

      retryCount: 0,
    });

    void processSession(session._id).catch((error) => {
      console.error("DETACHED TRY-ON PROCESSING ERROR:", error);
    });

    return res.status(201).json({
      success: true,

      message: "Try-on session created.",

      tryOn: {
        ...publicSession(session.toObject()),

        product,
      },
    });
  } catch (error) {
    console.error("CREATE TRY-ON ERROR:", error);

    return errorResponse(
      res,
      500,
      "TRYON_SESSION_CREATE_FAILED",
      "Failed to create try-on session.",
    );
  }
}

async function getTryOnSessionById(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(
        res,
        400,
        "INVALID_SESSION_ID",
        "Invalid try-on session ID.",
      );
    }

    const result = await TryOnSession.findOne({
      _id: id,
      userId: req.user.id,
    })
      .populate("productId", "name brand image price category stock")
      .lean();

    if (!result) {
      return errorResponse(
        res,
        404,
        "SESSION_NOT_FOUND",
        "Try-on session not found.",
      );
    }

    return res.status(200).json({
      success: true,

      message: "Try-on session fetched successfully.",

      result,
    });
  } catch (error) {
    console.error("GET TRY-ON SESSION ERROR:", error);

    return errorResponse(
      res,
      500,
      "SESSION_FETCH_FAILED",
      "Failed to fetch try-on session.",
    );
  }
}

async function retryTryOnSession(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(
        res,
        400,
        "INVALID_SESSION_ID",
        "Invalid try-on session ID.",
      );
    }

    const session = await TryOnSession.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!session) {
      return errorResponse(
        res,
        404,
        "SESSION_NOT_FOUND",
        "Try-on session not found.",
      );
    }

    if (!session.inputImageReference) {
      return errorResponse(
        res,
        400,
        "SOURCE_IMAGE_MISSING",
        "No source image is available for retry.",
      );
    }


    if (["pending", "processing"].includes(session.status)) {
      return errorResponse(
        res,
        409,
        "TRYON_ALREADY_PROCESSING",
        "This session is already processing.",
      );
    }


    if (session.retryCount >= 1) {
      return errorResponse(
        res,
        409,
        "RETRY_LIMIT_REACHED",
        "This try-on has already been retried. Please upload a new photo.",
      );
    }

    session.status = "pending";

    session.retryCount += 1;

    session.message = "Retry queued. Waiting for AI processing.";

    session.errorCode = null;

    session.errorMessage = "";

    session.resultImageReference = null;

    session.personDetected = false;

    session.poseResult = {};

    session.bodyMeasurements = {};

    session.processingTime = null;

    await session.save();

    void processSession(session._id).catch((error) => {
      console.error("RETRY PROCESSING ERROR:", error);
    });

    return res.status(202).json({
      success: true,

      message: "Try-on retry started.",

      result: publicSession(session.toObject()),
    });
  } catch (error) {
    console.error("RETRY TRY-ON ERROR:", error);

    return errorResponse(
      res,
      500,
      "RETRY_FAILED",
      "Unable to retry try-on session.",
    );
  }
}


async function getTryOnHistory(req, res) {
  try {
    if (!req.user?.id) {
      return errorResponse(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication required.",
      );
    }

    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const skip = (page - 1) * limit;

    const filter = {
      userId: req.user.id,
    };

    const [results, total] = await Promise.all([
      TryOnSession.find(filter)
        .populate("productId", "name brand image price category")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      TryOnSession.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      results,

      pagination: {
        page,

        limit,

        total,

        totalPages,

        hasNextPage: page < totalPages,

        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("GET TRY-ON HISTORY ERROR:", error);

    return errorResponse(
      res,
      500,
      "HISTORY_FETCH_FAILED",
      "Failed to fetch try-on history.",
    );
  }
}



async function getTryOnResultById(req, res) {
  return getTryOnSessionById(req, res);
}

async function getMyTryOnResults(req, res) {
  return getTryOnHistory(req, res);
}

module.exports = {
  createTryOn,

  getMyTryOnResults,

  getTryOnHistory,

  getTryOnResultById,

  getTryOnSessionById,

  retryTryOnSession,

  AI_SERVICE_URL,
};
