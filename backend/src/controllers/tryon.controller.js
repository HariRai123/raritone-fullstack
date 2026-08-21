const mongoose = require("mongoose");
const TryOnSession = require("../models/tryOnSession.model");
const TryOn = require("../models/tryon.model");
const Product = require("../models/products.model");
const uploadFile = require("../services/storage.service");
const { analyzeImage, analyzeImageFromUrl, AI_SERVICE_URL } = require("../services/ai.service");

function getPoseResult(aiResult) {
  const personDetected = Boolean(aiResult?.person_detected);
  return {
    valid: personDetected,
    confidence: aiResult?.pose_analysis?.confidence ?? null,
    message: aiResult?.pose_analysis?.message || (personDetected ? "Person detected successfully." : "No person detected. Please upload a clear full-body image."),
  };
}

function getBodyMeasurements(aiResult) {
  const measurements = aiResult?.measurements || aiResult?.body_measurements || {};
  return {
    shoulder_width_ratio: measurements.shoulder_width_ratio ?? null,
    hip_width_ratio: measurements.hip_width_ratio ?? null,
    left_arm_ratio: measurements.left_arm_ratio ?? null,
    right_arm_ratio: measurements.right_arm_ratio ?? null,
    left_leg_ratio: measurements.left_leg_ratio ?? null,
    right_leg_ratio: measurements.right_leg_ratio ?? null,
    torso_ratio: measurements.torso_ratio ?? null,
    shoulder_to_hip_ratio: measurements.shoulder_to_hip_ratio ?? null,
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

async function processSession(sessionId) {
  const startedAt = Date.now();
  const session = await TryOnSession.findById(sessionId);
  if (!session) return;

  try {
    await TryOnSession.findByIdAndUpdate(sessionId, { status: "processing", message: "AI analysis is processing your image.", errorMessage: "" });

    const aiResult = await analyzeImageFromUrl(session.inputImageReference);
    if (!aiResult || typeof aiResult.person_detected !== "boolean") throw new Error("AI service returned an invalid response.");

    const personDetected = Boolean(aiResult.person_detected);
    const poseResult = getPoseResult(aiResult);
    const bodyMeasurements = getBodyMeasurements(aiResult);
    const processingTime = aiResult.processing_time ?? (Date.now() - startedAt) / 1000;

    await TryOnSession.findByIdAndUpdate(sessionId, {
      status: personDetected ? "completed" : "failed",
      aiModelVersion: aiResult.model_version || "pose-v1",
      processingTime,
      personDetected,
      poseResult,
      bodyMeasurements,
      message: personDetected
        ? "AI pose and body analysis completed. The result is ready to review."
        : "No person detected. Please upload a clear front-facing full-body image.",
      errorMessage: personDetected ? "" : "No person detected.",
    });
  } catch (error) {
    console.error("TRY-ON BACKGROUND PROCESSING ERROR:", error.response?.data || error.message);
    const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    await TryOnSession.findByIdAndUpdate(sessionId, {
      status: "failed",
      processingTime: (Date.now() - startedAt) / 1000,
      errorMessage: isTimeout ? "AI service timed out. Please retry." : "AI service is currently unavailable. Please retry.",
      message: isTimeout ? "The AI service took too long to respond." : "The AI service could not process this session.",
    });
  }
}

async function analyzeTryOn(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized user" });
    if (!req.file) return res.status(400).json({ message: "Try-on image is required" });
    const aiResult = await analyzeImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    const poseResult = getPoseResult(aiResult);
    const bodyMeasurements = getBodyMeasurements(aiResult);
    const imageResult = await uploadFile(req.file.buffer, `try-on-${Date.now()}.jpg`);
    const result = await TryOn.create({ user_id: req.user.id, image_reference: imageResult.url, person_detected: aiResult.person_detected, pose_result: poseResult, body_measurements: bodyMeasurements, processing_time: aiResult.processing_time ?? null, model_version: aiResult.model_version || "pose-v1" });
    return res.status(200).json({ message: "Try-on analysis completed", result });
  } catch (error) {
    console.error("TRY-ON ANALYSIS ERROR:", error);
    return res.status(500).json({ message: "Failed to analyze try-on image" });
  }
}

async function createTryOn(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized user" });
    if (!req.file) return res.status(400).json({ message: "Person image is required" });

    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: "productId is required" });
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid productId" });

    const product = await Product.findById(productId).select("name brand image price category stock").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const imageResult = await uploadFile(req.file.buffer, `try-on-session-${Date.now()}.jpg`);
    if (!imageResult?.url) return res.status(502).json({ message: "Unable to store the uploaded image." });

    const session = await TryOnSession.create({
      userId: req.user.id,
      productId,
      inputImageReference: imageResult.url,
      status: "pending",
      message: "Try-on session created. Waiting for AI processing.",
    });

    processSession(session._id).catch((error) => console.error("Detached try-on processing error:", error));

    return res.status(201).json({
      message: "Try-on session created",
      tryOn: { ...publicSession(session.toObject()), product },
    });
  } catch (error) {
    console.error("CREATE TRY-ON ERROR:", error);
    return res.status(500).json({ message: "Failed to create try-on session" });
  }
}

async function getTryOnSessionById(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized user" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid try-on session id" });

    const result = await TryOnSession.findOne({ _id: id, userId: req.user.id })
      .populate("productId", "name brand image price category stock")
      .lean();

    if (!result) return res.status(404).json({ message: "Try-on session not found" });
    return res.status(200).json({ message: "Try-on session fetched successfully", result });
  } catch (error) {
    console.error("GET TRY-ON SESSION ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch try-on session" });
  }
}

async function retryTryOnSession(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized user" });
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid try-on session id" });

    const session = await TryOnSession.findOne({ _id: id, userId: req.user.id });
    if (!session) return res.status(404).json({ message: "Try-on session not found" });
    if (!session.inputImageReference) return res.status(400).json({ message: "No source image is available for retry." });
    if (["pending", "processing"].includes(session.status)) return res.status(409).json({ message: "This session is already processing." });

    session.status = "pending";
    session.message = "Retry queued. Waiting for AI processing.";
    session.errorMessage = "";
    session.personDetected = false;
    session.poseResult = {};
    session.bodyMeasurements = {};
    session.processingTime = null;
    await session.save();

    processSession(session._id).catch((error) => console.error("Retry processing error:", error));
    return res.status(202).json({ message: "Try-on retry started", result: session });
  } catch (error) {
    console.error("RETRY TRY-ON ERROR:", error);
    return res.status(500).json({ message: "Unable to retry try-on session" });
  }
}

async function getTryOnHistory(req, res) {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Unauthorized user" });
    const results = await TryOnSession.find({ userId: req.user.id })
      .populate("productId", "name brand image price category")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ message: "Try-on history fetched successfully", results });
  } catch (error) {
    console.error("GET TRY-ON HISTORY ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch try-on history" });
  }
}

async function getTryOnResultById(req, res) {
  return getTryOnSessionById(req, res);
}

async function getMyTryOnResults(req, res) { return getTryOnHistory(req, res); }

module.exports = { analyzeTryOn, createTryOn, getMyTryOnResults, getTryOnHistory, getTryOnResultById, getTryOnSessionById, retryTryOnSession, AI_SERVICE_URL };
