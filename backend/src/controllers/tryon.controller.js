const mongoose = require("mongoose");

const TryOn = require("../models/tryon.model");
const uploadFile = require("../services/storage.service");

const {
  analyzeImage,
  AI_SERVICE_URL,
} = require("../services/ai.service");

function getPoseResult(aiResult) {
  const personDetected = Boolean(
    aiResult?.person_detected
  );

  return {
    valid: personDetected,

    confidence:
      aiResult?.pose_analysis?.confidence ??
      null,

    message:
      aiResult?.pose_analysis?.message ||
      (
        personDetected
          ? "Person detected successfully."
          : "No person detected. Please upload a clear full-body image."
      ),
  };
}

function getBodyMeasurements(aiResult) {
  const measurements =
    aiResult?.measurements ||
    aiResult?.body_measurements ||
    {};

  return {
    shoulder_width_ratio:
      measurements.shoulder_width_ratio ??
      null,

    hip_width_ratio:
      measurements.hip_width_ratio ??
      null,

    left_arm_ratio:
      measurements.left_arm_ratio ??
      null,

    right_arm_ratio:
      measurements.right_arm_ratio ??
      null,

    left_leg_ratio:
      measurements.left_leg_ratio ??
      null,

    right_leg_ratio:
      measurements.right_leg_ratio ??
      null,

    torso_ratio:
      measurements.torso_ratio ??
      null,

    shoulder_to_hip_ratio:
      measurements.shoulder_to_hip_ratio ??
      null,
  };
}

function buildClientResult(document) {
  return {
    id: document._id,

    person_detected:
      document.person_detected,

    pose_analysis:
      document.pose_result,

    pose_result:
      document.pose_result,

    body_measurements:
      document.body_measurements,

    processing_time:
      document.processing_time,

    model_version:
      document.model_version,

    image_reference:
      document.image_reference,

    created_at:
      document.createdAt,
  };
}

async function analyzeTryOn(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Try-on image is required",
      });
    }

    console.log(
      "TRY-ON IMAGE:",
      req.file.originalname,
      req.file.mimetype,
      req.file.size
    );

    console.log(
      "AI SERVICE URL:",
      AI_SERVICE_URL
    );

    console.log(
      "Sending image to AI service..."
    );


    let aiResult;

    try {
      aiResult = await analyzeImage(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      console.log(
        "AI SERVICE RESPONSE:",
        JSON.stringify(
          aiResult,
          null,
          2
        )
      );
    } catch (aiError) {
      console.error(
        "AI SERVICE ERROR:"
      );

      console.error(
        "Message:",
        aiError.message
      );

      console.error(
        "Status:",
        aiError.response?.status
      );

      console.error(
        "Response:",
        aiError.response?.data
      );

      if (
        aiError.response?.status ===
        400
      ) {
        return res.status(400).json({
          message:
            aiError.response?.data
              ?.detail ||
            "The uploaded image could not be processed.",
        });
      }

      if (
        aiError.code ===
          "ECONNABORTED" ||
        aiError.code ===
          "ETIMEDOUT"
      ) {
        return res.status(504).json({
          message:
            "AI service timed out. Please try again.",
        });
      }

      return res.status(502).json({
        message:
          "AI service is currently unavailable. Please try again.",
      });
    }

    if (
      !aiResult ||
      typeof aiResult !== "object"
    ) {
      console.error(
        "Invalid AI response:",
        aiResult
      );

      return res.status(502).json({
        message:
          "AI service returned an invalid response.",
      });
    }


    if (
      typeof aiResult.person_detected !==
      "boolean"
    ) {
      console.error(
        "Invalid AI response: missing person_detected",
        aiResult
      );

      return res.status(502).json({
        message:
          "AI service returned an invalid response.",
      });
    }

    const poseResult =
      getPoseResult(aiResult);

    const bodyMeasurements =
      getBodyMeasurements(aiResult);

    let imageReference = "";

    try {
      const imageResult =
        await uploadFile(
          req.file.buffer,
          `try-on-${Date.now()}.jpg`
        );

      imageReference =
        imageResult?.url ||
        imageResult?.fileUrl ||
        "";

      if (!imageReference) {
        throw new Error(
          "ImageKit did not return an image URL."
        );
      }
    } catch (storageError) {
      console.error(
        "ImageKit upload failed:",
        storageError.message
      );

      return res.status(502).json({
        message:
          "Unable to store the try-on image.",
      });
    }

    const tryOnResult =
      await TryOn.create({
        user_id: req.user.id,

        image_reference:
          imageReference,

        person_detected:
          aiResult.person_detected,

        pose_result:
          poseResult,

        body_measurements:
          bodyMeasurements,

        processing_time:
          aiResult.processing_time ??
          null,

        model_version:
          aiResult.model_version ||
          "pose-v1",
      });

    return res.status(200).json({
      message:
        "Try-on analysis completed",

      result:
        buildClientResult(
          tryOnResult
        ),
    });
  } catch (error) {
    console.error(
      "TRY-ON ANALYSIS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to analyze try-on image",
    });
  }
}

async function getMyTryOnResults(
  req,
  res
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Unauthorized user",
      });
    }

    const results =
      await TryOn.find({
        user_id: req.user.id,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      message:
        "Try-on history fetched successfully",

      results,
    });
  } catch (error) {
    console.error(
      "GET TRY-ON HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch try-on history",
    });
  }
}

async function getTryOnHistory(
  req,
  res
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Unauthorized user",
      });
    }

    const results =
      await TryOn.find({
        user_id: req.user.id,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      message:
        "Try-on history fetched successfully",

      results,
    });
  } catch (error) {
    console.error(
      "GET TRY-ON HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch try-on history",
    });
  }
}

async function getTryOnResultById(
  req,
  res
) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Unauthorized user",
      });
    }

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid try-on analysis id",
      });
    }

    const result =
      await TryOn.findOne({
        _id: id,

        user_id:
          req.user.id,
      }).lean();

    if (!result) {
      return res.status(404).json({
        message:
          "Try-on analysis not found",
      });
    }

    return res.status(200).json({
      message:
        "Try-on result fetched successfully",

      result,
    });
  } catch (error) {
    console.error(
      "GET TRY-ON RESULT ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch try-on result",
    });
  }
}

module.exports = {
  analyzeTryOn,
  getMyTryOnResults,
  getTryOnHistory,
  getTryOnResultById,
};