const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const AI_ENDPOINT = process.env.AI_MEASUREMENTS_ENDPOINT || "/api/ai/measurements";

const AI_API = axios.create({ baseURL: AI_SERVICE_URL, timeout: 60000 });

async function analyzeImage(imageBuffer, filename, mimetype) {
  const formData = new FormData();
  formData.append("file", new Blob([imageBuffer], { type: mimetype }), filename);
  const response = await AI_API.post(AI_ENDPOINT, formData);
  return response.data;
}

async function analyzeImageFromUrl(imageUrl) {
  const imageResponse = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 20000,
  });
  const contentType = imageResponse.headers["content-type"] || "image/jpeg";
  return analyzeImage(Buffer.from(imageResponse.data), `try-on-${Date.now()}.jpg`, contentType);
}

module.exports = { analyzeImage, analyzeImageFromUrl, AI_SERVICE_URL };
