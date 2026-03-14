/**
 * Royalty-Free Music Service
 * Provides a collection of free, open-source background music for videos
 * Sources: Incompetech, Free Music Archive, YouTube Audio Library
 */

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: number; // in seconds
  genre: string;
  url: string; // CDN or local URL
  license: string; // Creative Commons, Public Domain, etc.
}

// Collection of royalty-free music tracks
// In production, these would be hosted on a CDN or S3
const ROYALTY_FREE_MUSIC: MusicTrack[] = [
  {
    id: "ambient-1",
    name: "Ambient Breeze",
    artist: "Free Music Archive",
    duration: 180,
    genre: "Ambient",
    url: "https://freepd.com/music/Ambient%20Breeze.mp3",
    license: "Creative Commons 0",
  },
  {
    id: "cinematic-1",
    name: "Epic Cinematic",
    artist: "Incompetech",
    duration: 240,
    genre: "Cinematic",
    url: "https://freepd.com/music/Epic%20Cinematic.mp3",
    license: "Creative Commons Attribution",
  },
  {
    id: "upbeat-1",
    name: "Upbeat Energy",
    artist: "Free Music Archive",
    duration: 200,
    genre: "Upbeat",
    url: "https://freepd.com/music/Upbeat%20Energy.mp3",
    license: "Creative Commons 0",
  },
  {
    id: "dramatic-1",
    name: "Dramatic Tension",
    artist: "Incompetech",
    duration: 220,
    genre: "Dramatic",
    url: "https://freepd.com/music/Dramatic%20Tension.mp3",
    license: "Creative Commons Attribution",
  },
  {
    id: "peaceful-1",
    name: "Peaceful Moment",
    artist: "Free Music Archive",
    duration: 190,
    genre: "Peaceful",
    url: "https://freepd.com/music/Peaceful%20Moment.mp3",
    license: "Creative Commons 0",
  },
];

/**
 * Get all available royalty-free music tracks
 */
export function getAllMusicTracks(): MusicTrack[] {
  return ROYALTY_FREE_MUSIC;
}

/**
 * Get music track by ID
 */
export function getMusicTrackById(id: string): MusicTrack | undefined {
  return ROYALTY_FREE_MUSIC.find((track) => track.id === id);
}

/**
 * Get music tracks by genre
 */
export function getMusicTracksByGenre(genre: string): MusicTrack[] {
  return ROYALTY_FREE_MUSIC.filter(
    (track) => track.genre.toLowerCase() === genre.toLowerCase()
  );
}

/**
 * Select a random music track
 */
export function getRandomMusicTrack(): MusicTrack {
  return ROYALTY_FREE_MUSIC[Math.floor(Math.random() * ROYALTY_FREE_MUSIC.length)];
}

/**
 * Get music track suitable for video duration
 * Selects a track that fits well with the video length
 */
export function getMusicTrackForVideoDuration(
  videoDurationSeconds: number
): MusicTrack {
  // Find tracks that are close to video duration (within 20% margin)
  const suitableTracks = ROYALTY_FREE_MUSIC.filter((track) => {
    const ratio = videoDurationSeconds / track.duration;
    return ratio >= 0.8 && ratio <= 1.2;
  });

  if (suitableTracks.length > 0) {
    return suitableTracks[Math.floor(Math.random() * suitableTracks.length)];
  }

  // If no suitable track found, return longest track
  return ROYALTY_FREE_MUSIC.reduce((longest, current) =>
    current.duration > longest.duration ? current : longest
  );
}

/**
 * Get music track by genre preference
 * Returns a random track from the preferred genre, or any track if genre not found
 */
export function getMusicTrackByGenrePreference(
  preferredGenre?: string
): MusicTrack {
  if (preferredGenre) {
    const genreTracks = getMusicTracksByGenre(preferredGenre);
    if (genreTracks.length > 0) {
      return genreTracks[Math.floor(Math.random() * genreTracks.length)];
    }
  }

  return getRandomMusicTrack();
}
