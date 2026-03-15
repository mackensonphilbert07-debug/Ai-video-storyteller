import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateSubtitles,
  generateSRTContent,
  synchronizeSubtitlesWithScenes,
  estimateNarrationDuration,
  parseSRTContent,
  createSubtitleFile,
  adjustSubtitleTiming,
} from "./subtitleService";
import {
  getSupportedLanguages,
  isSupportedLanguage,
} from "./translationService";
import { calculateNarrationTiming } from "./xttsVoiceService";

describe("Subtitle Service (Mocked Tests)", () => {
  describe("generateSubtitles", () => {
    it("should generate subtitles from text", () => {
      const text = "First sentence. Second sentence. Third sentence.";
      const segments = generateSubtitles(text, 0, 9000);

      expect(segments).toBeInstanceOf(Array);
      expect(segments.length).toBeGreaterThan(0);
      expect(segments[0].index).toBe(1);
    });

    it("should handle empty text", () => {
      const segments = generateSubtitles("", 0, 5000);
      expect(segments).toBeInstanceOf(Array);
    });

    it("should set correct timing for segments", () => {
      const text = "First. Second. Third.";
      const segments = generateSubtitles(text, 0, 6000);

      segments.forEach((segment) => {
        expect(segment.startTime).toBeGreaterThanOrEqual(0);
        expect(segment.endTime).toBeGreaterThan(segment.startTime);
        expect(segment.text).toBeTruthy();
      });
    });

    it("should apply start time offset", () => {
      const text = "Test sentence.";
      const segments = generateSubtitles(text, 5000, 5000);

      expect(segments[0].startTime).toBeGreaterThanOrEqual(5000);
    });
  });

  describe("generateSRTContent", () => {
    it("should generate valid SRT format", () => {
      const segments = [
        { index: 1, startTime: 0, endTime: 2000, text: "First" },
        { index: 2, startTime: 2000, endTime: 4000, text: "Second" },
      ];

      const srt = generateSRTContent(segments);

      expect(srt).toContain("1");
      expect(srt).toContain("00:00:00,000 --> 00:00:02,000");
      expect(srt).toContain("First");
      expect(srt).toContain("2");
      expect(srt).toContain("00:00:02,000 --> 00:00:04,000");
      expect(srt).toContain("Second");
    });

    it("should format timestamps correctly", () => {
      const segments = [
        { index: 1, startTime: 3661000, endTime: 3663000, text: "Test" }, // 1:01:01 to 1:01:03
      ];

      const srt = generateSRTContent(segments);

      expect(srt).toContain("01:01:01,000 --> 01:01:03,000");
    });
  });

  describe("parseSRTContent", () => {
    it("should parse valid SRT content", () => {
      const srt = `1
00:00:00,000 --> 00:00:02,000
First subtitle

2
00:00:02,000 --> 00:00:04,000
Second subtitle`;

      const segments = parseSRTContent(srt);

      expect(segments).toHaveLength(2);
      expect(segments[0].text).toBe("First subtitle");
      expect(segments[1].text).toBe("Second subtitle");
    });

    it("should handle multiline subtitles", () => {
      const srt = `1
00:00:00,000 --> 00:00:02,000
First line
Second line

2
00:00:02,000 --> 00:00:04,000
Third subtitle`;

      const segments = parseSRTContent(srt);

      expect(segments).toHaveLength(2);
      expect(segments[0].text).toContain("First line");
      expect(segments[0].text).toContain("Second line");
    });

    it("should parse timestamps correctly", () => {
      const srt = `1
01:30:45,500 --> 01:30:50,750
Test`;

      const segments = parseSRTContent(srt);

      expect(segments[0].startTime).toBe(5445500); // 1:30:45.500 in ms
      expect(segments[0].endTime).toBe(5450750); // 1:30:50.750 in ms
    });
  });

  describe("estimateNarrationDuration", () => {
    it("should estimate duration based on word count", () => {
      const text = "This is a test."; // 4 words
      const duration = estimateNarrationDuration(text);

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000);
    });

    it("should handle long text", () => {
      const text = "word ".repeat(100); // 100 words
      const duration = estimateNarrationDuration(text);

      // 100 words / 2.5 words per second = 40 seconds
      expect(duration).toBeGreaterThan(35000);
      expect(duration).toBeLessThan(45000);
    });

    it("should handle empty text", () => {
      const duration = estimateNarrationDuration("");
      // Empty string still has minimum duration
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("synchronizeSubtitlesWithScenes", () => {
    it("should synchronize subtitles with scene timing", () => {
      const narrations = [
        {
          sceneNumber: 1,
          text: "First scene.",
          duration: 5,
          startTime: 0,
        },
        {
          sceneNumber: 2,
          text: "Second scene.",
          duration: 5,
          startTime: 5,
        },
      ];

      const segments = synchronizeSubtitlesWithScenes(narrations);

      expect(segments.length).toBeGreaterThan(0);
      segments.forEach((segment) => {
        expect(segment.startTime).toBeGreaterThanOrEqual(0);
        expect(segment.endTime).toBeGreaterThan(segment.startTime);
      });
    });

    it("should maintain correct order", () => {
      const narrations = [
        {
          sceneNumber: 1,
          text: "First.",
          duration: 3,
          startTime: 0,
        },
        {
          sceneNumber: 2,
          text: "Second.",
          duration: 3,
          startTime: 3,
        },
        {
          sceneNumber: 3,
          text: "Third.",
          duration: 3,
          startTime: 6,
        },
      ];

      const segments = synchronizeSubtitlesWithScenes(narrations);

      expect(segments[0].index).toBe(1);
      expect(segments[segments.length - 1].index).toBe(segments.length);
    });
  });

  describe("createSubtitleFile", () => {
    it("should create subtitle file with language", () => {
      const segments = [
        { index: 1, startTime: 0, endTime: 2000, text: "Test" },
      ];

      const file = createSubtitleFile("en", segments);

      expect(file.language).toBe("en");
      expect(file.segments).toEqual(segments);
      expect(file.srtContent).toContain("Test");
    });
  });

  describe("adjustSubtitleTiming", () => {
    it("should adjust timing with offset", () => {
      const segments = [
        { index: 1, startTime: 0, endTime: 2000, text: "Test" },
      ];

      const adjusted = adjustSubtitleTiming(segments, 5000);

      expect(adjusted[0].startTime).toBe(5000);
      expect(adjusted[0].endTime).toBe(7000);
    });

    it("should handle negative offset", () => {
      const segments = [
        { index: 1, startTime: 5000, endTime: 7000, text: "Test" },
      ];

      const adjusted = adjustSubtitleTiming(segments, -2000);

      expect(adjusted[0].startTime).toBe(3000);
      expect(adjusted[0].endTime).toBe(5000);
    });
  });
});

describe("Translation Service (Mocked Tests)", () => {
  describe("getSupportedLanguages", () => {
    it("should return all supported languages", () => {
      const languages = getSupportedLanguages();

      expect(languages).toHaveProperty("fr");
      expect(languages).toHaveProperty("en");
      expect(languages).toHaveProperty("es");
      expect(languages).toHaveProperty("ht");
    });

    it("should return language names", () => {
      const languages = getSupportedLanguages();

      Object.values(languages).forEach((name) => {
        expect(typeof name).toBe("string");
        expect(name.length).toBeGreaterThan(0);
      });
    });
  });

  describe("isSupportedLanguage", () => {
    it("should identify supported languages", () => {
      expect(isSupportedLanguage("en")).toBe(true);
      expect(isSupportedLanguage("fr")).toBe(true);
      expect(isSupportedLanguage("es")).toBe(true);
      expect(isSupportedLanguage("ht")).toBe(true);
    });

    it("should reject unsupported languages", () => {
      expect(isSupportedLanguage("de")).toBe(false);
      expect(isSupportedLanguage("pt")).toBe(false);
      expect(isSupportedLanguage("invalid")).toBe(false);
      expect(isSupportedLanguage("")).toBe(false);
    });
  });
});

describe("Voice Narration Service (Mocked Tests)", () => {
  describe("calculateNarrationTiming", () => {
    it("should calculate timing when narration is shorter than scene", () => {
      const timing = calculateNarrationTiming(5000, 10000); // 5s narration, 10s scene

      expect(timing.speed).toBe(1.0);
      expect(timing.silencePadding).toBe(5000);
    });

    it("should calculate timing when narration is longer than scene", () => {
      const timing = calculateNarrationTiming(10000, 5000); // 10s narration, 5s scene

      expect(timing.speed).toBeLessThanOrEqual(2.0);
      expect(timing.speed).toBeGreaterThan(0);
      expect(timing.silencePadding).toBe(0);
    });

    it("should handle equal duration", () => {
      const timing = calculateNarrationTiming(5000, 5000);

      expect(timing.speed).toBe(1.0);
      expect(timing.silencePadding).toBe(0);
    });

    it("should handle zero narration duration", () => {
      const timing = calculateNarrationTiming(0, 5000);

      expect(timing.speed).toBe(1.0);
      expect(timing.silencePadding).toBe(5000);
    });

    it("should cap speed at 2.0", () => {
      const timing = calculateNarrationTiming(100, 5000); // Very short narration

      expect(timing.speed).toBeLessThanOrEqual(2.0);
    });
  });
});

describe("Integration Tests (Mocked)", () => {
  it("should create complete subtitle workflow", () => {
    // Create narrations
    const narrations = [
      { sceneNumber: 1, text: "First scene.", duration: 5, startTime: 0 },
      { sceneNumber: 2, text: "Second scene.", duration: 5, startTime: 5 },
    ];

    // Synchronize subtitles
    const segments = synchronizeSubtitlesWithScenes(narrations);

    // Generate SRT
    const srtContent = generateSRTContent(segments);

    // Parse back
    const parsed = parseSRTContent(srtContent);

    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].text).toBeTruthy();
  });

  it("should handle multilingual subtitle generation", () => {
    const languages = getSupportedLanguages();
    const segmentsByLanguage: Record<string, string> = {};

    Object.keys(languages).forEach((lang) => {
      const segments = [
        { index: 1, startTime: 0, endTime: 2000, text: `Test in ${lang}` },
      ];
      segmentsByLanguage[lang] = generateSRTContent(segments);
    });

    expect(Object.keys(segmentsByLanguage)).toHaveLength(4);
    Object.values(segmentsByLanguage).forEach((srt) => {
      expect(srt).toContain("-->");
    });
  });
});
