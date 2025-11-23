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

    const { description, taskTitle, dueDate, context } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Description is required' },
        { status: 400 }
      );
    }

    // Use function calling to extract reminder details
    const functions = [
      {
        name: 'set_reminder',
        description: 'Extract reminder details from natural language description',
        parameters: {
          type: 'object',
          properties: {
            reminderTime: {
              type: 'string',
              description: 'Reminder time in ISO format (YYYY-MM-DDTHH:MM:SS) or relative description',
            },
            message: {
              type: 'string',
              description: 'Custom reminder message or null to use default',
            },
            type: {
              type: 'string',
              enum: ['before', 'at', 'after'],
              description: 'When to send reminder: before the event/task, at the time, or after',
            },
            minutesBefore: {
              type: 'number',
              description: 'Minutes before the event/task to remind (if type is "before")',
            },
          },
          required: ['reminderTime', 'type'],
        },
      },
    ];

    const contextParts: string[] = [];
    if (taskTitle) contextParts.push(`Task: ${taskTitle}`);
    if (dueDate) contextParts.push(`Due date: ${dueDate}`);
    if (context) contextParts.push(`Context: ${context}`);
    
    const contextText = contextParts.length > 0 ? `\n\n${contextParts.join('\n')}` : '';
    
    const prompt = `Parse the following reminder description and extract the reminder details. Use the current date/time as reference if times are relative.${contextText}

Description: "${description}"

Extract:
- When the reminder should trigger (specific time or relative to task/event)
- Reminder message (if custom)
- Whether it's before, at, or after the event/task
- How many minutes/hours before (if applicable)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts reminder details from natural language. Use the current date/time as reference for relative times. Default reminder messages should be professional and actionable.',
        },
        { role: 'user', content: prompt },
      ],
      functions,
      function_call: { name: 'set_reminder' },
      temperature: 0.3,
    });

    const functionCall = completion.choices[0]?.message?.function_call;
    
    if (!functionCall || functionCall.name !== 'set_reminder') {
      return NextResponse.json(
        { success: false, message: 'Failed to parse reminder details' },
        { status: 500 }
      );
    }

    const reminderData = JSON.parse(functionCall.arguments || '{}');
    
    // Calculate actual reminder time based on type
    let calculatedTime: string | null = null;
    const now = new Date();
    
    if (reminderData.type === 'before' && dueDate) {
      const due = new Date(dueDate);
      const minutes = reminderData.minutesBefore || 15;
      const reminder = new Date(due.getTime() - minutes * 60 * 1000);
      calculatedTime = reminder.toISOString();
    } else if (reminderData.type === 'at' && dueDate) {
      calculatedTime = new Date(dueDate).toISOString();
    } else if (reminderData.reminderTime) {
      // Try to parse the reminder time
      try {
        const reminder = new Date(reminderData.reminderTime);
        calculatedTime = reminder.toISOString();
      } catch {
        // If parsing fails, use as-is
        calculatedTime = reminderData.reminderTime;
      }
    }

    return NextResponse.json({
      success: true,
      reminder: {
        ...reminderData,
        calculatedTime,
        message: reminderData.message || (taskTitle ? `Reminder: ${taskTitle} is due soon` : 'Reminder'),
      },
    });

  } catch (error: any) {
    console.error('AI reminder setting error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to set reminder',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

