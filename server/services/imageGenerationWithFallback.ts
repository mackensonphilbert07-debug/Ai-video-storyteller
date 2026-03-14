import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";

/**
 * Generate a placeholder image (fallback when API fails)
 * Creates a simple colored image with text
 */
async function generatePlaceholderImage(sceneTitle: string, sceneId: number): Promise<string> {
  try {
    console.log(`[ImageFallback] Generating placeholder image for scene ${sceneId}: ${sceneTitle}`);

    // Create a simple SVG image as placeholder
    const colors = [
      "#FF6B6B", // Red
      "#4ECDC4", // Teal
      "#45B7D1", // Blue
      "#FFA07A", // Light Salmon
      "#98D8C8", // Mint
      "#F7DC6F", // Yellow
      "#BB8FCE", // Purple
      "#85C1E2", // Sky Blue
    ];

    const colorIndex = sceneId % colors.length;
    const bgColor = colors[colorIndex];

    // Create SVG with gradient and text
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustBrightness(bgColor, -30)};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#grad)"/>
  <circle cx="640" cy="360" r="200" fill="rgba(255,255,255,0.1)"/>
  <text x="640" y="350" font-size="48" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial">
    Scene ${sceneId}
  </text>
  <text x="640" y="420" font-size="32" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="Arial">
    ${sceneTitle.substring(0, 40)}
  </text>
  <text x="640" y="680" font-size="20" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial">
    Generated with AI Video Storyteller
  </text>
</svg>`;

    // Convert SVG to buffer
    const buffer = Buffer.from(svg, "utf-8");

    // Upload to S3
    const { url } = await storagePut(
      `placeholders/${sceneId}-${Date.now()}.svg`,
      buffer,
      "image/svg+xml"
    );

    console.log(`[ImageFallback] Placeholder image created: ${url}`);
    return url;
  } catch (error) {
    console.error(`[ImageFallback] Failed to create placeholder:`, error);
    throw error;
  }
}

/**
 * Adjust color brightness (simple hex color adjustment)
 */
function adjustBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

/**
 * Generate image with fallback to placeholder
 * Tries real API first, falls back to placeholder if it fails
 */
export async function generateImageWithFallback(
  prompt: string,
  sceneId: number,
  sceneTitle: string
): Promise<string> {
  try {
    console.log(`[ImageGeneration] Attempting to generate real image for scene ${sceneId}`);

    // Try to generate real image
    const result = await generateImage({
      prompt,
    });

    if (result && result.url) {
      console.log(`[ImageGeneration] Real image generated successfully: ${result.url}`);
      return result.url;
    } else {
      console.warn(`[ImageGeneration] Real image generation returned no URL, using fallback`);
      return await generatePlaceholderImage(sceneTitle, sceneId);
    }
  } catch (error) {
    console.warn(`[ImageGeneration] Real image generation failed:`, error instanceof Error ? error.message : String(error));
    console.log(`[ImageGeneration] Using placeholder image as fallback`);

    try {
      return await generatePlaceholderImage(sceneTitle, sceneId);
    } catch (fallbackError) {
      console.error(`[ImageGeneration] Fallback also failed:`, fallbackError);
      throw new Error(`Failed to generate image (both real and fallback): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Generate multiple images with fallback
 */
export async function generateMultipleImagesWithFallback(
  scenes: Array<{ id: number; title: string; imagePrompt: string }>
): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  for (const scene of scenes) {
    try {
      const imageUrl = await generateImageWithFallback(
        scene.imagePrompt,
        scene.id,
        scene.title
      );
      results.set(scene.id, imageUrl);
    } catch (error) {
      console.error(`[ImageGeneration] Failed to generate image for scene ${scene.id}:`, error);
      // Continue with next scene instead of failing completely
    }
  }

  return results;
}
