
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { UserLocation, GroundingChunk, Message } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface GroundedResponse {
  text: string;
  groundingChunks: GroundingChunk[];
}

export async function getGroundedResponse(prompt: string, location: UserLocation, history: Message[]): Promise<GroundedResponse> {
  try {
    // Format the history for the Gemini API, excluding the initial welcome message.
    const conversationHistory: Content[] = history
      .filter(msg => msg.id !== 'init')
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      }));
    
    const contents: Content[] = [
        ...conversationHistory,
        { role: 'user', parts: [{ text: prompt }] }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        }
      },
    });

    const text = response.text;
    const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[]) || [];
    
    return { text, groundingChunks };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get response from AI. Please check your connection and API key.");
  }
}
