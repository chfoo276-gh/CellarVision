import { GoogleGenAI, Type } from "@google/genai";
import { WineType } from "../types";

export interface ScannedWineData {
  producer: string;
  varietal: string;
  vintage: number | string;
  type: WineType;
  region?: string;
  country?: string;
}

export const analyzeWineLabel = async (base64Image: string): Promise<ScannedWineData> => {
  // The API key is obtained exclusively from process.env.API_KEY as per guidelines.
  // Ensure VITE_API_KEY is set in your Vercel environment variables, which vite.config.ts maps to this.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Missing API Key. Ensure VITE_API_KEY is set in Vercel environment variables.");
    throw new Error("API Key not configured.");
  }

  // Initialize lazily to prevent app crash on load if key is missing
  const ai = new GoogleGenAI({ apiKey });

  // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this wine label image. Extract the Producer (Winery), Varietal (Grape), Vintage (Year), Region, Country, and Type.
            
            For 'Type', infer from the wine characteristics:
            - 'Red' for Cabernet, Pinot Noir, Merlot, Shiraz, etc.
            - 'White' for Chardonnay, Sauvignon Blanc, Riesling, etc.
            - 'Rose' for Rosé wines.
            - 'Sparkling' for Champagne, Cava, Prosecco.
            - 'Other' if unsure.
            
            For 'Vintage':
            - Return the year as a string (e.g., "2019").
            - If the wine is Non-Vintage, return "NV".
            - If unsure, return "NV".
            `
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            producer: { type: Type.STRING, description: "Name of the winery or producer" },
            varietal: { type: Type.STRING, description: "Main grape variety or blend name" },
            vintage: { type: Type.STRING, description: "Year of harvest or 'NV'" },
            region: { type: Type.STRING, description: "Region or Appellation" },
            country: { type: Type.STRING, description: "Country of origin" },
            type: { 
              type: Type.STRING, 
              enum: [WineType.RED, WineType.WHITE, WineType.ROSE, WineType.SPARKLING, WineType.OTHER],
              description: "Type of wine"
            },
          },
          required: ["producer", "varietal", "vintage", "type"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as ScannedWineData;
    return data;

  } catch (error) {
    console.error("Error analyzing wine label:", error);
    throw new Error("Failed to analyze image. Please try again or enter manually.");
  }
};