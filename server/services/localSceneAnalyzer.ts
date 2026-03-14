/**
 * Local Scene Analyzer - Splits stories into scenes without external LLM
 * Uses text analysis to identify natural scene breaks
 */

export interface GeneratedScene {
  id: number;
  title: string;
  description: string;
  imagePrompt: string;
  textContent: string;
  duration: number;
}

/**
 * Split story into scenes based on local text analysis
 * Identifies natural breaks using paragraphs, sentences, and keywords
 */
export function analyzeStoryIntoScenes(story: string, targetSceneCount: number = 20): GeneratedScene[] {
  console.log(`[LocalSceneAnalyzer] Analyzing story into ~${targetSceneCount} scenes`);

  // Clean and normalize text
  const cleanedStory = story.trim();
  
  // Split by paragraphs (double newlines)
  const paragraphs = cleanedStory.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  console.log(`[LocalSceneAnalyzer] Found ${paragraphs.length} paragraphs`);

  // If we have fewer paragraphs than target scenes, split by sentences
  let segments = paragraphs;
  if (paragraphs.length < targetSceneCount / 2) {
    segments = splitBySentences(cleanedStory, targetSceneCount);
  }

  // Group segments into scenes
  const scenes = groupSegmentsIntoScenes(segments, targetSceneCount);
  
  console.log(`[LocalSceneAnalyzer] Generated ${scenes.length} scenes`);

  return scenes;
}

/**
 * Split text by sentences for finer granularity
 */
function splitBySentences(text: string, targetCount: number): string[] {
  // Split by sentence endings (. ! ?)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Group sentences to reach target count
  const groupSize = Math.ceil(sentences.length / targetCount);
  const groups: string[] = [];
  
  for (let i = 0; i < sentences.length; i += groupSize) {
    const group = sentences.slice(i, i + groupSize).join('').trim();
    if (group.length > 0) {
      groups.push(group);
    }
  }
  
  return groups;
}

/**
 * Group segments into scenes with titles and descriptions
 */
function groupSegmentsIntoScenes(segments: string[], targetCount: number): GeneratedScene[] {
  const scenes: GeneratedScene[] = [];
  
  // Calculate how many segments per scene
  const segmentsPerScene = Math.max(1, Math.ceil(segments.length / targetCount));
  
  let sceneId = 1;
  for (let i = 0; i < segments.length; i += segmentsPerScene) {
    const sceneSegments = segments.slice(i, i + segmentsPerScene);
    const sceneText = sceneSegments.join('\n\n').trim();
    
    if (sceneText.length === 0) continue;
    
    // Generate scene title from first sentence
    const title = generateSceneTitle(sceneText, sceneId);
    
    // Generate description (first 100-150 chars)
    const description = generateSceneDescription(sceneText);
    
    // Generate image prompt from scene content
    const imagePrompt = generateImagePrompt(sceneText, title);
    
    // Estimate duration based on text length (roughly 1 second per 10 words)
    const wordCount = sceneText.split(/\s+/).length;
    const duration = Math.max(2, Math.ceil(wordCount / 10));
    
    scenes.push({
      id: sceneId,
      title,
      description,
      imagePrompt,
      textContent: sceneText,
      duration,
    });
    
    sceneId++;
  }
  
  return scenes;
}

/**
 * Generate a scene title from text
 */
function generateSceneTitle(text: string, sceneId: number): string {
  // Get first sentence or first 50 chars
  const firstSentence = text.match(/^[^.!?]*[.!?]/)?.[0] || text.substring(0, 50);
  const cleanTitle = firstSentence
    .replace(/[.!?]+$/, '') // Remove punctuation
    .trim()
    .substring(0, 60); // Max 60 chars
  
  return cleanTitle || `Scene ${sceneId}`;
}

/**
 * Generate a scene description
 */
function generateSceneDescription(text: string): string {
  // Get first 150 characters as description
  const description = text.substring(0, 150).trim();
  
  // Add ellipsis if truncated
  if (text.length > 150) {
    return description.substring(0, 147) + '...';
  }
  
  return description;
}

/**
 * Generate an image prompt from scene content
 * Extracts key nouns and adjectives to create a visual description
 */
function generateImagePrompt(text: string, sceneTitle: string): string {
  // Extract key words (nouns, adjectives)
  const words = text.toLowerCase().split(/\s+/);
  
  // Common words to skip
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'as', 'if', 'because', 'so', 'than',
  ]);
  
  // Filter meaningful words
  const meaningfulWords = words.filter(word => {
    const clean = word.replace(/[^a-z0-9]/g, '');
    return clean.length > 3 && !stopWords.has(clean);
  }).slice(0, 8); // Take first 8 meaningful words
  
  // Create prompt
  let prompt = `${sceneTitle}. `;
  
  if (meaningfulWords.length > 0) {
    prompt += `A scene with ${meaningfulWords.slice(0, 5).join(', ')}. `;
  }
  
  // Add visual descriptors
  const visualDescriptors = [
    'cinematic lighting',
    'detailed illustration',
    'professional quality',
    'narrative scene',
  ];
  
  prompt += visualDescriptors.join(', ') + '.';
  
  return prompt;
}

/**
 * Extract key themes from story for metadata
 */
export function extractStoryThemes(story: string): string[] {
  const themes: string[] = [];
  
  // Simple theme detection based on keywords
  const themeKeywords: Record<string, string[]> = {
    adventure: ['adventure', 'quest', 'journey', 'explore', 'discover'],
    mystery: ['mystery', 'secret', 'hidden', 'unknown', 'puzzle'],
    romance: ['love', 'heart', 'romance', 'beloved', 'affection'],
    fantasy: ['magic', 'wizard', 'dragon', 'spell', 'enchant'],
    scifi: ['future', 'space', 'robot', 'alien', 'technology'],
    horror: ['fear', 'dark', 'scary', 'terror', 'haunted'],
    comedy: ['laugh', 'funny', 'joke', 'hilarious', 'amusing'],
    drama: ['conflict', 'emotion', 'struggle', 'challenge', 'overcome'],
  };
  
  const lowerStory = story.toLowerCase();
  
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => lowerStory.includes(keyword))) {
      themes.push(theme);
    }
  }
  
  return themes.length > 0 ? themes : ['narrative'];
}
