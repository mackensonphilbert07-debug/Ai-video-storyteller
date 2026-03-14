import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateCompleteVideo, getSceneDataFromDb } from "../services/videoPipeline";
import { getDb } from "../db";
import { videoProjects } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const generationRouter = router({
  /**
   * Generate complete video from project
   * Orchestrates: image generation -> narration -> video composition
   */
  generateVideo: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Get project details
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

        // Get scenes for the project
        const scenesList = await getSceneDataFromDb(input.projectId);

        if (scenesList.length === 0) {
          throw new Error("No scenes found for this project");
        }

        // Generate complete video
        const result = await generateCompleteVideo(
          input.projectId,
          scenesList,
          project[0].originalText,
          "fr"
        );

        if (result.status === "failed") {
          throw new Error(result.error || "Video generation failed");
        }

        // Update project with video URL
        await db
          .update(videoProjects)
          .set({
            videoUrl: result.videoUrl,
            status: "completed",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        return {
          success: true,
          videoUrl: result.videoUrl,
          duration: result.duration,
          sceneCount: result.sceneCount,
        };
      } catch (error) {
        console.error("[Generation] Error generating video:", error);
        throw error;
      }
    }),

  /**
   * Get video generation status
   */
  getGenerationStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
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
          status: project[0].status || "pending",
          videoUrl: project[0].videoUrl || null,
          createdAt: project[0].createdAt,
          updatedAt: project[0].updatedAt,
        };
      } catch (error) {
        console.error("[Generation] Error getting status:", error);
        throw error;
      }
    }),

  /**
   * Cancel video generation
   */
  cancelGeneration: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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

        await db
          .update(videoProjects)
          .set({
            status: "draft",
            updatedAt: new Date(),
          })
          .where(eq(videoProjects.id, input.projectId));

        return {
          success: true,
          message: "Generation cancelled",
        };
      } catch (error) {
        console.error("[Generation] Error cancelling generation:", error);
        throw error;
      }
    }),
});
