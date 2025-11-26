import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'SpotCheck', an expert AI assistant for snowboarding and skateboarding culture and location scouting.
Your primary goal is to identify the real-world location (the "spot") shown in user-provided media with high precision.

PROTOCOL:
1. **Analyze Visuals/Context**: Look for street signs, business names, unique architecture, mountain skylines, or park layouts.
2. **Determine Location**:
   - **Target**: Exact address (e.g., "123 Skate St, Los Angeles, CA").
   - **Fallback 1**: Specific intersection or block (e.g., "Intersection of Wilshire and Western, LA" or "Between 4th and 5th Ave").
   - **Fallback 2**: Neighborhood/District (e.g., "Koreatown, Los Angeles").
   - **Fallback 3**: City/Region (e.g., "Los Angeles, CA").
3. **Verify**: ALWAYS use Google Maps and Google Search to confirm the spot exists and looks correct.

OUTPUT FORMAT (Markdown):
*   **Spot Name**: [Name of spot or "Unknown Street Spot"]
*   **Location**: [The most specific address, intersection, or neighborhood you can identify]
*   **City/Region**: [City, State, Country]
*   **Context**: [Famous tricks, history, or description of obstacles]
*   **Confidence**: [Exact Match / Approximate Area / General Region]

If you are guessing the area based on architecture (e.g., "Barcelona ledges"), state that clearly.

CRITICAL: At the very end of your response, if you have identified a specific location (Address or Intersection), strictly output the coordinates in this exact format on a new line:
COORDINATES: Latitude,Longitude
(Example: COORDINATES: 34.052235,-118.243683)
`;

export const analyzeMedia = async (
  prompt: string,
  mediaItems: { mimeType: string; data: string }[] = [],
  sourceUrl?: string
): Promise<AnalysisResult> => {
  try {
    let fullPrompt = prompt;
    if (sourceUrl) {
      fullPrompt += `\n\nCONTEXT FROM USER: The user found this media at the following link: ${sourceUrl}. Use this URL to scrape information about the riders, crew, or video title to help narrow down the location.`;
    }

    const parts: any[] = [{ text: fullPrompt }];

    // Add all media items to the parts array
    mediaItems.forEach(item => {
      parts.push({
        inlineData: {
          mimeType: item.mimeType,
          data: item.data
        }
      });
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ],
        toolConfig: {
           // We do not have user location, so we omit retrievalConfig.latLng to let it search globally
        }
      }
    });

    return {
      text: response.text || "No detailed analysis could be generated.",
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};