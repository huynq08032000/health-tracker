import { GoogleGenerativeAI } from '@google/generative-ai';

const PRIMARY_MODEL = 'gemini-3.5-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY');
  return new GoogleGenerativeAI(apiKey);
}

export async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = getClient();
  const models = [PRIMARY_MODEL, FALLBACK_MODEL];

  for (const modelName of models) {
    const model = genAI.getGenerativeModel({ model: modelName });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          return text;
        }
        throw new Error('Empty response from AI');
      } catch (err) {
        const message = (err as Error).message;
        const isRetryable =
          message.includes('503') ||
          message.includes('429') ||
          message.includes('500') ||
          message.includes('UNAVAILABLE') ||
          message.includes('high demand') ||
          message.includes('rate limit');

        if (attempt < MAX_RETRIES && isRetryable) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
          continue;
        }
        break;
      }
    }
  }

  throw new Error(`Không thể kết nối AI sau ${MAX_RETRIES} lần thử. Vui lòng thử lại sau.`);
}
