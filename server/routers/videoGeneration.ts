import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateSimpleVideo, generateDownloadableVideo } from "../services/simpleVideoGenerator";
import { getDb, getUserSubscription, getUserUsageForMonth, incrementUserVideoCount } from "../db";
import { videoProjects, scenes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const videoGenerationRouter = router({
  /**
   * Generate images and create a video from project scenes
   */
  generateProjectVideo: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (!project || project.length === 0) {
          throw new Error("Project not found");
        }

        if (project[0].userId !== ctx.user.id) {
          throw new Error("Unauthorized: You do not own this project");
        }

        // Check subscription quota
        const subscription = await getUserSubscription(ctx.user.id);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usage = await getUserUsageForMonth(ctx.user.id, currentMonth);

        // Get plan limits
        const planLimits: Record<number, { videos: number; duration: number; characters: number }> = {
          1: { videos: 5, duration: 300, characters: 5000 },
          2: { videos: Infinity, duration: 300, characters: 5000 },
          3: { videos: Infinity, duration: 600, characters: 20000 },
          4: { videos: Infinity, duration: Infinity, characters: 30000 },
        };

        const planId = subscription?.planId || 1;
        const limits = planLimits[planId] || planLimits[1];

        // Check video count limit
        if (limits.videos !== Infinity) {
          const videosGenerated = usage?.videosGenerated || 0;
          if (videosGenerated >= limits.videos) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `You have reached your monthly video limit (${limits.videos} videos). Upgrade your plan to generate more videos.`,
            });
          }
        }

        // Check story length
        const storyLength = project[0].originalText?.length || 0;
        if (storyLength > limits.characters) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Story length (${storyLength} chars) exceeds your plan limit (${limits.characters} chars). Upgrade your plan to use longer stories.`,
          });
        }

        // Get all scenes for the project
        const projectScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId));

        if (projectScenes.length === 0) {
          throw new Error("No scenes found for this project");
        }

        // Generate video
        const { videoUrl, duration, musicTrack } = await generateSimpleVideo(
          input.projectId,
          projectScenes.map((s) => ({
            id: s.id,
            title: s.title || "Scene",
            description: s.description,
            imagePrompt: s.imagePrompt || "",
            textContent: s.textContent,
            duration: typeof s.duration === "string" ? parseInt(s.duration) : (s.duration || 3),
          })),
          project[0].title,
          { includeMusicTrack: true }
        );

        // Check duration limit after generation
        if (limits.duration !== Infinity && duration > limits.duration) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Video duration (${Math.ceil(duration / 60)} min) exceeds your plan limit (${Math.ceil(limits.duration / 60)} min). Upgrade your plan for longer videos.`,
          });
        }

        // Update project with video URL
        await db
          .update(videoProjects)
          .set({
            videoUrl,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        // Track usage
        await incrementUserVideoCount(ctx.user.id, currentMonth, storyLength, Math.ceil(duration / 60));

        return {
          success: true,
          videoUrl,
          duration,
          sceneCount: projectScenes.length,
          musicTrack,
        };
      } catch (error) {
        console.error("[VideoGeneration] Error generating video:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new Error(error instanceof Error ? error.message : "Failed to generate video");
      }
    }),

  /**
   * Generate a downloadable MP4 video
   */
  generateDownloadableVideo: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Verify project ownership
        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (!project || project.length === 0) {
          throw new Error("Project not found");
        }

        if (project[0].userId !== ctx.user.id) {
          throw new Error("Unauthorized: You do not own this project");
        }

        // Check subscription quota
        const subscription = await getUserSubscription(ctx.user.id);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const usage = await getUserUsageForMonth(ctx.user.id, currentMonth);

        // Get plan limits
        const planLimits: Record<number, { videos: number; duration: number; characters: number }> = {
          1: { videos: 5, duration: 300, characters: 5000 },
          2: { videos: Infinity, duration: 300, characters: 5000 },
          3: { videos: Infinity, duration: 600, characters: 20000 },
          4: { videos: Infinity, duration: Infinity, characters: 30000 },
        };

        const planId = subscription?.planId || 1;
        const limits = planLimits[planId] || planLimits[1];

        // Check video count limit
        if (limits.videos !== Infinity) {
          const videosGenerated = usage?.videosGenerated || 0;
          if (videosGenerated >= limits.videos) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `You have reached your monthly video limit (${limits.videos} videos). Upgrade your plan to generate more videos.`,
            });
          }
        }

        // Check story length
        const storyLength = project[0].originalText?.length || 0;
        if (storyLength > limits.characters) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Story length (${storyLength} chars) exceeds your plan limit (${limits.characters} chars). Upgrade your plan to use longer stories.`,
          });
        }

        // Get all scenes for the project
        const projectScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId));

        if (projectScenes.length === 0) {
          throw new Error("No scenes found for this project");
        }

        // Generate downloadable video
        const { videoUrl, duration, filename, musicTrack } = await generateDownloadableVideo(
          input.projectId,
          projectScenes.map((s) => ({
            id: s.id,
            title: s.title || "Scene",
            description: s.description,
            imagePrompt: s.imagePrompt || "",
            textContent: s.textContent,
            duration: typeof s.duration === "string" ? parseInt(s.duration) : (s.duration || 3),
          })),
          project[0].title,
          { includeMusicTrack: true }
        );

        // Check duration limit after generation
        if (limits.duration !== Infinity && duration > limits.duration) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Video duration (${Math.ceil(duration / 60)} min) exceeds your plan limit (${Math.ceil(limits.duration / 60)} min). Upgrade your plan for longer videos.`,
          });
        }

        // Track usage
        await incrementUserVideoCount(ctx.user.id, currentMonth, storyLength, Math.ceil(duration / 60));

        return {
          success: true,
          videoUrl,
          duration,
          filename,
          sceneCount: projectScenes.length,
          musicTrack,
        };
      } catch (error) {
        console.error("[VideoGeneration] Error generating downloadable video:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new Error(error instanceof Error ? error.message : "Failed to generate downloadable video");
      }
    }),

  /**
   * Get video generation status
   */
  getVideoStatus: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const project = await db
          .select()
          .from(videoProjects)
          .where(eq(videoProjects.id, input.projectId))
          .limit(1);

        if (!project || project.length === 0) {
          throw new Error("Project not found");
        }

        if (project[0].userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        return {
          projectId: input.projectId,
          status: project[0].status,
          videoUrl: project[0].videoUrl,
          createdAt: project[0].createdAt,
          updatedAt: project[0].updatedAt,
        };
      } catch (error) {
        console.error("[VideoGeneration] Error getting video status:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to get video status");
      }
    }),
});
