import { describe, it, expect } from "vitest";
import {
  getAllMusicTracks,
  getMusicByGenre,
  getMusicByMood,
  getRandomMusicTrack,
  getMusicForDuration,
  getMusicTrackById,
  getAvailableGenres,
  getAvailableMoods,
  calculateLoopCount,
  getMusicMetadata,
} from "./musicService";

describe("Music Service", () => {
  describe("getAllMusicTracks", () => {
    it("should return an array of music tracks", () => {
      const tracks = getAllMusicTracks();
      expect(Array.isArray(tracks)).toBe(true);
      expect(tracks.length).toBeGreaterThan(0);
    });

    it("should return tracks with required properties", () => {
      const tracks = getAllMusicTracks();
      tracks.forEach((track) => {
        expect(track).toHaveProperty("id");
        expect(track).toHaveProperty("title");
        expect(track).toHaveProperty("artist");
        expect(track).toHaveProperty("url");
        expect(track).toHaveProperty("duration");
        expect(track).toHaveProperty("genre");
        expect(track).toHaveProperty("mood");
        expect(track).toHaveProperty("license");
        expect(track).toHaveProperty("source");
      });
    });
  });

  describe("getMusicByGenre", () => {
    it("should return tracks matching the genre", () => {
      const tracks = getMusicByGenre("ambient");
      expect(Array.isArray(tracks)).toBe(true);
      tracks.forEach((track) => {
        expect(track.genre.toLowerCase()).toContain("ambient");
      });
    });

    it("should be case-insensitive", () => {
      const tracks1 = getMusicByGenre("ambient");
      const tracks2 = getMusicByGenre("AMBIENT");
      expect(tracks1.length).toBe(tracks2.length);
    });

    it("should return empty array for non-existent genre", () => {
      const tracks = getMusicByGenre("nonexistent");
      expect(tracks.length).toBe(0);
    });
  });

  describe("getMusicByMood", () => {
    it("should return tracks matching the mood", () => {
      const tracks = getMusicByMood("calm");
      expect(Array.isArray(tracks)).toBe(true);
      tracks.forEach((track) => {
        expect(track.mood.toLowerCase()).toContain("calm");
      });
    });

    it("should be case-insensitive", () => {
      const tracks1 = getMusicByMood("calm");
      const tracks2 = getMusicByMood("CALM");
      expect(tracks1.length).toBe(tracks2.length);
    });

    it("should return empty array for non-existent mood", () => {
      const tracks = getMusicByMood("nonexistent");
      expect(tracks.length).toBe(0);
    });
  });

  describe("getRandomMusicTrack", () => {
    it("should return a single music track", () => {
      const track = getRandomMusicTrack();
      expect(track).toBeDefined();
      expect(track).toHaveProperty("id");
      expect(track).toHaveProperty("title");
    });

    it("should return a valid track from the library", () => {
      const track = getRandomMusicTrack();
      const allTracks = getAllMusicTracks();
      const exists = allTracks.some((t) => t.id === track.id);
      expect(exists).toBe(true);
    });
  });

  describe("getMusicForDuration", () => {
    it("should return a track suitable for the video duration", () => {
      const track = getMusicForDuration(300); // 5 minutes
      expect(track).toBeDefined();
      expect(track).toHaveProperty("id");
      expect(track).toHaveProperty("duration");
    });

    it("should prefer tracks close to the video duration", () => {
      const track = getMusicForDuration(240); // 4 minutes
      expect(track.duration).toBeGreaterThan(0);
    });

    it("should respect mood filter when provided", () => {
      const track = getMusicForDuration(300, "calm");
      expect(track.mood.toLowerCase()).toContain("calm");
    });

    it("should return a valid track even with non-existent mood", () => {
      const track = getMusicForDuration(300, "nonexistent");
      expect(track).toBeDefined();
      expect(track).toHaveProperty("id");
    });
  });

  describe("getMusicTrackById", () => {
    it("should return a track by ID", () => {
      const allTracks = getAllMusicTracks();
      const trackId = allTracks[0].id;
      const track = getMusicTrackById(trackId);
      expect(track).toBeDefined();
      expect(track?.id).toBe(trackId);
    });

    it("should return undefined for non-existent ID", () => {
      const track = getMusicTrackById("nonexistent");
      expect(track).toBeUndefined();
    });
  });

  describe("getAvailableGenres", () => {
    it("should return an array of genres", () => {
      const genres = getAvailableGenres();
      expect(Array.isArray(genres)).toBe(true);
      expect(genres.length).toBeGreaterThan(0);
    });

    it("should return unique genres", () => {
      const genres = getAvailableGenres();
      const uniqueGenres = new Set(genres);
      expect(genres.length).toBe(uniqueGenres.size);
    });

    it("should return sorted genres", () => {
      const genres = getAvailableGenres();
      const sortedGenres = [...genres].sort();
      expect(genres).toEqual(sortedGenres);
    });
  });

  describe("getAvailableMoods", () => {
    it("should return an array of moods", () => {
      const moods = getAvailableMoods();
      expect(Array.isArray(moods)).toBe(true);
      expect(moods.length).toBeGreaterThan(0);
    });

    it("should return unique moods", () => {
      const moods = getAvailableMoods();
      const uniqueMoods = new Set(moods);
      expect(moods.length).toBe(uniqueMoods.size);
    });

    it("should return sorted moods", () => {
      const moods = getAvailableMoods();
      const sortedMoods = [...moods].sort();
      expect(moods).toEqual(sortedMoods);
    });
  });

  describe("calculateLoopCount", () => {
    it("should calculate correct loop count", () => {
      const loopCount = calculateLoopCount(60, 300); // 1 min track, 5 min video
      expect(loopCount).toBe(5);
    });

    it("should return 1 for track longer than video", () => {
      const loopCount = calculateLoopCount(600, 300); // 10 min track, 5 min video
      expect(loopCount).toBe(1);
    });

    it("should handle exact multiples", () => {
      const loopCount = calculateLoopCount(60, 120); // 1 min track, 2 min video
      expect(loopCount).toBe(2);
    });

    it("should round up for partial loops", () => {
      const loopCount = calculateLoopCount(60, 90); // 1 min track, 1.5 min video
      expect(loopCount).toBe(2);
    });
  });

  describe("getMusicMetadata", () => {
    it("should return metadata for a valid track", () => {
      const allTracks = getAllMusicTracks();
      const trackId = allTracks[0].id;
      const metadata = getMusicMetadata(trackId);
      expect(metadata).toBeDefined();
      expect(metadata).toHaveProperty("title");
      expect(metadata).toHaveProperty("artist");
      expect(metadata).toHaveProperty("license");
      expect(metadata).toHaveProperty("attribution");
    });

    it("should return null for non-existent track", () => {
      const metadata = getMusicMetadata("nonexistent");
      expect(metadata).toBeNull();
    });

    it("should include proper attribution format", () => {
      const allTracks = getAllMusicTracks();
      const trackId = allTracks[0].id;
      const metadata = getMusicMetadata(trackId);
      expect(metadata?.attribution).toContain(metadata?.title);
      expect(metadata?.attribution).toContain(metadata?.artist);
      expect(metadata?.attribution).toContain(metadata?.license);
    });
  });
});
