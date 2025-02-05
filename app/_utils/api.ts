import axios from "axios";

export async function generateImage(prompt: string, image?: string) {
  const response = await axios.post("/api/generate-image", {
    image,
    prompt,
  });

  return response?.data?.imageUrl;
}

export async function saveImage(url: string) {
  const response = await axios.post("/api/save-image", {
    url,
  });

  return response?.data?.imageUrl;
}
