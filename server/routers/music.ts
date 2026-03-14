import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
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
} from "../services/musicService";

export const musicRouter = router({
  /**
   * Get all available music tracks
   */
  getAllTracks: publicProcedure.query(() => {
    return getAllMusicTracks();
  }),

  /**
   * Get music tracks by genre
   */
  getByGenre: publicProcedure
    .input(z.object({ genre: z.string() }))
    .query(({ input }) => {
      return getMusicByGenre(input.genre);
    }),

  /**
   * Get music tracks by mood
   */
  getByMood: publicProcedure
    .input(z.object({ mood: z.string() }))
    .query(({ input }) => {
      return getMusicByMood(input.mood);
    }),

  /**
   * Get a random music track
   */
  getRandom: publicProcedure.query(() => {
    return getRandomMusicTrack();
  }),

  /**
   * Get music track suitable for a given video duration
   */
  getForDuration: publicProcedure
    .input(
      z.object({
        videoDurationSeconds: z.number().min(1),
        mood: z.string().optional(),
      })
    )
    .query(({ input }) => {
      return getMusicForDuration(input.videoDurationSeconds, input.mood);
    }),

  /**
   * Get music track by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      const track = getMusicTrackById(input.id);
      if (!track) {
        throw new Error(`Music track not found: ${input.id}`);
      }
      return track;
    }),

  /**
   * Get available genres
   */
  getAvailableGenres: publicProcedure.query(() => {
    return getAvailableGenres();
  }),

  /**
   * Get available moods
   */
  getAvailableMoods: publicProcedure.query(() => {
    return getAvailableMoods();
  }),

  /**
   * Calculate loop count for a music track
   */
  calculateLoopCount: publicProcedure
    .input(
      z.object({
        trackDurationSeconds: z.number().min(1),
        videoDurationSeconds: z.number().min(1),
      })
    )
    .query(({ input }) => {
      return calculateLoopCount(
        input.trackDurationSeconds,
        input.videoDurationSeconds
      );
    }),

  /**
   * Get music metadata for attribution
   */
  getMetadata: publicProcedure
    .input(z.object({ trackId: z.string() }))
    .query(({ input }) => {
      const metadata = getMusicMetadata(input.trackId);
      if (!metadata) {
        throw new Error(`Music track not found: ${input.trackId}`);
      }
      return metadata;
    }),
});
