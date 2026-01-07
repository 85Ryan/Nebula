import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from '../types';

interface GenerateSpeechParams {
    text: string;
    voice: VoiceName;
    model: string;
    prompt?: string;
}

export const generateSpeech = async ({ text, voice, model, prompt }: GenerateSpeechParams, apiKey: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please provide a valid API Key.");
    }

    // Initialize client with the provided key using the @google/genai SDK pattern
    const genAI = new GoogleGenAI({ apiKey });

    try {
        const response = await genAI.models.generateContent({
            model: model,
            contents: [{ role: "user", parts: [{ text }] }],
            // systemInstruction is a top-level field in the REST-style SDK
            // @ts-ignore
            systemInstruction: prompt ? { parts: [{ text: prompt }] } : undefined,
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const candidate = response.candidates?.[0];
        const base64Audio = candidate?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            console.error("Gemini TTS Debug - Full Response:", JSON.stringify(response, null, 2));
            if (response.promptFeedback) {
                console.error("Gemini TTS Debug - Prompt Feedback:", response.promptFeedback);
            }
            throw new Error(`No audio data received from Gemini. Status: ${candidate?.finishReason || 'Unknown'}`);
        }

        return base64Audio;
    } catch (error) {
        console.error("Gemini TTS Error:", error);
        throw error;
    }
};
