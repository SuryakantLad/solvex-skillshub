import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

export const MODELS = {
  flash: 'gemini-2.5-flash',
  embedding: 'text-embedding-004',
};

export const JSON_CONFIG = { temperature: 0.05, topK: 40, topP: 0.95, maxOutputTokens: 8192 };
export const RANKING_CONFIG = { temperature: 0.15, topK: 40, topP: 0.95, maxOutputTokens: 8192 };
export const CHAT_CONFIG = { temperature: 0.4, topK: 40, topP: 0.95, maxOutputTokens: 2048 };

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const BASE_BACKOFF_MS = 1200;
const HARD_TIMEOUT_MS = 55_000;

function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(key);
}

async function callGemini(prompt, generationConfig) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODELS.flash, generationConfig, safetySettings: SAFETY_SETTINGS });
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Claude AI request timed out after 55s')), HARD_TIMEOUT_MS));
  const result = await Promise.race([model.generateContent(prompt), timeout]);
  const text = result.response.text();
  if (!text) throw new Error('Claude AI returned an empty response');
  return text;
}

export async function generateJSON(prompt, maxRetries = 3) {
  return _withRetry(prompt, JSON_CONFIG, maxRetries);
}

export async function generateRanking(prompt, maxRetries = 3) {
  return _withRetry(prompt, RANKING_CONFIG, maxRetries);
}

export async function generateChat(prompt, maxRetries = 2) {
  return _withRetry(prompt, CHAT_CONFIG, maxRetries);
}

export async function generateAIResponse(prompt) {
  return generateJSON(prompt);
}

export async function embedText(text) {
  const client = getClient();
  const model = client.getGenerativeModel({ model: MODELS.embedding });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function embedBatch(texts) {
  return Promise.all(texts.map(embedText));
}

async function _withRetry(prompt, config, maxRetries) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const text = await callGemini(prompt, config);
      return text;
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED') || error.status === 429;
      const isOverloaded = error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.status === 503;
      const isAuth = error.message?.includes('401') || error.message?.includes('API_KEY') || error.status === 401;
      if (isAuth) break;
      if (attempt === maxRetries) break;
      const waitMs = isRateLimit
        ? BASE_BACKOFF_MS * Math.pow(2, attempt) * 2
        : BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      if (isRateLimit || isOverloaded) await _sleep(waitMs);
    }
  }
  throw lastError;
}

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
