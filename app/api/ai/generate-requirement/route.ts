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

    const { taskTitle, currentDescription } = await request.json();

    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Task title is required' },
        { status: 400 }
      );
    }

    const prompt = `Generate detailed requirements for the following task: "${taskTitle}"

${currentDescription ? `Current description:\n${currentDescription}\n\n` : ''}

Generate comprehensive requirements that include:
- Functional requirements (what the task should do)
- Non-functional requirements (performance, security, usability)
- Acceptance criteria
- Dependencies or prerequisites
- Success criteria

Format the requirements clearly with sections and bullet points. Return only the requirements text, no title or extra formatting.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a technical requirements analyst. Generate clear, comprehensive, and actionable requirements for software tasks. Use proper formatting with sections and bullet points.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 16384,
    });

    const requirement = completion.choices[0]?.message?.content?.trim() || '';

    return NextResponse.json({
      success: true,
      requirement,
    });

  } catch (error: any) {
    console.error('AI requirement generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to generate requirement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

