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

    const { taskTitle, userPrompt, existingContent, mode } = await request.json();

    if (!taskTitle || typeof taskTitle !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Task title is required' },
        { status: 400 }
      );
    }

    let prompt: string;
    
    if (mode === 'append' && existingContent) {
      // Append mode - add to existing content based on user's instruction
      prompt = `You are helping with a document titled "${taskTitle}".

Here is the existing content:
---
${existingContent}
---

User's request: "${userPrompt}"

IMPORTANT: 
- DO NOT regenerate or repeat the existing content
- ONLY generate the NEW content that should be ADDED based on the user's request
- Return ONLY the new content to be inserted, nothing else
- Keep the same style and formatting as the existing content`;
    } else {
      // Generate mode - create fresh content
      prompt = `Generate detailed requirements for the following task: "${taskTitle}"

${userPrompt ? `User's specific request: ${userPrompt}\n\n` : ''}

Generate comprehensive requirements that include:
- Functional requirements (what the task should do)
- Non-functional requirements (performance, security, usability)
- Acceptance criteria
- Dependencies or prerequisites
- Success criteria

Format the requirements clearly with sections and bullet points. Return only the requirements text, no title or extra formatting.`;
    }

    const systemMessage = mode === 'append' 
      ? 'You are a helpful writing assistant. When asked to add content to an existing document, ONLY provide the new content to be added. Never repeat or regenerate existing content. Be concise and match the existing style.'
      : 'You are a technical requirements analyst. Generate clear, comprehensive, and actionable requirements for software tasks. Use proper formatting with sections and bullet points.';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: mode === 'append' ? 2048 : 16384,
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

