const axios= require("axios");

const AI_API=axios.create({
    baseURL:process.env.AI_SERVICE_URL || "http://127.0.0.1:8000",
    timeout:30000,
})

async function analyzeImage(imageBuffer,filename,mimetype) {
    const formData= new FormData();
    const blob= new Blob(
        [imageBuffer],
        {type:mimetype}
    );
    formData.append("file",blob,filename);
    const response=await AI_API.post("/api/analyze",formData)

    return response.data
}

module.exports={analyzeImage}