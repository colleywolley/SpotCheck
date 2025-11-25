import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'SpotCheck', an expert AI assistant for snowboarding and skateboarding culture. 
Your specific goal is to identify the real-world location (the "spot") shown in images, videos, or described via links.

Analyze the visual cues (architecture, landscape, rails, stairs, mountains, signage) or available context.
1. Identify the name of the spot (e.g., "El Toro High School", "Mammoth Mountain Main Park", "Southbank Centre").
2. Provide the city, state/province, and country.
3. If it is a famous historical spot in skating/snowboarding, mention a famous trick done there.
4. If you cannot identify it exactly, provide your best educated guess based on the environment (e.g., "Looks like the French Alps near Chamonix" or "Typical Southern California schoolyard").
5. ALWAYS use Google Search and Google Maps tools to verify your findings and provide grounding links.

Format your response clearly with bold headers.
`;

export const analyzeMedia = async (
  prompt: string,
  base64Data: string | null,
  mimeType: string | null
): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [{ text: prompt }];

    if (base64Data && mimeType) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }

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
