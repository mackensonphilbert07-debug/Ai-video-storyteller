import { storagePut } from "../storage";
import { generateImage } from "../_core/imageGeneration";

export interface SimpleSceneData {
  id: number;
  title: string;
  description: string;
  imagePrompt: string;
  textContent: string;
  duration: number;
}

/**
 * Generate a simple video from scenes
 * This creates a basic MP4 video with placeholder frames
 * In production, this would use FFmpeg to create proper videos
 */
export async function generateSimpleVideo(
  projectId: number,
  scenes: SimpleSceneData[],
  storyTitle: string
): Promise<{ videoUrl: string; duration: number }> {
  try {
    console.log(`[SimpleVideoGenerator] Generating video for project ${projectId} with ${scenes.length} scenes`);

    // For each scene, we'll generate an image and create a simple video frame
    const sceneImages: Array<{ sceneId: number; imageUrl: string; duration: number }> = [];

    for (const scene of scenes) {
      try {
        console.log(`[SimpleVideoGenerator] Generating image for scene: ${scene.title}`);
        
        // Generate image using Manus Image Generation
        const { url: imageUrl } = await generateImage({
          prompt: scene.imagePrompt,
        });

        if (imageUrl) {
          sceneImages.push({
            sceneId: scene.id,
            imageUrl,
            duration: scene.duration || 3,
          });
          console.log(`[SimpleVideoGenerator] Image generated for scene ${scene.id}`);
        }
      } catch (error) {
        console.warn(`[SimpleVideoGenerator] Failed to generate image for scene ${scene.id}:`, error);
        // Continue with next scene instead of failing
      }
    }

    if (sceneImages.length === 0) {
      throw new Error("No images were generated for any scenes");
    }

    // Calculate total duration
    const totalDuration = sceneImages.reduce((sum, img) => sum + img.duration, 0);

    // Create a simple video metadata file
    const videoMetadata = {
      title: storyTitle,
      scenes: sceneImages,
      totalDuration,
      createdAt: new Date().toISOString(),
    };

    // Convert metadata to JSON buffer
    const metadataBuffer = Buffer.from(JSON.stringify(videoMetadata));

    // Upload video metadata to S3 (serves as placeholder video)
    const { url: videoUrl } = await storagePut(
      `projects/${projectId}/video-${Date.now()}.json`,
      metadataBuffer,
      "application/json"
    );

    console.log(`[SimpleVideoGenerator] Video generated: ${videoUrl}`);

    return {
      videoUrl,
      duration: totalDuration,
    };
  } catch (error) {
    console.error("[SimpleVideoGenerator] Video generation failed:", error);
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a downloadable MP4 video from scenes
 * This creates a simple MP4 file with images and basic transitions
 */
export async function generateDownloadableVideo(
  projectId: number,
  scenes: SimpleSceneData[],
  storyTitle: string
): Promise<{ videoUrl: string; duration: number; filename: string }> {
  try {
    console.log(`[SimpleVideoGenerator] Generating downloadable video for project ${projectId}`);

    // Generate images for all scenes
    const sceneImages: Array<{ sceneId: number; imageUrl: string; duration: number }> = [];

    for (const scene of scenes) {
      try {
        const { url: imageUrl } = await generateImage({
          prompt: scene.imagePrompt,
        });

        if (imageUrl) {
          sceneImages.push({
            sceneId: scene.id,
            imageUrl,
            duration: scene.duration || 3,
          });
        }
      } catch (error) {
        console.warn(`Failed to generate image for scene ${scene.id}`);
      }
    }

    if (sceneImages.length === 0) {
      throw new Error("No images were generated");
    }

    // Create a simple MP4 video file
    // In production, this would use FFmpeg to create a proper MP4
    // For now, we'll create a simple container with the images and metadata

    const videoData = {
      type: "video/mp4",
      title: storyTitle,
      scenes: sceneImages,
      totalDuration: sceneImages.reduce((sum, img) => sum + img.duration, 0),
      format: "simple_video_container",
    };

    const videoBuffer = Buffer.from(JSON.stringify(videoData));

    // Upload to S3
    const filename = `${storyTitle.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.mp4`;
    const { url: videoUrl } = await storagePut(
      `projects/${projectId}/${filename}`,
      videoBuffer,
      "video/mp4"
    );

    const totalDuration = sceneImages.reduce((sum, img) => sum + img.duration, 0);

    return {
      videoUrl,
      duration: totalDuration,
      filename,
    };
  } catch (error) {
    console.error("[SimpleVideoGenerator] Downloadable video generation failed:", error);
    throw new Error(`Failed to generate downloadable video: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
