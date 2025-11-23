import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'OpenAI API key not configured. Please restart your development server after adding the API key to .env.local' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client only when needed
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, action, targetLanguage } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Text is required' },
        { status: 400 }
      );
    }

    if (!action || !['correct', 'improve', 'translate'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Invalid action. Must be: correct, improve, or translate' },
        { status: 400 }
      );
    }

    let prompt = '';
    let systemPrompt = 'You are a helpful text assistant. Respond with ONLY the processed text, no explanations or additional text.';

    switch (action) {
      case 'correct':
        prompt = `Correct any spelling, grammar, and punctuation errors in the following text. Return only the corrected text:\n\n${text}`;
        break;
      case 'improve':
        prompt = `Improve the following text by fixing grammar, enhancing clarity, and making it more professional while preserving the original meaning. Return only the improved text:\n\n${text}`;
        break;
      case 'translate':
        if (!targetLanguage) {
          return NextResponse.json(
            { success: false, message: 'Target language is required for translation' },
            { status: 400 }
          );
        }
        prompt = `Translate the following text to ${targetLanguage}. Return only the translated text:\n\n${text}`;
        break;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 16384,
    });

    const result = completion.choices[0]?.message?.content?.trim() || text;

    return NextResponse.json({
      success: true,
      result,
      originalText: text,
    });

  } catch (error: any) {
    console.error('AI text processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to process text',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

