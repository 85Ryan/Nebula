import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from '../types';

interface GenerateSpeechParams {
    text: string;
    voice: VoiceName;
    model: string;
    prompt?: string;
}

const EMOTION_DEFINITIONS = `
### DIRECTOR'S NOTES - EMOTION & TONE GUIDE
You are a professional voice actor. When you see the following tags in the script, act them out as described.
If the user provides their own system instructions, combine them with these definitions.

*   **[EXPLOSIVE]**: High volume, high pitch, maximum excitement. Start with a bang!
*   **[SPEED_RUN]**: Very fast, rhythmic, no pauses. Demonstrate quick steps.
*   **[EMPHASIZE]**: Slow down slightly, punch every word, distinct separation. Focus on key features.
*   **[AMAZED]**: "Wow" factor, breathless, higher pitch. Describe seeing results.
*   **[SECRETIVE]**: Lower volume, closer to mic, whispery tone. Share a secret.
*   **[SARCASTIC]**: Playful, rolling eyes, slightly mocking tone. Roast old ideas.
*   **[CASUAL]**: Relaxed, breezy, "it's easy" tone. After a complex task.
*   **[WARNING]**: Sudden drop in pitch, serious, urgent. Critical alerts.
*   **[CHALLENGING]**: Upward inflection, direct address to audience. Hook the viewer.
*   **[SINCERE]**: Warm, direct, normal speed. Call to action.

INSTRUCTIONS:
1. Apply the tone specified in the tags to the enclosed text.
2. If no tag is present, use a natural, engaging professional tone.
3. DO NOT read the tags aloud in the final audio. They are for your acting direction only.
`;

export const generateSpeech = async ({ text, voice, model, prompt }: GenerateSpeechParams, apiKey: string): Promise<string> => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please provide a valid API Key.");
    }

    // Initialize client with the provided key using the @google/genai SDK pattern
    const genAI = new GoogleGenAI({ apiKey });

    try {
        // Combine Emotion Definitions + User System Prompt + Text
        // We prepend instructions so the model knows the "Stage Directions" before processing the text lines.
        const PRONUNCIATION_GUIDE = `
[PRONUNCIATION CORRECTION GUIDE]
You may encounter text in the format: "Character[pinyin tone]".
- "Character" is the Chinese character to be read.
- "[pinyin tone]" dictates EXACTLY how it should be pronounced.
- Tones are digits 1-4 (1=flat, 2=rising, 3=dipping, 4=falling). No digit means neutral tone.
- EXAMPLE: "更[geng 1]新" -> Read "更" as "gēng".
- EXAMPLE: "漂[piao 4]亮" -> Read "漂" as "piào".
- CRITICAL: Do NOT read the brackets or the pinyin text aloud. Only read the character with the specified pronunciation.
`;

        const finalContent = `${EMOTION_DEFINITIONS}\n\n${PRONUNCIATION_GUIDE}\n\n${prompt ? `### USER INSTRUCTIONS\n${prompt}\n\n` : ''}### SCRIPT TO READ\n${text}`;

        const response = await genAI.models.generateContent({
            model: model,
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
            contents: [{
                role: "user",
                parts: [{ text: finalContent }]
            }]
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
