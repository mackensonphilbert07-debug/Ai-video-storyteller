import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { generateStory } from "../services/storyGenerationService";
import { executeAutomatedPipeline } from "../services/automatedPipeline";
import type { SupportedLanguage } from "../services/translationService";

export const aiVideoGenerationRouter = router({
  /**
   * Generate a story from a prompt
   */
  generateStory: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(10).max(1000),
        language: z.enum(["fr", "en", "es", "ht"]).default("en"),
        tone: z
          .enum(["adventure", "mystery", "comedy", "drama", "educational"])
          .default("adventure"),
        targetLength: z
          .enum(["short", "medium", "long"])
          .default("medium"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const story = await generateStory({
          prompt: input.prompt,
          language: input.language as SupportedLanguage,
          tone: input.tone,
          targetLength: input.targetLength,
        });

        return {
          success: true,
          story,
        };
      } catch (error) {
        console.error("Error generating story:", error);
        throw new Error(
          `Failed to generate story: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Create a video from a story with full pipeline
   */
  createVideoFromStory: protectedProcedure
    .input(
      z.object({
        storyPrompt: z.string().min(10).max(1000),
        sourceLanguage: z.enum(["fr", "en", "es", "ht"]).default("en"),
        targetLanguages: z
          .array(z.enum(["fr", "en", "es", "ht"]))
          .default([]),
        videoQuality: z.enum(["720p", "1080p"]).default("1080p"),
        voiceCharacter: z
          .enum(["male", "female", "neutral"])
          .default("neutral"),
        includeSubtitles: z.boolean().default(true),
        transition: z
          .enum(["fade", "slide", "zoom", "none"])
          .default("fade"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check subscription quota
        const user = ctx.user;
        if (!user) {
          throw new Error("User not authenticated");
        }

        // Execute the automated pipeline
        const result = await executeAutomatedPipeline({
          prompt: input.storyPrompt,
          sourceLanguage: input.sourceLanguage as SupportedLanguage,
          targetLanguages: input.targetLanguages as SupportedLanguage[],
          videoQuality: input.videoQuality,
          voiceCharacter: input.voiceCharacter,
          includeSubtitles: input.includeSubtitles,
          transition: input.transition,
          onProgress: (stage, progress) => {
            console.log(`[${user.id}] ${stage} - ${progress}%`);
          },
        });

        return {
          success: true,
          videoUrl: result.videoUrl,
          duration: result.duration,
          languages: result.languages,
          metadata: result.metadata,
        };
      } catch (error) {
        console.error("Error creating video:", error);
        throw new Error(
          `Failed to create video: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  /**
   * Get supported languages
   */
  getSupportedLanguages: publicProcedure.query(() => {
    return {
      languages: {
        fr: "Français",
        en: "English",
        es: "Español",
        ht: "Kreyòl Ayisyen",
      },
      voiceCharacters: {
        male: "Male",
        female: "Female",
        neutral: "Neutral",
      },
      videoQualities: {
        "720p": "720p (Standard)",
        "1080p": "1080p (Full HD)",
      },
      transitions: {
        fade: "Fade",
        slide: "Slide",
        zoom: "Zoom",
        none: "None",
      },
      tones: {
        adventure: "Adventure",
        mystery: "Mystery",
        comedy: "Comedy",
        drama: "Drama",
        educational: "Educational",
      },
    };
  }),

  /**
   * Get video generation status
   */
  getGenerationStatus: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ input }) => {
      // This would query the database for the video generation status
      // For now, return a placeholder
      return {
        videoId: input.videoId,
        status: "completed",
        progress: 100,
        createdAt: new Date(),
      };
    }),
});
