import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from '../types';

// NOTE: API Key must be in environment variable or injected.
// In this specific task, we assume process.env.API_KEY is available.
// If running locally, you might need to use a proxy or hardcode for testing (not recommended for prod).

const apiKey = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey });

interface GenerateSpeechParams {
  text: string;
  voice: VoiceName;
}

export const generateSpeech = async ({ text, voice }: GenerateSpeechParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from Gemini.");
    }

    return base64Audio;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    throw error;
  }
};
