const axios = require("axios");
const TryOn = require("../models/tryon.model");
const uploadFile = require("../services/storage.service");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

async function analyzeTryOn(req, res) {
  try {
    // The route is protected, but keep an explicit guard here as well.
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    // Multer places the uploaded image in req.file.
    if (!req.file) {
      return res.status(400).json({
        message: "Try-on image is required",
      });
    }

    // Forward the original image to the AI service.
    const formData = new FormData();

    const imageBlob = new Blob(
      [req.file.buffer],
      {
        type: req.file.mimetype,
      }
    );

    formData.append(
      "file",
      imageBlob,
      req.file.originalname
    );

    let aiResponse;

    try {
      aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/analyze`,
        formData,
        {
          timeout: 60000,
        }
      );
    } catch (aiError) {
      const aiStatus = aiError.response?.status;

      console.error(
        "AI service request failed:",
        aiError.response?.data || aiError.message
      );

      if (aiStatus === 400) {
        return res.status(400).json({
          message:
            aiError.response?.data?.detail ||
            "The uploaded image could not be processed.",
        });
      }

      return res.status(502).json({
        message:
          "AI service is currently unavailable. Please try again.",
      });
    }

    const aiResult =
      aiResponse?.data?.result ||
      aiResponse?.data;

    // Protect the database from malformed AI responses.
    if (
      !aiResult ||
      typeof aiResult !== "object" ||
      typeof aiResult.person_detected !== "boolean" ||
      !aiResult.pose_analysis ||
      !aiResult.body_measurements
    ) {
      console.error(
        "Invalid AI response:",
        aiResponse?.data
      );

      return res.status(502).json({
        message: "AI service returned an invalid response.",
      });
    }

    // Store an image reference for the authenticated user's
    // analysis history. The raw image itself is not stored in MongoDB.
    let imageReference = "";

    try {
      const imageResult = await uploadFile(
        req.file.buffer,
        `try-on-${Date.now()}.jpg`
      );

      imageReference = imageResult?.url || "";

      if (!imageReference) {
        throw new Error("ImageKit did not return an image URL.");
      }
    } catch (storageError) {
      console.error(
        "Try-on image storage failed:",
        storageError.message
      );

      return res.status(502).json({
        message:
          "Unable to store the try-on image reference.",
      });
    }

    const tryOnResult = await TryOn.create({
      user_id: req.user.id,

      image_reference: imageReference,

      person_detected:
        aiResult.person_detected,

      pose_result: {
        valid:
          Boolean(
            aiResult.pose_analysis?.valid
          ),

        confidence:
          Number(
            aiResult.pose_analysis?.confidence || 0
          ),

        message:
          aiResult.pose_analysis?.message || "",
      },

      body_measurements: {
        shoulder_ratio:
          aiResult.body_measurements?.shoulder_ratio ??
          null,

        hip_ratio:
          aiResult.body_measurements?.hip_ratio ??
          null,

        arm_ratio:
          aiResult.body_measurements?.arm_ratio ??
          null,

        leg_ratio:
          aiResult.body_measurements?.leg_ratio ??
          null,
      },

      processing_time:
        aiResult.processing_time ?? null,

      model_version:
        aiResult.model_version || "",
    });

    return res.status(200).json({
      message: "Try-on analysis completed",

      result: {
        id: tryOnResult._id,

        person_detected:
          tryOnResult.person_detected,

        pose_analysis:
          tryOnResult.pose_result,

        body_measurements:
          tryOnResult.body_measurements,

        processing_time:
          tryOnResult.processing_time,

        model_version:
          tryOnResult.model_version,

        image_reference:
          tryOnResult.image_reference,

        created_at:
          tryOnResult.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Try-on analysis error:",
      error
    );

    return res.status(500).json({
      message: "Failed to analyze try-on image",
    });
  }
}

async function getMyTryOnResults(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const results = await TryOn.find({
      user_id: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Try-on results fetched successfully",
      results,
    });
  } catch (error) {
    console.error(
      "Get try-on results error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch try-on results",
    });
  }
}

module.exports = {
  analyzeTryOn,
  getMyTryOnResults,
};
