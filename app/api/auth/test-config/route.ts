import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 
      process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 
      'NOT FOUND',
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasGoogleRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    hasGoogleApiKey: !!process.env.GOOGLE_API_KEY,
    allGoogleVars: Object.keys(process.env).filter(k => k.includes('GOOGLE')),
    nodeEnv: process.env.NODE_ENV,
  });
}
















