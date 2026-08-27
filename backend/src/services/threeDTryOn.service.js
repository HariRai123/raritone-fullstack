const axios = require("axios");

const AI_3D_SERVICE_URL =
  process.env.AI_3D_SERVICE_URL || "http://127.0.0.1:8001";

const AI_3D_FITTING_ENDPOINT =
  process.env.AI_3D_FITTING_ENDPOINT || "/fit";

const AI_3D_TIMEOUT =
  Number(process.env.AI_3D_TIMEOUT_MS) || 120000;

const AI_3D_API = axios.create({
  baseURL: AI_3D_SERVICE_URL,
  timeout: AI_3D_TIMEOUT,
});

class AI3DServiceError extends Error {
  constructor(code, message, options = {}) {
    super(message);

    this.name = "AI3DServiceError";
    this.code = code;
    this.status = options.status || null;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError || null;
  }
}

async function request3DFitting({
  avatarData,
  bodyData,
  poseData,
  garmentAssetUrl,
  productId,
  modelVersion,
}) {
  if (!garmentAssetUrl) {
    throw new AI3DServiceError(
      "INVALID_3D_INPUT",
      "3D garment asset URL is missing.",
      {
        retryable: false,
      },
    );
  }

  const payload = {
    avatar: avatarData || {},
    body: bodyData || {},
    pose: poseData || {},
    garmentAssetUrl,
    productId,
    modelVersion: modelVersion || "3d-v1",
  };

  try {
    const response = await AI_3D_API.post(
      AI_3D_FITTING_ENDPOINT,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        maxContentLength: 30 * 1024 * 1024,
        maxBodyLength: 30 * 1024 * 1024,
      },
    );

    if (!response.data) {
      throw new AI3DServiceError(
        "AI_3D_INVALID_RESPONSE",
        "The AI 3D service returned an empty response.",
        {
          retryable: false,
        },
      );
    }

    if (!response.data.resultUrl && !response.data.assetUrl) {
      throw new AI3DServiceError(
        "AI_3D_INVALID_RESPONSE",
        "The AI 3D service did not return a result asset.",
        {
          retryable: false,
        },
      );
    }

    return {
      resultUrl:
        response.data.resultUrl ||
        response.data.assetUrl,
      modelVersion:
        response.data.modelVersion ||
        modelVersion ||
        process.env.AI_3D_MODEL_VERSION ||
        "3d-v1",
      data: response.data,
    };
  } catch (error) {
    if (error instanceof AI3DServiceError) {
      throw error;
    }

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      throw new AI3DServiceError(
        "AI_3D_TIMEOUT",
        "The 3D AI service took too long to respond.",
        {
          retryable: true,
          originalError: error,
        },
      );
    }

    if (!error.response) {
      throw new AI3DServiceError(
        "AI_3D_SERVICE_UNAVAILABLE",
        "The 3D AI service is currently unavailable.",
        {
          retryable: true,
          originalError: error,
        },
      );
    }

    if (error.response.status >= 500) {
      throw new AI3DServiceError(
        "AI_3D_PROCESSING_FAILED",
        "The 3D AI service failed to process the fitting.",
        {
          retryable: true,
          status: error.response.status,
          originalError: error,
        },
      );
    }

    throw new AI3DServiceError(
      "AI_3D_INVALID_REQUEST",
      "The 3D AI service rejected the request.",
      {
        retryable: false,
        status: error.response.status,
        originalError: error,
      },
    );
  }
}

async function generate3DTryOn({
  avatarData,
  bodyData,
  poseData,
  garmentAssetUrl,
  productId,
  modelVersion,
}) {
  const maxAttempts = 2;

  let attempt = 0;
  let lastError;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      return await request3DFitting({
        avatarData,
        bodyData,
        poseData,
        garmentAssetUrl,
        productId,
        modelVersion,
      });
    } catch (error) {
      lastError = error;

      console.error(
        `3D AI TRY-ON ATTEMPT ${attempt}/${maxAttempts}:`,
        error.code || error.message,
      );

      if (
        !error.retryable ||
        attempt >= maxAttempts
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

async function checkAI3DHealth() {
  try {
    const response = await AI_3D_API.get(
      "/health",
      {
        timeout: 10000,
      },
    );

    return response.data;
  } catch (error) {
    throw new AI3DServiceError(
      "AI_3D_SERVICE_UNAVAILABLE",
      "3D AI service health check failed.",
      {
        retryable: true,
        originalError: error,
      },
    );
  }
}

module.exports = {
  AI_3D_SERVICE_URL,
  AI_3D_FITTING_ENDPOINT,
  AI_3D_TIMEOUT,
  AI3DServiceError,
  generate3DTryOn,
  checkAI3DHealth,
};