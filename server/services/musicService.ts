/**
 * Music Service
 * Provides royalty-free background music for videos
 * Uses a curated list of free music sources (Incompetech, Free Music Archive, etc.)
 */

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number; // in seconds
  genre: string;
  mood: string;
  license: string;
  source: "incompetech" | "freemusicarchive" | "pixabay";
}

// Curated list of royalty-free music tracks
// In production, these would be fetched from APIs like:
// - Incompetech API
// - Free Music Archive API
// - Pixabay Music API
const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "incompetech_ambient_1",
    title: "Ambient Piano",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ambient%20Piano.mp3",
    duration: 240,
    genre: "ambient",
    mood: "calm",
    license: "CC BY 3.0",
    source: "incompetech",
  },
  {
    id: "incompetech_cinematic_1",
    title: "Cinematic Drama",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Cinematic%20Drama.mp3",
    duration: 180,
    genre: "cinematic",
    mood: "dramatic",
    license: "CC BY 3.0",
    source: "incompetech",
  },
  {
    id: "incompetech_uplifting_1",
    title: "Uplifting Strings",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Uplifting%20Strings.mp3",
    duration: 210,
    genre: "orchestral",
    mood: "uplifting",
    license: "CC BY 3.0",
    source: "incompetech",
  },
  {
    id: "incompetech_electronic_1",
    title: "Electronic Beats",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Electronic%20Beats.mp3",
    duration: 200,
    genre: "electronic",
    mood: "energetic",
    license: "CC BY 3.0",
    source: "incompetech",
  },
  {
    id: "incompetech_folk_1",
    title: "Folk Guitar",
    artist: "Kevin MacLeod",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Folk%20Guitar.mp3",
    duration: 220,
    genre: "folk",
    mood: "relaxed",
    license: "CC BY 3.0",
    source: "incompetech",
  },
];

/**
 * Get all available music tracks
 */
export function getAllMusicTracks(): MusicTrack[] {
  return MUSIC_LIBRARY;
}

/**
 * Get music tracks by genre
 */
export function getMusicByGenre(genre: string): MusicTrack[] {
  return MUSIC_LIBRARY.filter((track) =>
    track.genre.toLowerCase().includes(genre.toLowerCase())
  );
}

/**
 * Get music tracks by mood
 */
export function getMusicByMood(mood: string): MusicTrack[] {
  return MUSIC_LIBRARY.filter((track) =>
    track.mood.toLowerCase().includes(mood.toLowerCase())
  );
}

/**
 * Get a random music track
 */
export function getRandomMusicTrack(): MusicTrack {
  return MUSIC_LIBRARY[Math.floor(Math.random() * MUSIC_LIBRARY.length)];
}

/**
 * Get a music track suitable for a given duration
 * Returns a track that can be looped to fit the video duration
 */
export function getMusicForDuration(
  videoDurationSeconds: number,
  mood?: string
): MusicTrack {
  let candidates = MUSIC_LIBRARY;

  // Filter by mood if provided
  if (mood) {
    candidates = candidates.filter((track) =>
      track.mood.toLowerCase().includes(mood.toLowerCase())
    );
  }

  // If no candidates after filtering, use all tracks
  if (candidates.length === 0) {
    candidates = MUSIC_LIBRARY;
  }

  // Prefer tracks that are close to the video duration
  // but can be looped if needed
  const sorted = candidates.sort((a, b) => {
    const aDiff = Math.abs(a.duration - videoDurationSeconds);
    const bDiff = Math.abs(b.duration - videoDurationSeconds);
    return aDiff - bDiff;
  });

  return sorted[0];
}

/**
 * Get music track by ID
 */
export function getMusicTrackById(id: string): MusicTrack | undefined {
  return MUSIC_LIBRARY.find((track) => track.id === id);
}

/**
 * Get available genres
 */
export function getAvailableGenres(): string[] {
  const genres = new Set(MUSIC_LIBRARY.map((track) => track.genre));
  return Array.from(genres).sort();
}

/**
 * Get available moods
 */
export function getAvailableMoods(): string[] {
  const moods = new Set(MUSIC_LIBRARY.map((track) => track.mood));
  return Array.from(moods).sort();
}

/**
 * Calculate how many times a track needs to be looped to fit video duration
 */
export function calculateLoopCount(
  trackDurationSeconds: number,
  videoDurationSeconds: number
): number {
  return Math.ceil(videoDurationSeconds / trackDurationSeconds);
}

/**
 * Get music metadata for a track
 */
export function getMusicMetadata(trackId: string): {
  title: string;
  artist: string;
  license: string;
  attribution: string;
} | null {
  const track = getMusicTrackById(trackId);
  if (!track) return null;

  return {
    title: track.title,
    artist: track.artist,
    license: track.license,
    attribution: `${track.title} by ${track.artist} (${track.license})`,
  };
}
