/**
 * Subtitle generation and synchronization service
 * Generates SRT format subtitles synchronized with video narration
 */

export interface SubtitleSegment {
  index: number;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string;
}

export interface SubtitleFile {
  language: string;
  segments: SubtitleSegment[];
  srtContent: string;
}

/**
 * Generate subtitles from narration text with timing
 */
export function generateSubtitles(
  narrationText: string,
  startTime: number = 0,
  duration: number = 0
): SubtitleSegment[] {
  // Split text into sentences for subtitle segments
  const sentences = narrationText
    .split(/([.!?]+)/)
    .filter((s) => s.trim())
    .reduce((acc: string[], curr, i, arr) => {
      if (i % 2 === 0 && i + 1 < arr.length) {
        acc.push(curr + arr[i + 1]);
      } else if (i % 2 === 1 && i === arr.length - 1) {
        // Skip standalone punctuation
      }
      return acc;
    }, []);

  // If no sentences found, treat whole text as one segment
  if (sentences.length === 0) {
    sentences.push(narrationText);
  }

  // Calculate timing for each subtitle
  const totalDuration = duration || estimateNarrationDuration(narrationText);
  const timePerSegment = totalDuration / sentences.length;

  const segments: SubtitleSegment[] = sentences.map((text, index) => ({
    index: index + 1,
    startTime: startTime + index * timePerSegment,
    endTime: startTime + (index + 1) * timePerSegment,
    text: text.trim(),
  }));

  return segments;
}

/**
 * Generate SRT format content from subtitle segments
 */
export function generateSRTContent(segments: SubtitleSegment[]): string {
  return segments
    .map(
      (segment) =>
        `${segment.index}\n${formatTimestamp(segment.startTime)} --> ${formatTimestamp(segment.endTime)}\n${segment.text}\n`
    )
    .join("\n");
}

/**
 * Format time in SRT format (HH:MM:SS,mmm)
 */
function formatTimestamp(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/**
 * Estimate narration duration based on text length
 * Average speaking rate: 150 words per minute = 2.5 words per second
 */
export function estimateNarrationDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return Math.ceil((wordCount / 2.5) * 1000); // Return in milliseconds
}

/**
 * Synchronize subtitles with scene timing
 */
export function synchronizeSubtitlesWithScenes(
  narrations: Array<{
    sceneNumber: number;
    text: string;
    duration: number; // in seconds
    startTime: number; // in seconds
  }>
): SubtitleSegment[] {
  const allSegments: SubtitleSegment[] = [];

  for (const narration of narrations) {
    const startTimeMs = narration.startTime * 1000;
    const durationMs = narration.duration * 1000;

    const segments = generateSubtitles(
      narration.text,
      startTimeMs,
      durationMs
    );

    allSegments.push(...segments);
  }

  // Re-index segments
  return allSegments.map((segment, index) => ({
    ...segment,
    index: index + 1,
  }));
}

/**
 * Merge multiple subtitle files (for multilingual support)
 */
export function mergeSubtitleFiles(
  files: SubtitleFile[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const file of files) {
    result[file.language] = file.srtContent;
  }

  return result;
}

/**
 * Parse SRT content into segments
 */
export function parseSRTContent(content: string): SubtitleSegment[] {
  const blocks = content.split("\n\n").filter((b) => b.trim());
  const segments: SubtitleSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0]);
    const timings = lines[1].split(" --> ");
    if (timings.length !== 2) continue;

    const startTime = parseTimestamp(timings[0].trim());
    const endTime = parseTimestamp(timings[1].trim());
    const text = lines.slice(2).join("\n").trim();

    segments.push({
      index,
      startTime,
      endTime,
      text,
    });
  }

  return segments;
}

/**
 * Parse SRT timestamp format (HH:MM:SS,mmm)
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":");
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const secondsAndMs = parts[2].split(",");
  const seconds = parseInt(secondsAndMs[0]);
  const ms = parseInt(secondsAndMs[1]);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + ms;
}

/**
 * Create subtitle file object
 */
export function createSubtitleFile(
  language: string,
  segments: SubtitleSegment[]
): SubtitleFile {
  const srtContent = generateSRTContent(segments);

  return {
    language,
    segments,
    srtContent,
  };
}

/**
 * Adjust subtitle timing for video playback
 */
export function adjustSubtitleTiming(
  segments: SubtitleSegment[],
  offset: number // in milliseconds
): SubtitleSegment[] {
  return segments.map((segment) => ({
    ...segment,
    startTime: segment.startTime + offset,
    endTime: segment.endTime + offset,
  }));
}
