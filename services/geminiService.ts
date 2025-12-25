
import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generatePhotoCaption = async (locationName: string, userNotes: string): Promise<string> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a poetic and engaging short travel diary entry (max 2 sentences) for a photo taken at ${locationName}. Additional context: ${userNotes}`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    return response.text?.trim() || "No description generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return userNotes || "An amazing moment captured during my travels.";
  }
};
