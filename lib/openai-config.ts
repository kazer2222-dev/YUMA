// Utility to get OpenAI API key
export function getOpenAIApiKey(): string | null {
  // Try environment variable (Next.js should load .env.local automatically)
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  return null;
}

