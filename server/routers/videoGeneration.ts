import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateSimpleVideo, generateDownloadableVideo } from "../services/simpleVideoGenerator";
import { getDb } from "../db";
import { videoProjects, scenes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

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

        // Get all scenes for the project
        const projectScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId));

        if (projectScenes.length === 0) {
          throw new Error("No scenes found for this project");
        }

        // Generate video
        const { videoUrl, duration } = await generateSimpleVideo(
          input.projectId,
          projectScenes.map((s) => ({
            id: s.id,
            title: s.title || "Scene",
            description: s.description,
            imagePrompt: s.imagePrompt || "",
            textContent: s.textContent,
            duration: typeof s.duration === "string" ? parseInt(s.duration) : (s.duration || 3),
          })),
          project[0].title
        );

        // Update project with video URL
        await db
          .update(videoProjects)
          .set({
            videoUrl,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        return {
          success: true,
          videoUrl,
          duration,
          sceneCount: projectScenes.length,
        };
      } catch (error) {
        console.error("[VideoGeneration] Error generating video:", error);
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

        // Get all scenes for the project
        const projectScenes = await db
          .select()
          .from(scenes)
          .where(eq(scenes.projectId, input.projectId));

        if (projectScenes.length === 0) {
          throw new Error("No scenes found for this project");
        }

        // Generate downloadable video
        const { videoUrl, duration, filename } = await generateDownloadableVideo(
          input.projectId,
          projectScenes.map((s) => ({
            id: s.id,
            title: s.title || "Scene",
            description: s.description,
            imagePrompt: s.imagePrompt || "",
            textContent: s.textContent,
            duration: typeof s.duration === "string" ? parseInt(s.duration) : (s.duration || 3),
          })),
          project[0].title
        );

        return {
          success: true,
          videoUrl,
          duration,
          filename,
          sceneCount: projectScenes.length,
        };
      } catch (error) {
        console.error("[VideoGeneration] Error generating downloadable video:", error);
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
