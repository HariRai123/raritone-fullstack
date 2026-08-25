const mongoose = require("mongoose");
const TryOnSession = require("../models/tryOnSession.model");
const TryOn = require("../models/tryon.model");
const Product = require("../models/products.model");
const uploadFile = require("../services/storage.service");
const {
  generateTryOn,
  AI_SERVICE_URL,
} = require("../services/ai.service");

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
    errorMessage: session.errorMessage,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function isTimeout(error) {
  return (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    String(error?.message || "").toLowerCase().includes("timeout")
  );
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
      errorMessage: "",
    });

    // Product is loaded server-side. The client never controls garment price/data.
    const product = await Product.findById(session.productId)
      .select("name brand image price category stock")
      .lean();

    if (!product) {
      throw new Error("Selected product no longer exists.");
    }

    const aiResult = await generateTryOn({
      personImageUrl: session.inputImageReference,
      garmentImageUrl: product.image,
      productCategory: product.category,
    });

    if (!aiResult?.buffer?.length) {
      throw new Error("AI service returned an empty try-on image.");
    }

    const resultUpload = await uploadFile(
      aiResult.buffer,
      `try-on-result-${sessionId}-${Date.now()}.png`,
    );

    if (!resultUpload?.url) {
      throw new Error("Unable to store the generated try-on image.");
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
      errorMessage: "",
    });

    console.log(`TRY-ON ${sessionId} completed in ${processingTime.toFixed(2)}s`);
  } catch (error) {
    const processingTime = (Date.now() - startedAt) / 1000;
    const timeout = isTimeout(error);

    console.error(
      "TRY-ON BACKGROUND PROCESSING ERROR:",
      error?.response?.data || error?.message || error,
    );

    await TryOnSession.findByIdAndUpdate(sessionId, {
      status: "failed",
      processingTime,
      errorMessage: timeout
        ? "AI service timed out. Please retry."
        : error?.message || "AI service could not process this try-on.",
      message: timeout
        ? "The AI service took too long to respond."
        : "The virtual try-on could not be completed.",
    });
  }
}

async function createTryOn(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Person image is required" });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const product = await Product.findById(productId)
      .select("name brand image price category stock")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.image) {
      return res.status(400).json({
        message: "This product does not have a garment image for virtual try-on.",
      });
    }

    const imageResult = await uploadFile(
      req.file.buffer,
      `try-on-session-${Date.now()}.jpg`,
    );

    if (!imageResult?.url) {
      return res.status(502).json({
        message: "Unable to store the uploaded image.",
      });
    }

    const session = await TryOnSession.create({
      userId: req.user.id,
      productId,
      inputImageReference: imageResult.url,
      status: "pending",
      message: "Try-on session created. Waiting for AI processing.",
    });

    // IMPORTANT: do not await VTON here.
    // The HTTP request returns immediately while the server processes the job.
    void processSession(session._id).catch((error) => {
      console.error("Detached try-on processing error:", error);
    });

    return res.status(201).json({
      message: "Try-on session created",
      tryOn: {
        ...publicSession(session.toObject()),
        product,
      },
    });
  } catch (error) {
    console.error("CREATE TRY-ON ERROR:", error);
    return res.status(500).json({
      message: "Failed to create try-on session",
    });
  }
}

async function getTryOnSessionById(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid try-on session id" });
    }

    const result = await TryOnSession.findOne({
      _id: id,
      userId: req.user.id,
    })
      .populate("productId", "name brand image price category stock")
      .lean();

    if (!result) {
      return res.status(404).json({ message: "Try-on session not found" });
    }

    return res.status(200).json({
      message: "Try-on session fetched successfully",
      result,
    });
  } catch (error) {
    console.error("GET TRY-ON SESSION ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch try-on session",
    });
  }
}

async function retryTryOnSession(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid try-on session id" });
    }

    const session = await TryOnSession.findOne({
      _id: id,
      userId: req.user.id,
    });

    if (!session) {
      return res.status(404).json({ message: "Try-on session not found" });
    }

    if (!session.inputImageReference) {
      return res.status(400).json({
        message: "No source image is available for retry.",
      });
    }

    if (["pending", "processing"].includes(session.status)) {
      return res.status(409).json({
        message: "This session is already processing.",
      });
    }

    session.status = "pending";
    session.message = "Retry queued. Waiting for AI processing.";
    session.errorMessage = "";
    session.resultImageReference = null;
    session.personDetected = false;
    session.poseResult = {};
    session.bodyMeasurements = {};
    session.processingTime = null;
    await session.save();

    void processSession(session._id).catch((error) => {
      console.error("Retry processing error:", error);
    });

    return res.status(202).json({
      message: "Try-on retry started",
      result: session,
    });
  } catch (error) {
    console.error("RETRY TRY-ON ERROR:", error);
    return res.status(500).json({
      message: "Unable to retry try-on session",
    });
  }
}

async function getTryOnHistory(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const results = await TryOnSession.find({ userId: req.user.id })
      .populate("productId", "name brand image price category")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      message: "Try-on history fetched successfully",
      results,
    });
  } catch (error) {
    console.error("GET TRY-ON HISTORY ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch try-on history",
    });
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
