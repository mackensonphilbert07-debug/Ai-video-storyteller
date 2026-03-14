import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";

export interface GenerateImageOptions {
  prompt: string;
  sceneId: number;
  projectId: number;
}

export async function generateSceneImage(options: GenerateImageOptions): Promise<string> {
  try {
    // Generate image using Manus built-in image generation
    const { url: imageUrl } = await generateImage({
      prompt: options.prompt,
    });

    // The image is already stored in S3 by the image generation service
    // Return the URL directly
    if (!imageUrl) {
      throw new Error("Image generation returned no URL");
    }

    return imageUrl;
  } catch (error) {
    console.error(`Failed to generate image for scene ${options.sceneId}:`, error);
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function generateMultipleImages(
  imagePrompts: Array<{ sceneId: number; prompt: string; projectId: number }>
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  for (const item of imagePrompts) {
    try {
      const imageUrl = await generateSceneImage({
        prompt: item.prompt,
        sceneId: item.sceneId,
        projectId: item.projectId,
      });
      results.set(item.sceneId, imageUrl);
    } catch (error) {
      console.error(`Failed to generate image for scene ${item.sceneId}:`, error);
      // Continue with next image instead of failing completely
    }
  }

  return results;
}
