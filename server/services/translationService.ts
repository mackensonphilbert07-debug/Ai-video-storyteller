import { invokeLLM } from "../_core/llm";

export type SupportedLanguage = "fr" | "en" | "es" | "ht";

export interface TranslationRequest {
  text: string;
  sourceLanguage: SupportedLanguage;
  targetLanguages: SupportedLanguage[];
}

export interface TranslationResult {
  original: string;
  sourceLanguage: SupportedLanguage;
  translations: Record<SupportedLanguage, string>;
}

const languageNames: Record<SupportedLanguage, string> = {
  fr: "French",
  en: "English",
  es: "Spanish",
  ht: "Haitian Creole",
};

/**
 * Translate text to multiple languages
 */
export async function translateText(
  request: TranslationRequest
): Promise<TranslationResult> {
  const translations: Record<SupportedLanguage, string> = {
    fr: "",
    en: "",
    es: "",
    ht: "",
  };

  // Keep original language
  translations[request.sourceLanguage] = request.text;

  // Translate to target languages
  for (const targetLang of request.targetLanguages) {
    if (targetLang === request.sourceLanguage) {
      continue; // Skip if same as source
    }

    try {
      const translated = await translateToLanguage(
        request.text,
        request.sourceLanguage,
        targetLang
      );
      translations[targetLang] = translated;
    } catch (error) {
      console.error(
        `Error translating to ${targetLang}:`,
        error
      );
      // Use original text as fallback
      translations[targetLang] = request.text;
    }
  }

  return {
    original: request.text,
    sourceLanguage: request.sourceLanguage,
    translations,
  };
}

/**
 * Translate text to a single target language
 */
async function translateToLanguage(
  text: string,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<string> {
  const systemPrompt = `You are a professional translator. Translate text accurately while preserving meaning and tone.
Maintain any formatting or structure in the original text.
Respond with ONLY the translated text, nothing else.`;

  const userPrompt = `Translate the following ${languageNames[sourceLanguage]} text to ${languageNames[targetLanguage]}:

"${text}"`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    return content.trim();
  } catch (error) {
    console.error("Error in translation LLM call:", error);
    throw error;
  }
}

/**
 * Translate story with all scenes
 */
export async function translateStory(
  story: {
    title: string;
    description: string;
    content: string;
    scenes: Array<{
      sceneNumber: number;
      title: string;
      description: string;
      imagePrompt: string;
    }>;
  },
  sourceLanguage: SupportedLanguage,
  targetLanguages: SupportedLanguage[]
): Promise<Record<SupportedLanguage, typeof story>> {
  const result: Record<SupportedLanguage, typeof story> = {} as Record<SupportedLanguage, typeof story>;

  // Keep original
  result[sourceLanguage] = story;

  // Translate to target languages
  for (const targetLang of targetLanguages) {
    if (targetLang === sourceLanguage) {
      continue;
    }

    try {
      const translatedStory = await translateStoryContent(
        story,
        sourceLanguage,
        targetLang
      );
      result[targetLang] = translatedStory;
    } catch (error) {
      console.error(
        `Error translating story to ${targetLang}:`,
        error
      );
      // Use original as fallback
      result[targetLang] = story;
    }
  }

  return result;
}

/**
 * Translate complete story content
 */
async function translateStoryContent(
  story: {
    title: string;
    description: string;
    content: string;
    scenes: Array<{
      sceneNumber: number;
      title: string;
      description: string;
      imagePrompt: string;
    }>;
  },
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage
): Promise<typeof story> {
  const systemPrompt = `You are a professional translator. Translate the entire story structure to ${languageNames[targetLanguage]}.
Maintain all formatting and structure.
Respond with a JSON object matching the input structure.`;

  const userPrompt = `Translate this story from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}:

${JSON.stringify(story, null, 2)}

Return a JSON object with the same structure but all text translated.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translated_story",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              content: { type: "string" },
              scenes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sceneNumber: { type: "number" },
                    title: { type: "string" },
                    description: { type: "string" },
                    imagePrompt: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response format from LLM");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error translating story:", error);
    throw error;
  }
}

/**
 * Translate array of narration texts
 */
export async function translateNarrations(
  narrations: Array<{ sceneNumber: number; text: string }>,
  sourceLanguage: SupportedLanguage,
  targetLanguages: SupportedLanguage[]
): Promise<Record<SupportedLanguage, typeof narrations>> {
  const result: Record<SupportedLanguage, typeof narrations> = {} as Record<SupportedLanguage, typeof narrations>;

  // Keep original
  result[sourceLanguage] = narrations;

  // Translate to target languages
  for (const targetLang of targetLanguages) {
    if (targetLang === sourceLanguage) {
      continue;
    }

    try {
      const translatedNarrations: typeof narrations = [];

      for (const narration of narrations) {
        const translated = await translateToLanguage(
          narration.text,
          sourceLanguage,
          targetLang
        );

        translatedNarrations.push({
          sceneNumber: narration.sceneNumber,
          text: translated,
        });
      }

      result[targetLang] = translatedNarrations;
    } catch (error) {
      console.error(
        `Error translating narrations to ${targetLang}:`,
        error
      );
      // Use original as fallback
      result[targetLang] = narrations;
    }
  }

  return result;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): Record<SupportedLanguage, string> {
  return languageNames;
}

/**
 * Check if language is supported
 */
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return ["fr", "en", "es", "ht"].includes(lang);
}
