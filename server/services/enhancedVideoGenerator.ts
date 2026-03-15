import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface VideoScene {
  sceneNumber: number;
  imageUrl: string;
  audioUrl?: string | undefined;
  duration: number; // in seconds
  subtitle?: string;
}

export interface VideoGenerationOptions {
  scenes: VideoScene[];
  outputPath: string;
  resolution?: "720p" | "1080p"; // Default: 1080p
  fps?: number; // Default: 30
  bitrate?: string; // Default: 5000k for 1080p
  transition?: "fade" | "slide" | "zoom" | "none"; // Default: fade
  transitionDuration?: number; // in milliseconds, default: 500
  audioMixing?: boolean; // Mix audio from scenes, default: true
  subtitleFile?: string; // Path to SRT file
}

export interface VideoGenerationResult {
  outputPath: string;
  duration: number; // in seconds
  fileSize: number; // in bytes
  resolution: string;
  fps: number;
}

/**
 * Generate 1080p video with transitions and animations
 */
export async function generateEnhancedVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const {
    scenes,
    outputPath,
    resolution = "1080p",
    fps = 30,
    bitrate = "5000k",
    transition = "fade",
    transitionDuration = 500,
    audioMixing = true,
    subtitleFile,
  } = options;

  // Create temporary directory for intermediate files
  const tempDir = path.join(path.dirname(outputPath), `.temp_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // Get resolution dimensions
    const { width, height } = getResolutionDimensions(resolution);

    // Step 1: Download images and create video clips for each scene
    const sceneClips = await createSceneClips(scenes, tempDir, width, height);

    // Step 2: Add transitions between scenes
    const transitionedClips = await addTransitions(
      sceneClips,
      tempDir,
      transition,
      transitionDuration,
      fps
    );

    // Step 3: Create concat demuxer file
    const concatFile = path.join(tempDir, "concat.txt");
    createConcatFile(transitionedClips, concatFile);

    // Step 4: Concatenate all clips
    const mergedVideoPath = path.join(tempDir, "merged.mp4");
    await concatenateVideos(concatFile, mergedVideoPath, fps);

    // Step 5: Add audio and subtitles
    const finalPath = await addAudioAndSubtitles(
      mergedVideoPath,
      scenes,
      outputPath,
      audioMixing,
      subtitleFile,
      bitrate
    );

    // Step 6: Get video information
    const videoInfo = await getVideoInfo(finalPath);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      outputPath: finalPath,
      duration: videoInfo.duration,
      fileSize: fs.statSync(finalPath).size,
      resolution,
      fps,
    };
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

/**
 * Get resolution dimensions
 */
function getResolutionDimensions(
  resolution: "720p" | "1080p"
): { width: number; height: number } {
  const dimensions = {
    "720p": { width: 1280, height: 720 },
    "1080p": { width: 1920, height: 1080 },
  };
  return dimensions[resolution];
}

/**
 * Create video clips for each scene
 */
async function createSceneClips(
  scenes: VideoScene[],
  tempDir: string,
  width: number,
  height: number
): Promise<string[]> {
  const clips: string[] = [];

  for (const scene of scenes) {
    const clipPath = path.join(tempDir, `scene_${scene.sceneNumber}.mp4`);

    // Create a video clip from the image with the specified duration
    const command = `ffmpeg -loop 1 -i "${scene.imageUrl}" -c:v libx264 -t ${scene.duration} -pix_fmt yuv420p -vf "scale=${width}:${height}" "${clipPath}" -y`;

    try {
      await execAsync(command);
      clips.push(clipPath);
    } catch (error) {
      console.error(`Error creating clip for scene ${scene.sceneNumber}:`, error);
      throw error;
    }
  }

  return clips;
}

/**
 * Add transitions between scenes
 */
async function addTransitions(
  clips: string[],
  tempDir: string,
  transition: "fade" | "slide" | "zoom" | "none",
  transitionDuration: number,
  fps: number
): Promise<string[]> {
  if (transition === "none" || clips.length <= 1) {
    return clips;
  }

  const transitionedClips: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const outputPath = path.join(tempDir, `transitioned_${i}.mp4`);

    if (i === 0) {
      // First clip - no transition before
      transitionedClips.push(clips[i]);
    } else {
      // Add transition from previous clip
      const prevClip = clips[i - 1];
      const currentClip = clips[i];

      const filterComplex = getTransitionFilter(
        transition,
        transitionDuration,
        fps
      );

      const command = `ffmpeg -i "${prevClip}" -i "${currentClip}" -filter_complex "${filterComplex}" -c:v libx264 -c:a aac "${outputPath}" -y`;

      try {
        await execAsync(command);
        transitionedClips.push(outputPath);
      } catch (error) {
        console.error(`Error adding transition at clip ${i}:`, error);
        throw error;
      }
    }
  }

  return transitionedClips;
}

/**
 * Get FFmpeg filter for transition effect
 */
function getTransitionFilter(
  transition: "fade" | "slide" | "zoom",
  duration: number,
  fps: number
): string {
  const frames = Math.ceil((duration / 1000) * fps);

  switch (transition) {
    case "fade":
      return `[0]fade=t=in:st=0:d=${duration / 1000}[fade0];[1]fade=t=out:st=0:d=${duration / 1000}[fade1];[fade0][fade1]xfade=transition=fade:duration=${duration / 1000}:offset=${(duration / 1000) * fps}[out]`;

    case "slide":
      return `[0][1]xfade=transition=slideleft:duration=${duration / 1000}:offset=${(duration / 1000) * fps}[out]`;

    case "zoom":
      return `[0][1]xfade=transition=zoomin:duration=${duration / 1000}:offset=${(duration / 1000) * fps}[out]`;

    default:
      return `[0][1]concat=n=2:v=1:a=0[out]`;
  }
}

/**
 * Create concat demuxer file for FFmpeg
 */
function createConcatFile(clips: string[], outputPath: string): void {
  const content = clips.map((clip) => `file '${clip}'`).join("\n");
  fs.writeFileSync(outputPath, content);
}

/**
 * Concatenate multiple video clips
 */
async function concatenateVideos(
  concatFile: string,
  outputPath: string,
  fps: number
): Promise<void> {
  const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy -r ${fps} "${outputPath}" -y`;

  try {
    await execAsync(command);
  } catch (error) {
    console.error("Error concatenating videos:", error);
    throw error;
  }
}

/**
 * Add audio and subtitles to video
 */
async function addAudioAndSubtitles(
  videoPath: string,
  scenes: VideoScene[],
  outputPath: string,
  audioMixing: boolean,
  subtitleFile: string | undefined,
  bitrate: string
): Promise<string> {
  let command = `ffmpeg -i "${videoPath}"`;

  // Add audio from scenes if available
  if (audioMixing && scenes.some((s) => s.audioUrl)) {
    const audioFiles = scenes
      .filter((s) => s.audioUrl)
      .map((s) => `-i "${s.audioUrl}"`)
      .join(" ");

    command += ` ${audioFiles}`;
  }

  // Add subtitle filter if provided
  if (subtitleFile && fs.existsSync(subtitleFile)) {
    command += ` -vf "subtitles='${subtitleFile}'"`;
  }

  // Output settings
  command += ` -c:v libx264 -b:v ${bitrate} -c:a aac -b:a 128k "${outputPath}" -y`;

  try {
    await execAsync(command);
    return outputPath;
  } catch (error) {
    console.error("Error adding audio and subtitles:", error);
    throw error;
  }
}

/**
 * Get video information
 */
async function getVideoInfo(
  videoPath: string
): Promise<{ duration: number; width: number; height: number }> {
  const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noprint_wrappers=1 "${videoPath}"`;

  try {
    const { stdout } = await execAsync(command);
    const duration = parseFloat(stdout.trim());

    return {
      duration,
      width: 0, // Would need additional ffprobe call
      height: 0,
    };
  } catch (error) {
    console.error("Error getting video info:", error);
    throw error;
  }
}

/**
 * Create animation effect (Ken Burns effect)
 */
export function getKenBurnsFilter(
  width: number,
  height: number,
  duration: number
): string {
  // Zoom in slowly while panning
  const zoomStart = 1.0;
  const zoomEnd = 1.2;
  const panX = 50;
  const panY = 50;

  return `scale=${width}:${height},zoompan=z='min(zoom+0.0015,${zoomEnd})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.ceil(duration * 30)}:s=${width}x${height}`;
}

/**
 * Add Ken Burns effect to video
 */
export async function addKenBurnsEffect(
  inputPath: string,
  outputPath: string,
  duration: number,
  width: number = 1920,
  height: number = 1080
): Promise<void> {
  const filter = getKenBurnsFilter(width, height, duration);

  const command = `ffmpeg -i "${inputPath}" -vf "${filter}" -c:v libx264 -c:a copy "${outputPath}" -y`;

  try {
    await execAsync(command);
  } catch (error) {
    console.error("Error adding Ken Burns effect:", error);
    throw error;
  }
}
