
'use server';
/**
 * @fileOverview An AI flow to translate an item name to both Arabic and English.
 *
 * - translateItemName - A function that handles the item name translation.
 * - TranslateItemInput - The input type for the translateItemName function.
 * - TranslateItemOutput - The return type for the translateItemName function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateItemInputSchema = z.object({
  name: z.string().describe('The name of the inventory item in either Arabic or English.'),
});
export type TranslateItemInput = z.infer<typeof TranslateItemInputSchema>;

const TranslateItemOutputSchema = z.object({
  englishName: z.string().describe('The English translation of the item name.'),
  arabicName: z.string().describe('The Arabic translation of the item name.'),
});
export type TranslateItemOutput = z.infer<typeof TranslateItemOutputSchema>;

export async function translateItemName(input: TranslateItemInput): Promise<TranslateItemOutput> {
  return translateItemNameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateItemNamePrompt',
  input: {schema: TranslateItemInputSchema},
  output: {schema: TranslateItemOutputSchema},
  prompt: `You are a translation expert. The user will provide an inventory item name in either English or Arabic. 
  Your task is to provide the accurate translation for that item in both English and Arabic.

  Item Name: {{{name}}}
  `,
});

const translateItemNameFlow = ai.defineFlow(
  {
    name: 'translateItemNameFlow',
    inputSchema: TranslateItemInputSchema,
    outputSchema: TranslateItemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("Translation failed to produce an output.");
    }
    return output;
  }
);
