import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

export interface SceneVideoData {
  sceneId: number;
  imageUrl: string;
  audioUrl: string;
  duration: number;
  title?: string;
}

export async function generateSceneVideo(
  imageUrl: string,
  audioUrl: string,
  duration: number,
  outputPath: string
): Promise<void> {
  try {
    const command = `ffmpeg -loop 1 -i "${imageUrl}" -i "${audioUrl}" -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p -y "${outputPath}"`;
    await execAsync(command);
    console.log(`Scene video generated: ${outputPath}`);
  } catch (error) {
    throw new Error(`Scene video generation failed`);
  }
}

export async function composeFullVideo(
  sceneVideoPaths: string[],
  outputPath: string,
  options?: { fps?: number; bitrate?: string }
): Promise<void> {
  try {
    if (sceneVideoPaths.length === 0) {
      throw new Error("No scene videos provided");
    }
    const concatFile = path.join(path.dirname(outputPath), "concat.txt");
    const concatContent = sceneVideoPaths
      .map((videoPath) => `file '${videoPath}'`)
      .join("\\n");
    fs.writeFileSync(concatFile, concatContent);
    const bitrate = options?.bitrate || "5000k";
    const command = `ffmpeg -f concat -safe 0 -i "${concatFile}" -c:v libx264 -preset medium -b:v ${bitrate} -c:a aac -y "${outputPath}"`;
    await execAsync(command);
    fs.unlinkSync(concatFile);
    console.log(`Full video composed: ${outputPath}`);
  } catch (error) {
    throw new Error(`Video composition failed`);
  }
}

export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return parseFloat(stdout.trim());
  } catch (error) {
    throw new Error(`Failed to get video duration`);
  }
}
