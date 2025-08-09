import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const GOOGLE_AI_API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLEAI_API_KEY ||
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey: GOOGLE_AI_API_KEY })],
  model: process.env.GENKIT_MODEL || 'googleai/gemini-2.0-flash',
});
