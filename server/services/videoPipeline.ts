import { generateSceneImage, generateMultipleImages } from "./imageGeneration";
import { generateFullNarration } from "./textToSpeech";
import { composeFullVideo, generateSceneVideo } from "./videoComposition";
import { storagePut } from "../storage";
import { getDb } from "../db";
import { scenes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SceneData {
  id: number;
  title: string | null;
  description: string;
  imagePrompt: string | null;
  textContent: string;
  duration: number | string;
}

export interface VideoPipelineResult {
  videoUrl: string;
  duration: number;
  sceneCount: number;
  status: "completed" | "failed";
  error?: string;
}

/**
 * Generate images for all scenes in a project
 */
export async function generateSceneImages(
  projectId: number,
  scenesList: SceneData[]
): Promise<Map<number, string>> {
  const imageMap = new Map<number, string>();

  for (const scene of scenesList) {
    try {
      console.log(`[Pipeline] Generating image for scene: ${scene.title || "Unknown"}`);
      
      const imageUrl = await generateSceneImage({
        prompt: scene.imagePrompt || "",
        sceneId: scene.id,
        projectId,
      });

      imageMap.set(scene.id, imageUrl);

      // Update scene with image URL in database
      const db = await getDb();
      if (db) {
        await db
          .update(scenes)
          .set({ imageUrl })
          .where(eq(scenes.id, scene.id));
      }

      console.log(`[Pipeline] Image generated for scene ${scene.id}: ${imageUrl}`);
    } catch (error) {
      console.error(`[Pipeline] Failed to generate image for scene ${scene.id}:`, error);
      throw new Error(`Failed to generate image for scene: ${scene.title}`);
    }
  }

  return imageMap;
}

/**
 * Generate narration for the entire story
 */
export async function generateStoryNarration(
  text: string,
  projectId: number,
  language: string = "fr"
): Promise<string> {
  try {
    console.log("[Pipeline] Generating narration for story");
    
    const audioUrl = await generateFullNarration(text, projectId, language);

    console.log(`[Pipeline] Narration generated: ${audioUrl}`);
    return audioUrl;
  } catch (error) {
    console.error("[Pipeline] Failed to generate narration:", error);
    throw new Error("Failed to generate narration");
  }
}

/**
 * Complete video generation pipeline
 * Orchestrates: image generation -> scene video creation -> audio generation -> final composition
 */
export async function generateCompleteVideo(
  projectId: number,
  scenesList: SceneData[],
  storyText: string,
  narrationLanguage: string = "fr"
): Promise<VideoPipelineResult> {
  try {
    console.log(`[Pipeline] Starting video generation for project ${projectId}`);

    // Step 1: Generate images for all scenes
    console.log("[Pipeline] Step 1: Generating scene images...");
    const imageMap = await generateSceneImages(projectId, scenesList);

    // Step 2: Generate narration
    console.log("[Pipeline] Step 2: Generating narration...");
    const narrationUrl = await generateStoryNarration(storyText, projectId, narrationLanguage);

    // Step 3: Compose video with all scenes and narration
    console.log("[Pipeline] Step 3: Composing final video...");
    const scenesWithImages = scenesList.map((scene) => ({
      ...scene,
      title: scene.title || "Scene",
      imagePrompt: scene.imagePrompt || "",
      imageUrl: imageMap.get(scene.id) || "",
    }));

    // For now, use a placeholder video composition
    // In production, this would compose all scenes with narration
    const videoPath = `/tmp/video-${projectId}-${Date.now()}.mp4`;
    const duration = scenesList.reduce((sum, scene) => sum + (typeof scene.duration === "string" ? parseInt(scene.duration) : scene.duration), 0);

    // Step 4: Upload video to S3
    console.log("[Pipeline] Step 4: Uploading video to S3...");
    const videoBuffer = await import("fs").then((fs) =>
      fs.promises.readFile(videoPath)
    );

    const { url: videoUrl } = await storagePut(
      `projects/${projectId}/video-${Date.now()}.mp4`,
      videoBuffer,
      "video/mp4"
    );

    // Clean up temporary video file
    await import("fs").then((fs) => fs.promises.unlink(videoPath).catch(() => {}));

    console.log(`[Pipeline] Video generation completed: ${videoUrl}`);

    return {
      videoUrl,
      duration,
      sceneCount: scenesList.length,
      status: "completed",
    };
  } catch (error) {
    console.error("[Pipeline] Video generation failed:", error);
    return {
      videoUrl: "",
      duration: 0,
      sceneCount: scenesList.length,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get scene data from database
 */
export async function getSceneDataFromDb(projectId: number): Promise<SceneData[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const dbScenes = await db
    .select()
    .from(scenes)
    .where(eq(scenes.projectId, projectId));

  return dbScenes.map((scene) => ({
    id: scene.id,
    title: scene.title || "Scene",
    description: scene.description,
    imagePrompt: scene.imagePrompt || "",
    textContent: scene.textContent,
    duration: typeof scene.duration === "string" ? parseInt(scene.duration) : (scene.duration || 3),
  }));
}
