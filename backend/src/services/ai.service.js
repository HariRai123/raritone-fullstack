const axios = require("axios");
const FormData = require("form-data");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const AI_VTON_ENDPOINT = process.env.AI_VTON_ENDPOINT || "/try-on";

const AI_TIMEOUT = Number(process.env.AI_TIMEOUT_MS) || 120000;

const AI_API = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_TIMEOUT,
});

class AIServiceError extends Error {
  constructor(code, message, options = {}) {
    super(message);

    this.name = "AIServiceError";
    this.code = code;
    this.status = options.status || null;
    this.retryable = options.retryable ?? false;
    this.originalError = options.originalError || null;
  }
}

async function downloadImage(url, label) {
  if (!url) {
    throw new AIServiceError(
      "INVALID_AI_INPUT",
      `${label} image URL is missing.`,
      {
        retryable: false,
      },
    );
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 15 * 1024 * 1024,
    });

    const contentType = response.headers["content-type"] || "";

    if (!contentType.startsWith("image/")) {
      throw new AIServiceError(
        "INVALID_AI_INPUT",
        `${label} image is not a valid image.`,
        {
          retryable: false,
        },
      );
    }

    if (!response.data || response.data.length === 0) {
      throw new AIServiceError("INVALID_AI_INPUT", `${label} image is empty.`, {
        retryable: false,
      });
    }

    return {
      buffer: Buffer.from(response.data),
      contentType,
    };
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new AIServiceError(
        "AI_TIMEOUT",
        `${label} image download timed out.`,
        {
          retryable: false,
          originalError: error,
        },
      );
    }

    throw new AIServiceError(
      "AI_INPUT_DOWNLOAD_FAILED",
      `Unable to download ${label.toLowerCase()} image.`,
      {
        retryable: false,
        originalError: error,
      },
    );
  }
}

function getVtonCategory(productCategory = "") {
  const category = String(productCategory).toLowerCase();

  if (
    category.includes("dress") ||
    category.includes("one-piece") ||
    category.includes("one piece") ||
    category.includes("jumpsuit")
  ) {
    return "one-pieces";
  }

  if (
    category.includes("pant") ||
    category.includes("trouser") ||
    category.includes("jean") ||
    category.includes("short") ||
    category.includes("skirt") ||
    category.includes("bottom")
  ) {
    return "bottoms";
  }

  return "tops";
}

async function requestTryOn({
  personImageUrl,
  garmentImageUrl,
  productCategory,
}) {
  const [person, garment] = await Promise.all([
    downloadImage(personImageUrl, "Person"),

    downloadImage(garmentImageUrl, "Garment"),
  ]);

  const form = new FormData();

  form.append("person_image", person.buffer, {
    filename: "person.jpg",
    contentType: person.contentType,
  });

  form.append("garment_image", garment.buffer, {
    filename: "garment.jpg",
    contentType: garment.contentType,
  });

  form.append("category", getVtonCategory(productCategory));

  try {
    const response = await AI_API.post(AI_VTON_ENDPOINT, form, {
      headers: form.getHeaders(),

      responseType: "arraybuffer",

      maxContentLength: 30 * 1024 * 1024,

      maxBodyLength: 30 * 1024 * 1024,
    });

    if (response.status < 200 || response.status >= 300) {
      throw new AIServiceError(
        "TRYON_FAILED",
        "The AI service failed to generate the try-on result.",
        {
          retryable: true,
          status: response.status,
        },
      );
    }

    const contentType = response.headers["content-type"] || "";

    if (!contentType.startsWith("image/")) {
      throw new AIServiceError(
        "AI_INVALID_RESPONSE",
        "The AI service returned an invalid result.",
        {
          retryable: false,
        },
      );
    }
    if (!response.data || response.data.length === 0) {
      throw new AIServiceError(
        "AI_INVALID_RESPONSE",
        "The AI service returned an empty result.",
        {
          retryable: false,
        },
      );
    }

    return {
      buffer: Buffer.from(response.data),

      contentType,

      modelVersion: process.env.AI_MODEL_VERSION || "vton-v1",
    };
  } catch (error) {
    if (error instanceof AIServiceError) {
      throw error;
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new AIServiceError(
        "AI_TIMEOUT",
        "The AI service took too long to respond.",
        {
          retryable: true,
          originalError: error,
        },
      );
    }

    if (!error.response) {
      throw new AIServiceError(
        "AI_SERVICE_UNAVAILABLE",
        "The AI service is currently unavailable.",
        {
          retryable: true,
          originalError: error,
        },
      );
    }

    if (error.response.status >= 500) {
      throw new AIServiceError(
        "TRYON_FAILED",
        "The AI service failed to generate the try-on result.",
        {
          retryable: true,
          status: error.response.status,
          originalError: error,
        },
      );
    }

    throw new AIServiceError(
      "AI_INVALID_RESPONSE",
      "The AI service returned an invalid response.",
      {
        retryable: false,
        status: error.response.status,
        originalError: error,
      },
    );
  }
}

async function generateTryOn({
  personImageUrl,
  garmentImageUrl,
  productCategory,
}) {
  const MAX_ATTEMPTS = 2;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      console.log(`AI TRY-ON ATTEMPT ${attempt}/${MAX_ATTEMPTS}`);

      return await requestTryOn({
        personImageUrl,
        garmentImageUrl,
        productCategory,
      });
    } catch (error) {
      lastError = error;

      console.error(`AI TRY-ON ATTEMPT ${attempt} FAILED:`, {
        code: error.code || "UNKNOWN_ERROR",

        message: error.message,

        retryable: error.retryable,
      });

      if (!error.retryable) {
        throw error;
      }

      if (attempt >= MAX_ATTEMPTS) {
        break;
      }

      console.log("Retrying AI try-on request once...");
    }
  }

  throw lastError;
}

async function checkAIHealth() {
  try {
    const response = await AI_API.get("/health", {
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      throw new AIServiceError(
        "AI_TIMEOUT",
        "AI service health check timed out.",
        {
          retryable: false,
          originalError: error,
        },
      );
    }

    throw new AIServiceError(
      "AI_SERVICE_UNAVAILABLE",
      "AI service health check failed.",
      {
        retryable: false,
        originalError: error,
      },
    );
  }
}

module.exports = {
  AI_SERVICE_URL,
  AI_VTON_ENDPOINT,
  AI_TIMEOUT,
  AIServiceError,
  generateTryOn,
  checkAIHealth,
  getVtonCategory,
};
