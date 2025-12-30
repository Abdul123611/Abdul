
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AutomationPackage, ImageSize, Scene, ChatMessage } from "../types";

const SYSTEM_INSTRUCTION = `You are the core engine of TubeMagic Pro, a world-class YouTube automation suite.
Your task is to convert a user idea into a complete production package.

STRICT REQUIREMENTS:
1. SCRIPT: 45-60s, punchy hook, engaging narrative.
2. VO: Clean text with bracketed tone cues like [HOOK - energetic].
3. SCENES: One scene per sentence. Cinematic 9:16 visual prompts.
4. SEO: Title under 60 chars, rich description, trending tags and hashtags.

Output must be valid JSON matching the AutomationPackage schema.`;

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateAutomationPackage(userPrompt: string): Promise<AutomationPackage> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a full production package for: ${userPrompt}`,
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
    data.id = crypto.randomUUID();
    data.timestamp = Date.now();
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
        parts: [{ text: `${prompt}. Cinematic 9:16 vertical, hyper-realistic, 8k resolution, professional color grading.` }]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: size
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No image generated.");

    for (const part of candidate.content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("Image data missing in response.");
  }

  async generateVideo(prompt: string): Promise<string> {
    const ai = this.getClient();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. Cinematic slow motion, 9:16 vertical, high quality.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video URI not found.");
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async chat(message: string, history: ChatMessage[]): Promise<string> {
    const ai = this.getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are the TubeMagic Studio Assistant. Help the creator refine their script, visual style, or SEO strategy."
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });
    const response = await chat.sendMessage({ message });
    return response.text || "I'm having trouble connecting right now.";
  }
}

export const geminiService = new GeminiService();
