/**
 * Image generation helper using internal ImageService
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 *
 * For editing:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "Add a rainbow to this landscape",
 *     originalImages: [{
 *       url: "https://example.com/original.jpg",
 *       mimeType: "image/jpeg"
 *     }]
 *   });
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  console.log("[ImageGeneration] Starting image generation");
  console.log("[ImageGeneration] Prompt:", options.prompt.substring(0, 100));
  
  if (!ENV.forgeApiUrl) {
    console.error("[ImageGeneration] BUILT_IN_FORGE_API_URL is not configured");
    throw new Error("BUILT_IN_FORGE_API_URL is not configured");
  }
  if (!ENV.forgeApiKey) {
    console.error("[ImageGeneration] BUILT_IN_FORGE_API_KEY is not configured");
    throw new Error("BUILT_IN_FORGE_API_KEY is not configured");
  }

  console.log("[ImageGeneration] API URL configured:", ENV.forgeApiUrl);
  console.log("[ImageGeneration] API Key configured: yes");

  // Build the full URL by appending the service path to the base URL
  const baseUrl = ENV.forgeApiUrl.endsWith("/")
    ? ENV.forgeApiUrl
    : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL(
    "images.v1.ImageService/GenerateImage",
    baseUrl
  ).toString();

  console.log("[ImageGeneration] Full URL:", fullUrl);

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      original_images: options.originalImages || [],
    }),
  });

  console.log("[ImageGeneration] Response status:", response.status, response.statusText);

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[ImageGeneration] Response error:", detail);
    throw new Error(
      `Image generation request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    image: {
      b64Json: string;
      mimeType: string;
    };
  };
  
  console.log("[ImageGeneration] Response parsed successfully");
  
  const base64Data = result.image.b64Json;
  const buffer = Buffer.from(base64Data, "base64");

  console.log("[ImageGeneration] Buffer created, size:", buffer.length);

  // Save to S3
  const { url } = await storagePut(
    `generated/${Date.now()}.png`,
    buffer,
    result.image.mimeType
  );
  
  console.log("[ImageGeneration] Image saved to S3:", url);
  
  return {
    url,
  };
}
