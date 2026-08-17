import API from "./api";

export const analyzeTryOn = async (image) => {
  const formData = new FormData();

  formData.append("image", image);

  const response = await API.post("/tryon/analyze", formData);

  return response.data;
};

export const getMyTryOnResults = async () => {
  const response = await API.get("/tryon/my-results");

  return response.data;
};
