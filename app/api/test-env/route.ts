import { NextResponse } from 'next/server';

export async function GET() {
  const hasKey = !!process.env.OPENAI_API_KEY;
  const keyLength = process.env.OPENAI_API_KEY?.length || 0;
  const keyPrefix = process.env.OPENAI_API_KEY?.substring(0, 7) || 'none';
  
  return NextResponse.json({
    hasKey,
    keyLength,
    keyPrefix,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI')),
    nodeEnv: process.env.NODE_ENV,
  });
}











