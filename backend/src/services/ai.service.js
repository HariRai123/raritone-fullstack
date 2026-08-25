const axios = require("axios");
const FormData = require("form-data");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const AI_VTON_ENDPOINT = process.env.AI_VTON_ENDPOINT || "/try-on";
const AI_TIMEOUT = Number(process.env.AI_TIMEOUT_MS || 120000);

const AI_API = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: AI_TIMEOUT,
});

async function downloadImage(url, label) {
  if (!url) throw new Error(`${label} image URL is missing.`);

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxContentLength: 15 * 1024 * 1024,
  });

  const contentType = response.headers["content-type"] || "image/jpeg";
  return {
    buffer: Buffer.from(response.data),
    contentType,
  };
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

async function generateTryOn({ personImageUrl, garmentImageUrl, productCategory }) {
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

  const response = await AI_API.post(AI_VTON_ENDPOINT, form, {
    headers: form.getHeaders(),
    responseType: "arraybuffer",
    maxContentLength: 30 * 1024 * 1024,
    maxBodyLength: 30 * 1024 * 1024,
  });

  return {
    buffer: Buffer.from(response.data),
    contentType: response.headers["content-type"] || "image/png",
    modelVersion: process.env.AI_MODEL_VERSION || "vton-v1",
  };
}

async function checkAIHealth() {
  const response = await AI_API.get("/health", { timeout: 10000 });
  return response.data;
}

module.exports = {
  AI_SERVICE_URL,
  AI_VTON_ENDPOINT,
  generateTryOn,
  checkAIHealth,
  getVtonCategory,
};
