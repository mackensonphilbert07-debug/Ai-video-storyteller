import { generateStory, parseStoryIntoScenes } from "./storyGenerationService";
import {
  generateVoiceNarration,
  generateSceneNarrations,
} from "./xttsVoiceService";
import {
  generateSubtitles,
  generateSRTContent,
  createSubtitleFile,
  synchronizeSubtitlesWithScenes,
} from "./subtitleService";
import { translateStory, translateNarrations } from "./translationService";
import { generateEnhancedVideo } from "./enhancedVideoGenerator";
import { generateImage } from "../_core/imageGeneration";
import { storagePut } from "../storage";
import type { SupportedLanguage } from "./translationService";

export interface AutomatedPipelineRequest {
  prompt: string;
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
  videoQuality: "720p" | "1080p";
  voiceCharacter: "male" | "female" | "neutral";
  includeSubtitles: boolean;
  transition: "fade" | "slide" | "zoom" | "none";
  onProgress?: (stage: string, progress: number) => void;
}

export interface PipelineResult {
  videoUrl: string;
  duration: number;
  languages: SupportedLanguage[];
  subtitles: Record<SupportedLanguage, string>; // SRT content
  metadata: {
    title: string;
    description: string;
    createdAt: Date;
    sourceLanguage: SupportedLanguage;
  };
}

/**
 * Execute complete automated video generation pipeline
 */
export async function executeAutomatedPipeline(
  request: AutomatedPipelineRequest
): Promise<PipelineResult> {
  const { onProgress } = request;

  try {
    // Stage 1: Generate story
    onProgress?.("Generating story...", 10);
    const story = await generateStory({
      prompt: request.prompt,
      language: request.sourceLanguage,
      targetLength: "medium",
    });

    // Stage 2: Translate story to target languages
    onProgress?.("Translating story...", 20);
    const translatedStories = await translateStory(
      {
        title: story.title,
        description: story.description,
        content: story.content,
        scenes: story.scenes,
      },
      request.sourceLanguage,
      request.targetLanguages
    );

    // Stage 3: Generate images for each scene
    onProgress?.("Generating images...", 30);
    const sceneImages = await generateSceneImages(story.scenes);

    // Stage 4: Generate narration for all languages
    onProgress?.("Generating narration...", 50);
    const narrationsByLanguage = await generateNarrationForAllLanguages(
      translatedStories,
      request.sourceLanguage,
      request.targetLanguages,
      request.voiceCharacter
    );

    // Stage 5: Generate subtitles for all languages
    onProgress?.("Generating subtitles...", 70);
    const subtitlesByLanguage = await generateSubtitlesForAllLanguages(
      translatedStories,
      story.scenes
    );

    // Stage 6: Create video with primary language
    onProgress?.("Creating video...", 80);
    const videoUrl = await createFinalVideo(
      story.scenes,
      sceneImages,
      narrationsByLanguage[request.sourceLanguage],
      request.videoQuality,
      request.transition,
      request.includeSubtitles ? subtitlesByLanguage[request.sourceLanguage] : undefined
    );

    onProgress?.("Complete!", 100);

    return {
      videoUrl,
      duration: story.estimatedDuration,
      languages: [request.sourceLanguage, ...request.targetLanguages],
      subtitles: subtitlesByLanguage,
      metadata: {
        title: story.title,
        description: story.description,
        createdAt: new Date(),
        sourceLanguage: request.sourceLanguage,
      },
    };
  } catch (error) {
    console.error("Pipeline error:", error);
    throw new Error(
      `Video generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate images for all scenes
 */
async function generateSceneImages(
  scenes: Array<{
    sceneNumber: number;
    imagePrompt: string;
  }>
): Promise<Record<number, string>> {
  const images: Record<number, string> = {} as Record<number, string>;

  for (const scene of scenes) {
    try {
      const { url } = await generateImage({
        prompt: scene.imagePrompt,
      });
      images[scene.sceneNumber] = url || "https://via.placeholder.com/1920x1080?text=Error";
    } catch (error) {
      console.error(`Error generating image for scene ${scene.sceneNumber}:`, error);
      // Use placeholder image on error
      images[scene.sceneNumber] = `https://via.placeholder.com/1920x1080?text=Scene+${scene.sceneNumber}`;
    }
  }

  return images as Record<number, string>;
}

/**
 * Generate narration for all languages
 */
async function generateNarrationForAllLanguages(
  translatedStories: Record<
    SupportedLanguage,
    {
      scenes: Array<{
        sceneNumber: number;
        description: string;
      }>;
    }
  >,
  sourceLanguage: SupportedLanguage,
  targetLanguages: SupportedLanguage[],
  voiceCharacter: "male" | "female" | "neutral"
): Promise<
  Record<
    SupportedLanguage,
    Array<{
      sceneNumber: number;
      audioUrl: string;
      duration: number;
    }>
  >
> {
  const narrationsByLanguage: Record<SupportedLanguage, any> = {} as Record<SupportedLanguage, any>;

  // Generate narration for source language
  narrationsByLanguage[sourceLanguage] = await generateSceneNarrations(
    translatedStories[sourceLanguage].scenes,
    sourceLanguage,
    voiceCharacter
  );

  // Generate narration for target languages
  for (const lang of targetLanguages) {
    narrationsByLanguage[lang] = await generateSceneNarrations(
      translatedStories[lang].scenes,
      lang,
      voiceCharacter
    );
  }

  return narrationsByLanguage;
}

/**
 * Generate subtitles for all languages
 */
async function generateSubtitlesForAllLanguages(
  translatedStories: Record<
    SupportedLanguage,
    {
      scenes: Array<{
        sceneNumber: number;
        description: string;
      }>;
    }
  >,
  originalScenes: Array<{
    sceneNumber: number;
    duration: number;
  }>
): Promise<Record<SupportedLanguage, string>> {
  const subtitlesByLanguage: Record<SupportedLanguage, string> = {} as Record<SupportedLanguage, string>;
  let currentTime = 0;

  for (const [language, story] of Object.entries(translatedStories)) {
    const narrations = story.scenes.map((scene, index) => ({
      sceneNumber: scene.sceneNumber,
      text: scene.description,
      duration: originalScenes[index]?.duration || 10,
      startTime: currentTime,
    }));

    const segments = synchronizeSubtitlesWithScenes(narrations);
    subtitlesByLanguage[language as SupportedLanguage] =
      generateSRTContent(segments);
  }

  return subtitlesByLanguage;
}

/**
 * Create final video
 */
async function createFinalVideo(
  scenes: Array<{
    sceneNumber: number;
    duration: number;
  }>,
  sceneImages: Record<number, string>,
  narrations: Array<{
    sceneNumber: number;
    audioUrl: string;
    duration: number;
  }>,
  quality: "720p" | "1080p",
  transition: "fade" | "slide" | "zoom" | "none",
  subtitleFile?: string
): Promise<string> {
  // Create video scenes with images and audio
  const videoScenes = scenes.map((scene) => ({
    sceneNumber: scene.sceneNumber,
    imageUrl: sceneImages[scene.sceneNumber],
    audioUrl: narrations.find((n) => n.sceneNumber === scene.sceneNumber)
      ?.audioUrl || "",
    duration: scene.duration,
  }));

  // Generate video
  const tempOutputPath = `/tmp/video_${Date.now()}.mp4`;

  const result = await generateEnhancedVideo({
    scenes: videoScenes,
    outputPath: tempOutputPath,
    resolution: quality,
    transition,
    subtitleFile,
  });

  // Upload to S3
  const videoBuffer = require("fs").readFileSync(result.outputPath);
  const { url } = await storagePut(
    `videos/generated_${Date.now()}.mp4`,
    videoBuffer,
    "video/mp4"
  );

  // Cleanup
  require("fs").unlinkSync(result.outputPath);

  return url;
}

/**
 * Get pipeline progress
 */
export interface PipelineProgress {
  stage: string;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
}

/**
 * Estimate pipeline duration
 */
export function estimatePipelineDuration(
  storyLength: number, // in characters
  numberOfScenes: number,
  numberOfLanguages: number
): number {
  // Rough estimates (in seconds)
  const storyGeneration = 10;
  const translation = 5 * numberOfLanguages;
  const imageGeneration = 15 * numberOfScenes;
  const narrationGeneration = 5 * numberOfScenes * numberOfLanguages;
  const subtitleGeneration = 2 * numberOfLanguages;
  const videoCreation = 30;

  return (
    storyGeneration +
    translation +
    imageGeneration +
    narrationGeneration +
    subtitleGeneration +
    videoCreation
  );
}
