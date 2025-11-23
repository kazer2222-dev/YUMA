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

    const { title, context, type } = await request.json();

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Title is required' },
        { status: 400 }
      );
    }

    const itemType = type || 'task';
    const contextText = context ? `\n\nContext: ${context}` : '';

    const prompt = `Generate a clear, professional description for a ${itemType} titled "${title}".${contextText}

Requirements:
- 2-4 sentences
- Professional and actionable
- Include key details that would be relevant
- Be specific and useful

Return only the description text, no title or extra formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a helpful assistant that generates clear, professional descriptions for tasks and events. Return only the description text, no titles or formatting.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });

    const description = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({
      success: true,
      description,
    });

  } catch (error: any) {
    console.error('AI description generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to generate description',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

