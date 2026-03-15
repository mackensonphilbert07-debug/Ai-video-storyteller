import { invokeLLM } from "../_core/llm";

export interface StoryGenerationRequest {
  prompt: string;
  language?: "fr" | "en" | "es" | "ht";
  tone?: "adventure" | "mystery" | "comedy" | "drama" | "educational";
  targetLength?: "short" | "medium" | "long"; // 1-2 min, 2-3 min, 3-5 min
}

export interface GeneratedStory {
  title: string;
  description: string;
  content: string;
  estimatedDuration: number; // in seconds
  language: string;
  tone: string;
  scenes: SceneDescription[];
}

export interface SceneDescription {
  sceneNumber: number;
  title: string;
  description: string;
  imagePrompt: string;
  duration: number; // in seconds
  narration?: string;
}

/**
 * Generate a complete story from a user prompt using LLM
 */
export async function generateStory(
  request: StoryGenerationRequest
): Promise<GeneratedStory> {
  const language = request.language || "en";
  const tone = request.tone || "adventure";
  const targetLength = request.targetLength || "medium";

  // Determine target scene count based on length
  const sceneCountMap = {
    short: { min: 5, max: 8, duration: 60 },
    medium: { min: 10, max: 15, duration: 180 },
    long: { min: 15, max: 20, duration: 300 },
  };

  const { min: minScenes, max: maxScenes, duration: targetDuration } =
    sceneCountMap[targetLength];

  const systemPrompt = `You are a creative storyteller AI. Generate engaging, vivid stories for video content.
Your stories should be:
- Visually descriptive (good for generating images)
- Paced for video (clear scene breaks)
- Appropriate for the specified tone
- Optimized for voice narration

Generate stories in ${language === "fr" ? "French" : language === "es" ? "Spanish" : language === "ht" ? "Haitian Creole" : "English"}.
Tone: ${tone}
Target: ${minScenes}-${maxScenes} scenes, approximately ${targetDuration} seconds total.`;

  const userPrompt = `Create a ${targetLength} story based on this prompt: "${request.prompt}"

Return a JSON object with this structure:
{
  "title": "Story Title",
  "description": "One-line description",
  "content": "Full story text",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene Title",
      "description": "Detailed scene description for narration",
      "imagePrompt": "Detailed image generation prompt",
      "duration": 10
    }
  ]
}

Requirements:
- Generate exactly ${minScenes}-${maxScenes} scenes
- Each scene duration should average ${Math.round(targetDuration / (minScenes + maxScenes) / 2)} seconds
- Make image prompts detailed and visual
- Ensure smooth transitions between scenes
- Keep narration concise but engaging`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "story_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              content: { type: "string" },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sceneNumber: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    imagePrompt: { type: "string" },
                    duration: { type: "number" },
                  },
                  required: [
                    "sceneNumber",
                    "title",
                    "description",
                    "imagePrompt",
                    "duration",
                  ],
                },
              },
            },
            required: ["title", "description", "content", "scenes"],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    const storyData = JSON.parse(content);

    // Validate and normalize scenes
    const scenes = (storyData.scenes || []).map(
      (scene: any, index: number) => ({
        sceneNumber: index + 1,
        title: scene.title || `Scene ${index + 1}`,
        description: scene.description || "",
        imagePrompt: scene.imagePrompt || "",
        duration: Math.max(5, Math.min(30, scene.duration || 10)),
      })
    );

    // Ensure we have the right number of scenes
    if (scenes.length < minScenes) {
      console.warn(
        `Generated ${scenes.length} scenes, expected ${minScenes}-${maxScenes}`
      );
    }

    const totalDuration = scenes.reduce((sum: number, s: SceneDescription) => sum + s.duration, 0);

    return {
      title: storyData.title || "Untitled Story",
      description: storyData.description || "",
      content: storyData.content || "",
      estimatedDuration: totalDuration,
      language: language,
      tone: tone,
      scenes: scenes,
    };
  } catch (error) {
    console.error("Error generating story:", error);
    throw new Error(
      `Failed to generate story: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Generate story from existing text (parse into scenes)
 */
export async function parseStoryIntoScenes(
  storyText: string,
  language: string = "en"
): Promise<SceneDescription[]> {
  const systemPrompt = `You are an expert at breaking down stories into visual scenes.
Analyze the provided story and create scene descriptions that are:
- Visually descriptive
- Good for image generation
- Properly paced for video
- Clear and concise

Respond in ${language === "fr" ? "French" : language === "es" ? "Spanish" : language === "ht" ? "Haitian Creole" : "English"}.`;

  const userPrompt = `Break down this story into ${Math.min(20, Math.max(5, Math.ceil(storyText.length / 500)))} scenes:

"${storyText}"

Return a JSON array of scenes with this structure:
[
  {
    "sceneNumber": 1,
    "title": "Scene Title",
    "description": "Description for narration",
    "imagePrompt": "Detailed image generation prompt",
    "duration": 10
  }
]

Requirements:
- Each scene should be 5-30 seconds
- Image prompts should be detailed and visual
- Descriptions should be suitable for voice narration
- Ensure smooth transitions`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "story_scenes",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sceneNumber: { type: "number" },
                title: { type: "string" },
                description: { type: "string" },
                imagePrompt: { type: "string" },
                duration: { type: "number" },
              },
              required: [
                "sceneNumber",
                "title",
                "description",
                "imagePrompt",
                "duration",
              ],
            },
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    const scenes = JSON.parse(content);
    return scenes.map((scene: any, index: number) => ({
      sceneNumber: index + 1,
      title: scene.title || `Scene ${index + 1}`,
      description: scene.description || "",
      imagePrompt: scene.imagePrompt || "",
      duration: Math.max(5, Math.min(30, scene.duration || 10)),
    }));
  } catch (error) {
    console.error("Error parsing story into scenes:", error);
    throw new Error(
      `Failed to parse story: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
