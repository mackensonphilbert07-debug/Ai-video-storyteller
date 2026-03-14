import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createVideoProject, getUserVideoProjects, getVideoProjectById, updateVideoProject, createScene, getProjectScenes, addToProcessingQueue } from "../db";
import { invokeLLM } from "../_core/llm";

const CreateProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  text: z.string().min(10, "Story text must be at least 10 characters"),
});

const AnalyzeTextSchema = z.object({
  projectId: z.number(),
  text: z.string(),
});

export const videoRouter = router({
  // Create a new video project
  createProject: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("User not authenticated");
      
      const project = await createVideoProject(ctx.user.id, {
        title: input.title,
        description: input.description,
        originalText: input.text,
        status: "draft",
      });
      
      return project;
    }),

  // Get all projects for the current user
  listProjects: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("User not authenticated");
    return getUserVideoProjects(ctx.user.id);
  }),

  // Get a specific project with its scenes
  getProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("User not authenticated");
      
      const project = await getVideoProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const projectScenes = await getProjectScenes(input.projectId);
      return { project, scenes: projectScenes };
    }),

  // Analyze text and generate scenes
  analyzeAndGenerateScenes: protectedProcedure
    .input(AnalyzeTextSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("User not authenticated");
      
      const project = await getVideoProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      // Update project status to processing
      await updateVideoProject(input.projectId, { status: "processing" });
      
      // Use LLM to analyze the text and generate scenes
      const analysisPrompt = `Analyze the following story and break it down into 3-5 distinct scenes. For each scene, provide:
1. A scene title
2. A brief description of what happens
3. An optimized image generation prompt (detailed, visual, specific)
4. The text content for this scene

Format your response as a JSON array with objects containing: title, description, imagePrompt, textContent

Story:
${input.text}`;
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a creative storytelling assistant. Analyze stories and break them down into vivid, visual scenes suitable for video generation. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "scene_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      imagePrompt: { type: "string" },
                      textContent: { type: "string" },
                    },
                    required: ["title", "description", "imagePrompt", "textContent"],
                  },
                },
              },
              required: ["scenes"],
            },
          },
        },
      });
      
      // Parse the response
      let sceneData;
      try {
        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") {
          sceneData = JSON.parse(content);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        await updateVideoProject(input.projectId, { status: "failed", errorMessage: "Failed to parse LLM response" });
        throw error;
      }
      
      // Create scenes in the database
      const scenes = [];
      for (let i = 0; i < sceneData.scenes.length; i++) {
        const sceneInfo = sceneData.scenes[i];
        const scene = await createScene({
          projectId: input.projectId,
          sceneNumber: i + 1,
          title: sceneInfo.title,
          description: sceneInfo.description,
          textContent: sceneInfo.textContent,
          imagePrompt: sceneInfo.imagePrompt,
          status: "pending",
        });
        scenes.push(scene);
        
        // Add to processing queue
        await addToProcessingQueue({
          projectId: input.projectId,
          sceneId: (scene as any).insertId,
          taskType: "generate_image",
          status: "pending",
          priority: i,
        });
      }
      
      // Update project with scene count
      await updateVideoProject(input.projectId, { sceneCount: sceneData.scenes.length });
      
      return { scenes: sceneData.scenes, projectId: input.projectId };
    }),
});
