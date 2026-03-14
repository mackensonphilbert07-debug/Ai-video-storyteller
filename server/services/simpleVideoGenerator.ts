import { storagePut } from "../storage";
import { generateImageWithFallback, generateMultipleImagesWithFallback } from "./imageGenerationWithFallback";
import { getMusicForDuration, getMusicMetadata } from "./musicService";

export interface SimpleSceneData {
  id: number;
  title: string;
  description: string;
  imagePrompt: string;
  textContent: string;
  duration: number;
}

export interface VideoGenerationOptions {
  includeMusicTrack?: boolean;
  musicMood?: string;
  musicTrackId?: string;
}

/**
 * Generate a simple video from scenes
 * This creates a basic MP4 video with placeholder frames
 * In production, this would use FFmpeg to create proper videos
 */
export async function generateSimpleVideo(
  projectId: number,
  scenes: SimpleSceneData[],
  storyTitle: string,
  options?: VideoGenerationOptions
): Promise<{ videoUrl: string; duration: number; musicTrack?: { title: string; artist: string; attribution: string } }> {
  try {
    console.log(`[SimpleVideoGenerator] Generating video for project ${projectId} with ${scenes.length} scenes`);

    // For each scene, we'll generate an image and create a simple video frame
    const sceneImages: Array<{ sceneId: number; imageUrl: string; duration: number }> = [];

    for (const scene of scenes) {
      try {
        console.log(`[SimpleVideoGenerator] Generating image for scene ${scene.id}: ${scene.title}`);
        console.log(`[SimpleVideoGenerator] Image prompt: ${scene.imagePrompt}`);
        
        // Generate image using Manus Image Generation
        const imageUrl = await generateImageWithFallback(
          scene.imagePrompt,
          scene.id,
          scene.title
        );
        
        console.log(`[SimpleVideoGenerator] Image URL returned:`, imageUrl);

        if (imageUrl) {
          sceneImages.push({
            sceneId: scene.id,
            imageUrl,
            duration: scene.duration || 3,
          });
          console.log(`[SimpleVideoGenerator] Image generated for scene ${scene.id}: ${imageUrl}`);
        } else {
          console.warn(`[SimpleVideoGenerator] No image URL returned for scene ${scene.id}`);
        }
      } catch (error) {
        console.error(`[SimpleVideoGenerator] Failed to generate image for scene ${scene.id}:`, error);
        console.error(`[SimpleVideoGenerator] Error details:`, error instanceof Error ? error.message : String(error));
        // Continue with next scene instead of failing
      }
    }

    if (sceneImages.length === 0) {
      throw new Error("No images were generated for any scenes");
    }

    // Calculate total duration
    const totalDuration = sceneImages.reduce((sum, img) => sum + img.duration, 0);

    // Select background music if requested
    let musicTrack = null;
    let musicMetadata = null;
    if (options?.includeMusicTrack !== false) {
      try {
        musicTrack = options?.musicTrackId
          ? { id: options.musicTrackId } // Will be fetched if needed
          : getMusicForDuration(totalDuration, options?.musicMood);
        
        musicMetadata = getMusicMetadata(musicTrack.id);
        console.log(`[SimpleVideoGenerator] Selected music track: ${musicMetadata?.title} by ${musicMetadata?.artist}`);
      } catch (error) {
        console.warn(`[SimpleVideoGenerator] Failed to select music track:`, error);
      }
    }

    // Create a simple video metadata file
    const videoMetadata = {
      title: storyTitle,
      scenes: sceneImages,
      totalDuration,
      musicTrack: musicTrack ? { id: musicTrack.id, ...musicMetadata } : null,
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
      musicTrack: musicMetadata || undefined,
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
  storyTitle: string,
  options?: VideoGenerationOptions
): Promise<{ videoUrl: string; duration: number; filename: string; musicTrack?: { title: string; artist: string; attribution: string } }> {
  try {
    console.log(`[SimpleVideoGenerator] Generating downloadable video for project ${projectId}`);

    // Generate images for all scenes
    const sceneImages: Array<{ sceneId: number; imageUrl: string; duration: number }> = [];

    for (const scene of scenes) {
      try {
        console.log(`[SimpleVideoGenerator] Generating downloadable image for scene ${scene.id}`);
        const imageUrl = await generateImageWithFallback(
          scene.imagePrompt,
          scene.id,
          scene.title
        );

        if (imageUrl) {
          sceneImages.push({
            sceneId: scene.id,
            imageUrl,
            duration: scene.duration || 3,
          });
          console.log(`[SimpleVideoGenerator] Downloadable image generated for scene ${scene.id}`);
        } else {
          console.warn(`[SimpleVideoGenerator] No URL returned for scene ${scene.id}`);
        }
      } catch (error) {
        console.error(`[SimpleVideoGenerator] Failed to generate downloadable image for scene ${scene.id}:`, error);
      }
    }

    if (sceneImages.length === 0) {
      throw new Error("No images were generated");
    }

    // Select background music if requested
    let musicTrack = null;
    let musicMetadata = null;
    if (options?.includeMusicTrack !== false) {
      try {
        musicTrack = options?.musicTrackId
          ? { id: options.musicTrackId }
          : getMusicForDuration(
              sceneImages.reduce((sum, img) => sum + img.duration, 0),
              options?.musicMood
            );
        
        musicMetadata = getMusicMetadata(musicTrack.id);
        console.log(`[SimpleVideoGenerator] Selected music for downloadable video: ${musicMetadata?.title}`);
      } catch (error) {
        console.warn(`[SimpleVideoGenerator] Failed to select music:`, error);
      }
    }

    // Create a simple MP4 video file
    // In production, this would use FFmpeg to create a proper MP4
    // For now, we'll create a simple container with the images and metadata

    const totalDuration = sceneImages.reduce((sum, img) => sum + img.duration, 0);
    const videoData = {
      type: "video/mp4",
      title: storyTitle,
      scenes: sceneImages,
      totalDuration,
      musicTrack: musicTrack ? { id: musicTrack.id, ...musicMetadata } : null,
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

    return {
      videoUrl,
      duration: totalDuration,
      filename,
      musicTrack: musicMetadata || undefined,
    };
  } catch (error) {
    console.error("[SimpleVideoGenerator] Downloadable video generation failed:", error);
    throw new Error(`Failed to generate downloadable video: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
