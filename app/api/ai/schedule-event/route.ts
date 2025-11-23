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

    const { description, context } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Description is required' },
        { status: 400 }
      );
    }

    // Use function calling to extract event details from natural language
    // Structure: Event Title, Description, All day event, Start date, Start time, End Date, End time, Location, URL, Participants
    const functions = [
      {
        name: 'schedule_event',
        description: 'Extract event details from natural language description',
        parameters: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The event title',
            },
            description: {
              type: 'string',
              description: 'Detailed event description. If no description is provided in the user input, generate a professional and informative description based on the event title, time, and location.',
            },
            allDay: {
              type: 'boolean',
              description: 'Whether the event is all-day (true/false)',
            },
            startDate: {
              type: 'string',
              description: 'Start date in ISO format (YYYY-MM-DD)',
            },
            startTime: {
              type: 'string',
              description: 'Start time in 24-hour format (HH:MM) or null for all-day',
            },
            endDate: {
              type: 'string',
              description: 'End date in ISO format (YYYY-MM-DD) or null if same as start',
            },
            endTime: {
              type: 'string',
              description: 'End time in 24-hour format (HH:MM) or null for all-day',
            },
            location: {
              type: 'string',
              description: 'Event location or null',
            },
            url: {
              type: 'string',
              description: 'Event URL or link (if mentioned) or null',
            },
            participants: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of participant email addresses (if mentioned) or empty array',
            },
          },
          required: ['title', 'startDate', 'allDay'],
        },
      },
    ];

    // Get current date and time for OpenAI to use as reference
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    const currentDateTime = now.toLocaleString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const contextText = context ? `\n\nAdditional context: ${context}` : '';
    const prompt = `Parse the following event description and extract the event details. 

IMPORTANT: The current date and time is ${currentDateTime} (${currentDate} ${currentTime} UTC).
Use this EXACT current date/time as your reference for relative dates (e.g., "tomorrow" means ${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}, "next Monday" means the next Monday after ${currentDate}).${contextText}

Description: "${description}"

Extract in this order:
1. Event Title
2. Description - IMPORTANT: The description must be formatted as an official email with a professional signature. Include:
   - A proper email greeting (e.g., "Dear Team," or "Hello,")
   - The main body explaining the event purpose, details, and any important information
   - A professional closing (e.g., "Best regards," "Sincerely,")
   - A signature line with sender name and title/role
   If the user's input doesn't include a detailed description, generate a complete official email formatted description based on the event title, scheduled time, location, and context.
3. All day event (true/false)
4. Start date (must be in YYYY-MM-DD format, relative to current date: ${currentDate})
5. Start time (must be in HH:MM format in 24-hour time)
6. End Date (must be in YYYY-MM-DD format)
7. End time (must be in HH:MM format in 24-hour time)
8. Location
9. URL
10. Participants (email addresses)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that extracts event details from natural language descriptions. The current date is ${currentDate} and current time is ${currentTime} UTC. Always use this exact current date/time when calculating relative dates like "tomorrow", "next week", etc. If no time is specified, assume it's an all-day event. Always return dates in YYYY-MM-DD format and times in HH:MM format (24-hour).

IMPORTANT: For the description field, you must ALWAYS provide a description formatted as an official email with a professional signature. The email must include:
- A proper greeting (e.g., "Dear Team," "Hello," "Greetings,")
- A well-written body paragraph explaining the event purpose, details, agenda items, and any important information
- A professional closing (e.g., "Best regards," "Sincerely," "Kind regards,")
- A signature line with sender's name and title/role (you can use a generic professional title like "Event Coordinator" or "Team Lead" if not specified)

Format the description as a complete, professional email. If the user's input doesn't include a detailed description, generate a complete official email based on the event title, scheduled date and time, location, and context.`,
        },
        { role: 'user', content: prompt },
      ],
      functions,
      function_call: { name: 'schedule_event' },
      temperature: 0.3,
    });

    const functionCall = completion.choices[0]?.message?.function_call;
    
    if (!functionCall || functionCall.name !== 'schedule_event') {
      return NextResponse.json(
        { success: false, message: 'Failed to parse event details' },
        { status: 500 }
      );
    }

    const eventData = JSON.parse(functionCall.arguments || '{}');
    
    // Get current date for fallback (shouldn't be needed if OpenAI parsed correctly)
    const today = now.toISOString().split('T')[0];

    // Validate and fix dates if they seem incorrect (e.g., in the past)
    let startDate = eventData.startDate || today;
    const parsedStartDate = new Date(startDate);
    
    // If the date is clearly in the past (more than 1 day old), it's likely wrong
    // Check if it's a valid date and not too far in the past
    if (isNaN(parsedStartDate.getTime()) || parsedStartDate < new Date(now.getTime() - 24 * 60 * 60 * 1000)) {
      console.warn(`[AI Schedule] Invalid or past date detected: ${startDate}, using fallback calculation`);
      // If it says "tomorrow", calculate it properly
      if (description.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        startDate = tomorrow.toISOString().split('T')[0];
      } else {
        startDate = today;
      }
    }

    // Generate description if missing or too short
    let eventDescription = eventData.description || '';
    if (!eventDescription || eventDescription.trim().length < 20) {
      // Generate a description using a separate AI call
      try {
        const generateDescriptionPrompt = `Generate a professional, informative event description (2-3 sentences) for the following event:
Title: ${eventData.title || 'Event'}
Date: ${startDate}
Time: ${eventData.startTime ? `${eventData.startTime}` : eventData.allDay ? 'All day' : 'Not specified'}
Location: ${eventData.location || 'Not specified'}
${eventData.participants && eventData.participants.length > 0 ? `Participants: ${eventData.participants.join(', ')}` : ''}

The description should be professional, helpful, and provide context about what the event is about.`;

        const descriptionCompletion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that generates professional event descriptions. Generate concise, informative descriptions (2-3 sentences) that provide useful context about events.',
            },
            { role: 'user', content: generateDescriptionPrompt },
          ],
          temperature: 0.7,
          max_tokens: 200,
        });

        eventDescription = descriptionCompletion.choices[0]?.message?.content?.trim() || eventDescription;
      } catch (error) {
        console.warn('[AI Schedule] Failed to generate description, using fallback:', error);
        // Fallback description
        if (!eventDescription) {
          eventDescription = `Scheduled ${eventData.title || 'event'} on ${startDate}${eventData.startTime ? ` at ${eventData.startTime}` : ''}${eventData.location ? ` at ${eventData.location}` : ''}.`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        ...eventData,
        // Ensure dates are in correct format
        startDate: startDate,
        endDate: eventData.endDate || eventData.startDate || startDate,
        // Use generated description
        description: eventDescription,
      },
    });

  } catch (error: any) {
    console.error('AI event scheduling error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to schedule event',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

