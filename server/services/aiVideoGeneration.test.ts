import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateStory, parseStoryIntoScenes } from "./storyGenerationService";
import {
  generateVoiceNarration,
  generateSceneNarrations,
  calculateNarrationTiming,
} from "./xttsVoiceService";
import {
  generateSubtitles,
  generateSRTContent,
  synchronizeSubtitlesWithScenes,
  estimateNarrationDuration,
  parseSRTContent,
} from "./subtitleService";
import {
  translateText,
  translateStory,
  translateNarrations,
  getSupportedLanguages,
  isSupportedLanguage,
} from "./translationService";

describe("Story Generation Service", () => {
  it("should generate a story with valid structure", async () => {
    const result = await generateStory({
      prompt: "A brave knight saves a kingdom",
      language: "en",
      tone: "adventure",
      targetLength: "short",
    });

    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
    expect(result.content).toBeTruthy();
    expect(result.scenes).toBeInstanceOf(Array);
    expect(result.scenes.length).toBeGreaterThan(0);
    expect(result.estimatedDuration).toBeGreaterThan(0);
  });

  it("should generate scenes with proper structure", async () => {
    const result = await generateStory({
      prompt: "A magical forest adventure",
      language: "en",
      tone: "mystery",
      targetLength: "medium",
    });

    result.scenes.forEach((scene) => {
      expect(scene.sceneNumber).toBeGreaterThan(0);
      expect(scene.title).toBeTruthy();
      expect(scene.description).toBeTruthy();
      expect(scene.imagePrompt).toBeTruthy();
      expect(scene.duration).toBeGreaterThan(0);
      expect(scene.duration).toBeLessThanOrEqual(30);
    });
  });

  it("should parse story into scenes correctly", async () => {
    const storyText =
      "Once upon a time, a hero embarked on a quest. The hero climbed the mountain. At the top, the hero found treasure.";

    const scenes = await parseStoryIntoScenes(storyText, "en");

    expect(scenes).toBeInstanceOf(Array);
    expect(scenes.length).toBeGreaterThan(0);
    scenes.forEach((scene) => {
      expect(scene.sceneNumber).toBeGreaterThan(0);
      expect(scene.description).toBeTruthy();
      expect(scene.imagePrompt).toBeTruthy();
    });
  });

  it("should support multiple languages", async () => {
    const languages: Array<"fr" | "en" | "es" | "ht"> = ["en", "fr", "es"];

    for (const lang of languages) {
      const result = await generateStory({
        prompt: "A simple story",
        language: lang,
        targetLength: "short",
      });

      expect(result.language).toBe(lang);
      expect(result.scenes.length).toBeGreaterThan(0);
    }
  });
});

describe("Voice Narration Service", () => {
  it("should generate voice narration with correct properties", async () => {
    const result = await generateVoiceNarration({
      text: "This is a test narration.",
      language: "en",
      voiceCharacter: "neutral",
    });

    expect(result).toBeDefined();
    expect(result.audioUrl).toBeTruthy();
    expect(result.duration).toBeGreaterThan(0);
    expect(result.language).toBe("en");
    expect(result.textLength).toBeGreaterThan(0);
  });

  it("should calculate narration timing correctly", () => {
    const timing1 = calculateNarrationTiming(5000, 10000); // 5s narration, 10s scene
    expect(timing1.speed).toBe(1.0);
    expect(timing1.silencePadding).toBe(5000);

    const timing2 = calculateNarrationTiming(10000, 5000); // 10s narration, 5s scene
    expect(timing2.speed).toBeLessThanOrEqual(2.0);
    expect(timing2.speed).toBeGreaterThan(0);
  });

  it("should generate narrations for multiple scenes", async () => {
    const scenes = [
      { sceneNumber: 1, description: "First scene description" },
      { sceneNumber: 2, description: "Second scene description" },
    ];

    const narrations = await generateSceneNarrations(scenes, "en", "neutral");

    expect(narrations).toHaveLength(2);
    narrations.forEach((narration) => {
      expect(narration.sceneNumber).toBeGreaterThan(0);
      expect(narration.audioUrl).toBeTruthy();
      expect(narration.duration).toBeGreaterThan(0);
    });
  });

  it("should support multiple voice characters", async () => {
    const characters: Array<"male" | "female" | "neutral"> = [
      "male",
      "female",
      "neutral",
    ];

    for (const char of characters) {
      const result = await generateVoiceNarration({
        text: "Test",
        language: "en",
        voiceCharacter: char,
      });

      expect(result.voiceCharacter).toBe(char);
    }
  });
});

describe("Subtitle Service", () => {
  it("should generate subtitles with correct timing", () => {
    const text = "First sentence. Second sentence. Third sentence.";
    const segments = generateSubtitles(text, 0, 9000); // 9 seconds total

    expect(segments).toBeInstanceOf(Array);
    expect(segments.length).toBeGreaterThan(0);

    segments.forEach((segment) => {
      expect(segment.index).toBeGreaterThan(0);
      expect(segment.startTime).toBeGreaterThanOrEqual(0);
      expect(segment.endTime).toBeGreaterThan(segment.startTime);
      expect(segment.text).toBeTruthy();
    });
  });

  it("should generate valid SRT content", () => {
    const segments = [
      { index: 1, startTime: 0, endTime: 2000, text: "First subtitle" },
      { index: 2, startTime: 2000, endTime: 4000, text: "Second subtitle" },
    ];

    const srtContent = generateSRTContent(segments);

    expect(srtContent).toContain("1");
    expect(srtContent).toContain("00:00:00,000 --> 00:00:02,000");
    expect(srtContent).toContain("First subtitle");
    expect(srtContent).toContain("2");
    expect(srtContent).toContain("00:00:02,000 --> 00:00:04,000");
    expect(srtContent).toContain("Second subtitle");
  });

  it("should estimate narration duration correctly", () => {
    const text = "This is a test. It has multiple words."; // 7 words
    const duration = estimateNarrationDuration(text);

    // Average: 2.5 words per second
    // 7 words / 2.5 = 2.8 seconds = 2800ms
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5000);
  });

  it("should parse SRT content correctly", () => {
    const srtContent = `1
00:00:00,000 --> 00:00:02,000
First subtitle

2
00:00:02,000 --> 00:00:04,000
Second subtitle`;

    const segments = parseSRTContent(srtContent);

    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe("First subtitle");
    expect(segments[1].text).toBe("Second subtitle");
  });

  it("should synchronize subtitles with scenes", () => {
    const narrations = [
      {
        sceneNumber: 1,
        text: "First scene narration.",
        duration: 5,
        startTime: 0,
      },
      {
        sceneNumber: 2,
        text: "Second scene narration.",
        duration: 5,
        startTime: 5,
      },
    ];

    const segments = synchronizeSubtitlesWithScenes(narrations);

    expect(segments.length).toBeGreaterThan(0);
    segments.forEach((segment) => {
      expect(segment.index).toBeGreaterThan(0);
      expect(segment.startTime).toBeGreaterThanOrEqual(0);
      expect(segment.endTime).toBeGreaterThan(segment.startTime);
    });
  });
});

describe("Translation Service", () => {
  it("should translate text to target languages", async () => {
    const result = await translateText({
      text: "Hello world",
      sourceLanguage: "en",
      targetLanguages: ["fr", "es"],
    });

    expect(result.original).toBe("Hello world");
    expect(result.sourceLanguage).toBe("en");
    expect(result.translations.en).toBe("Hello world");
    expect(result.translations.fr).toBeTruthy();
    expect(result.translations.es).toBeTruthy();
  });

  it("should get supported languages", () => {
    const languages = getSupportedLanguages();

    expect(languages).toHaveProperty("fr");
    expect(languages).toHaveProperty("en");
    expect(languages).toHaveProperty("es");
    expect(languages).toHaveProperty("ht");
  });

  it("should validate supported languages", () => {
    expect(isSupportedLanguage("en")).toBe(true);
    expect(isSupportedLanguage("fr")).toBe(true);
    expect(isSupportedLanguage("es")).toBe(true);
    expect(isSupportedLanguage("ht")).toBe(true);
    expect(isSupportedLanguage("de")).toBe(false);
    expect(isSupportedLanguage("invalid")).toBe(false);
  });

  it("should translate story to multiple languages", async () => {
    const story = {
      title: "Adventure Story",
      description: "A thrilling adventure",
      content: "Once upon a time...",
      scenes: [
        {
          sceneNumber: 1,
          title: "Scene 1",
          description: "The beginning",
          imagePrompt: "A beautiful landscape",
        },
      ],
    };

    const translations = await translateStory(story, "en", ["fr", "es"]);

    expect(translations.en).toBeDefined();
    expect(translations.fr).toBeDefined();
    expect(translations.es).toBeDefined();

    // Check structure is preserved
    Object.values(translations).forEach((translatedStory) => {
      expect(translatedStory.title).toBeTruthy();
      expect(translatedStory.scenes).toBeInstanceOf(Array);
    });
  });

  it("should translate narrations for multiple languages", async () => {
    const narrations = [
      { sceneNumber: 1, text: "First narration" },
      { sceneNumber: 2, text: "Second narration" },
    ];

    const translations = await translateNarrations(narrations, "en", ["fr", "es"]);

    expect(translations.en).toBeDefined();
    expect(translations.fr).toBeDefined();
    expect(translations.es).toBeDefined();

    Object.values(translations).forEach((translatedNarrations) => {
      expect(translatedNarrations).toHaveLength(2);
      translatedNarrations.forEach((narration) => {
        expect(narration.sceneNumber).toBeGreaterThan(0);
        expect(narration.text).toBeTruthy();
      });
    });
  });
});

describe("Integration Tests", () => {
  it("should handle complete workflow from story to subtitles", async () => {
    // Generate story
    const story = await generateStory({
      prompt: "A hero's journey",
      language: "en",
      targetLength: "short",
    });

    expect(story.scenes.length).toBeGreaterThan(0);

    // Generate narrations
    const narrations = await generateSceneNarrations(
      story.scenes,
      "en",
      "neutral"
    );

    expect(narrations).toHaveLength(story.scenes.length);

    // Generate subtitles
    const subtitleNarrations = story.scenes.map((scene, index) => ({
      sceneNumber: scene.sceneNumber,
      text: scene.description,
      duration: scene.duration,
      startTime: story.scenes
        .slice(0, index)
        .reduce((sum, s) => sum + s.duration, 0),
    }));

    const segments = synchronizeSubtitlesWithScenes(subtitleNarrations);
    const srtContent = generateSRTContent(segments);

    expect(segments.length).toBeGreaterThan(0);
    expect(srtContent).toContain("-->");
  });

  it("should handle multilingual workflow", async () => {
    const story = await generateStory({
      prompt: "A simple tale",
      language: "en",
      targetLength: "short",
    });

    // Translate story
    const translations = await translateStory(story, "en", ["fr", "es"]);

    expect(Object.keys(translations)).toContain("en");
    expect(Object.keys(translations)).toContain("fr");
    expect(Object.keys(translations)).toContain("es");

    // Each translation should have valid structure
    Object.values(translations).forEach((translatedStory) => {
      expect(translatedStory.scenes.length).toBe(story.scenes.length);
    });
  });
});
