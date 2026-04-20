import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Resolve Gemini/Google Generative AI API key from common env var names
const GOOGLE_AI_API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLEAI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!GOOGLE_AI_API_KEY) {
  // Provide a friendly hint in server logs to speed up setup.
  // This file is only used server-side.
  console.warn(
    '[Genkit] Missing Gemini/Google Generative AI API key. Set one of: GEMINI_API_KEY, GOOGLE_API_KEY, GOOGLEAI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY. See https://genkit.dev/docs/plugins/google-genai'
  );
}

export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_AI_API_KEY })],
  model: process.env.GENKIT_MODEL || 'googleai/gemini-2.0-flash',
});
