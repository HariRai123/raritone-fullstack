const axios = require("axios");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

const AI_API = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60000,
});

async function analyzeImage(imageBuffer, filename, mimetype) {
  const formData = new FormData();
  const imageBlob = new Blob([imageBuffer], { type: mimetype });

  formData.append("file", imageBlob, filename);

  const response = await AI_API.post(
    "/api/ai/measurements",
    formData
  );

  return response.data;
}

module.exports = {
  analyzeImage,
  AI_SERVICE_URL,
};
