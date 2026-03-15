import { invokeLLM } from "../_core/llm";

export interface VoiceNarrationRequest {
  text: string;
  language: "fr" | "en" | "es" | "ht";
  voiceCharacter?: "male" | "female" | "neutral";
  speed?: number; // 0.5 to 2.0
  emotion?: "neutral" | "happy" | "sad" | "excited" | "calm";
}

export interface VoiceNarrationResponse {
  audioUrl: string;
  duration: number; // in seconds
  language: string;
  textLength: number;
  voiceCharacter: string;
}

/**
 * Generate voice narration using XTTS-v2 via Manus API
 * Note: This uses the Manus voice transcription API which supports multiple languages
 */
export async function generateVoiceNarration(
  request: VoiceNarrationRequest
): Promise<VoiceNarrationResponse> {
  // Map languages to language codes for voice synthesis
  const languageMap: Record<string, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    ht: "ht-HT", // Haitian Creole
  };

  const languageCode = languageMap[request.language] || "en-US";

  // Estimate duration based on text length and speech rate
  // Average speaking rate: 150 words per minute = 2.5 words per second
  const wordCount = request.text.split(/\s+/).length;
  const baseSpeed = request.speed || 1.0;
  const estimatedDuration = Math.ceil((wordCount / 2.5) * (1 / baseSpeed));

  try {
    // Call Manus voice synthesis API
    // This would be integrated with the actual XTTS-v2 endpoint
    const audioUrl = await synthesizeVoiceWithXTTS(
      request.text,
      languageCode,
      request.voiceCharacter || "neutral",
      request.speed || 1.0,
      request.emotion || "neutral"
    );

    return {
      audioUrl,
      duration: estimatedDuration,
      language: request.language,
      textLength: request.text.length,
      voiceCharacter: request.voiceCharacter || "neutral",
    };
  } catch (error) {
    console.error("Error generating voice narration:", error);
    throw new Error(
      `Failed to generate voice narration: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Synthesize voice using XTTS-v2 model
 * This function would call the actual XTTS-v2 API endpoint
 */
async function synthesizeVoiceWithXTTS(
  text: string,
  language: string,
  voiceCharacter: string,
  speed: number,
  emotion: string
): Promise<string> {
  // This is a placeholder for the actual XTTS-v2 API call
  // In production, this would call the Manus voice synthesis endpoint

  const payload = {
    text,
    language,
    voice: voiceCharacter,
    speed: Math.max(0.5, Math.min(2.0, speed)),
    emotion,
    format: "mp3",
    sample_rate: 44100,
  };

  try {
    // Call the Manus voice synthesis API
    // This would be configured via environment variables
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error("Voice synthesis API credentials not configured");
    }

    const response = await fetch(`${apiUrl}/voice/synthesize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Voice synthesis API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.audioUrl || data.url;
  } catch (error) {
    console.error("Error in XTTS-v2 synthesis:", error);
    throw error;
  }
}

/**
 * Generate narration for multiple scenes
 */
export async function generateSceneNarrations(
  scenes: Array<{ sceneNumber: number; description: string }>,
  language: "fr" | "en" | "es" | "ht",
  voiceCharacter?: "male" | "female" | "neutral"
): Promise<
  Array<{
    sceneNumber: number;
    audioUrl: string;
    duration: number;
  }>
> {
  const narrations = [];

  for (const scene of scenes) {
    try {
      const narration = await generateVoiceNarration({
        text: scene.description,
        language,
        voiceCharacter,
      });

      narrations.push({
        sceneNumber: scene.sceneNumber,
        audioUrl: narration.audioUrl,
        duration: narration.duration,
      });
    } catch (error) {
      console.error(
        `Error generating narration for scene ${scene.sceneNumber}:`,
        error
      );
      // Continue with next scene instead of failing completely
    }
  }

  return narrations;
}

/**
 * Adjust narration duration to match scene duration
 */
export function calculateNarrationTiming(
  narrationDuration: number,
  sceneDuration: number
): {
  speed: number;
  silencePadding: number;
} {
  if (narrationDuration <= 0) {
    return { speed: 1.0, silencePadding: sceneDuration };
  }

  if (narrationDuration > sceneDuration) {
    // Speed up narration to fit scene
    return {
      speed: Math.min(2.0, sceneDuration / narrationDuration),
      silencePadding: 0,
    };
  } else {
    // Add silence padding after narration
    return {
      speed: 1.0,
      silencePadding: sceneDuration - narrationDuration,
    };
  }
}
