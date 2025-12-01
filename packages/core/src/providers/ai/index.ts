import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import { generateObject as aiGenerateObject, generateText as aiGenerateText } from 'ai';

import { env } from '~/config/env';

const googleProvider = createGoogleGenerativeAI({
  apiKey: env.AI_GATEWAY_API_KEY,
});

const openaiProvider = createOpenAI({
  apiKey: env.AI_GATEWAY_API_KEY,
});

const modelMap: Record<string, LanguageModelV2> = {
  'google/gemini-2.5-flash': googleProvider('gemini-2.5-flash'),
  'openai/gpt-4o': openaiProvider('gpt-4o'),
};

function getModel(modelId: string): LanguageModelV2 {
  const model = modelMap[modelId];
  if (!model) {
    throw new Error(`Model ${modelId} not found. Available models: ${Object.keys(modelMap).join(', ')}`);
  }
  return model;
}

export const generateText: typeof aiGenerateText = async (options) => {
  if (typeof options.model !== 'string') {
    throw new Error('Model must be specified as a string model ID');
  }
  const modelId = options.model;
  const model = getModel(modelId);
  return aiGenerateText({ ...options, model });
};

export const generateObject: typeof aiGenerateObject = async (options) => {
  if (typeof options.model !== 'string') {
    throw new Error('Model must be specified as a string model ID');
  }
  const modelId = options.model;
  const model = getModel(modelId);
  return aiGenerateObject({ ...options, model });
};

export { googleProvider, openaiProvider };
