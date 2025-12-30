
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AutomationPackage, ImageSize, Scene } from "../types";

const SYSTEM_INSTRUCTION = `You are an all-in-one AI YouTube automation system. 
Your task is to create a COMPLETE, ORIGINAL, and YOUTUBE-SAFE video package from ONE user prompt.
Always return response in JSON format matching the AutomationPackage interface.
Return scenes as an array of objects where each object has "text" (the sentence from the script) and "visualPrompt" (cinematic, vertical 9:16 description).
Follow the specific format for script (45-60s), VO instructions with tone tags, and punchy subtitles.`;

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateAutomationPackage(userPrompt: string): Promise<AutomationPackage> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            script: { type: Type.STRING },
            voiceOver: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING }
                }
              }
            },
            subtitles: { type: Type.STRING },
            musicStyle: { type: Type.STRING },
            youtubeTitle: { type: Type.STRING },
            youtubeDescription: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            thumbnailText: { type: Type.STRING }
          },
          required: ["script", "voiceOver", "scenes", "subtitles", "musicStyle", "youtubeTitle", "youtubeDescription", "tags", "hashtags", "thumbnailText"]
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    // Map scenes with IDs
    data.scenes = data.scenes.map((s: any, i: number) => ({
      ...s,
      id: `scene-${i}`
    }));
    return data as AutomationPackage;
  }

  async generateImage(prompt: string, size: ImageSize): Promise<string> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `${prompt}. Cinematic, hyper-realistic, high resolution, professional lighting, 9:16 vertical aspect ratio.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: size
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No candidates returned from image generation.");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response.");
  }

  async chat(message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
    const ai = this.getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are the TubeMagic AI assistant. Help the user refine their YouTube automation project. Provide expert advice on content strategy, SEO, and visual storytelling."
      }
    });

    // Note: sendMessage only takes a message string. For history, it needs to be pre-fed if using the SDK normally, 
    // but we'll stick to a simple chat for now or use history in the create call if the SDK supported it.
    // For simplicity with this SDK version, we send the message.
    const response = await chat.sendMessage({ message });
    return response.text || "Sorry, I couldn't generate a response.";
  }
}

export const geminiService = new GeminiService();
