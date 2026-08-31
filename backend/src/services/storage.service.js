const ImageKit = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  privateKey: process.env.IMAGE_KIT_PRIVATE_KEY,
});

async function uploadFile(
  buffer,
  fileName = `upload-${Date.now()}.jpg`,
) {
  if (!buffer || !buffer.length) {
    throw new Error("File buffer is empty.");
  }

  const result = await imagekit.files.upload({
    file: buffer.toString("base64"),
    fileName,
  });

  return result;
}

module.exports = uploadFile;