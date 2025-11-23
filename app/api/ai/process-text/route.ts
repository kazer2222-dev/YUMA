import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import OpenAI from 'openai';
import { getOpenAIApiKey } from '@/lib/openai-config';

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

    // Get API key using utility function
    const apiKey = getOpenAIApiKey();
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'OpenAI API key not configured. Please ensure .env.local contains OPENAI_API_KEY and restart the server.',
        },
        { status: 500 }
      );
    }

    // Initialize OpenAI client only when needed
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { text, action, targetLanguage, customPrompt } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Text is required' },
        { status: 400 }
      );
    }

    let prompt = '';
    let systemPrompt = 'You are a helpful assistant. Return ONLY the direct result requested by the user. Do NOT repeat the instruction, do NOT add prefixes like "Generate the word:", "Result:", "Here is:", or any explanatory text. Just provide the answer directly.';

    if (action === 'improve') {
      prompt = `Improve the following requirements text by enhancing clarity, structure, and completeness while preserving all original information:\n\n${text}`;
      systemPrompt = 'Return ONLY the improved text, nothing else.';
    } else if (action === 'check-errors') {
      prompt = `Check the following text for errors (grammar, spelling, clarity, logical issues) and provide a corrected version:\n\n${text}`;
      systemPrompt = 'Return ONLY the corrected text, nothing else.';
    } else if (action === 'translate') {
      const languageNames: { [key: string]: string } = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'az': 'Azerbaijani',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'nl': 'Dutch',
        'pl': 'Polish',
        'tr': 'Turkish',
        'sv': 'Swedish',
        'da': 'Danish',
        'no': 'Norwegian',
        'fi': 'Finnish',
        'uk': 'Ukrainian',
      };
      const targetLang = targetLanguage || 'en';
      const targetLangName = languageNames[targetLang] || 'English';
      
      // Special handling for Azerbaijani to avoid confusion with Turkish
      let translationInstruction = `Translate the following text to ${targetLangName}`;
      if (targetLang === 'az') {
        translationInstruction = `Translate the following text to Azerbaijani (azərbaycan dili). Do NOT translate to Turkish.`;
      }
      
      prompt = `${translationInstruction}:\n\n${text}`;
      systemPrompt = 'Return ONLY the translated text, nothing else. Do NOT confuse Azerbaijani with Turkish - they are different languages.';
    } else if (action === 'update') {
      if (!customPrompt || typeof customPrompt !== 'string') {
        return NextResponse.json(
          { success: false, message: 'Custom prompt is required for update action' },
          { status: 400 }
        );
      }
      // Format: Apply the prompt instruction to the input text
      // Put instruction first, then the input text to make it clear what action to perform
      prompt = `${customPrompt}\n\nUsing: "${text}"`;
      systemPrompt = 'You are a helpful assistant. Follow the user\'s instruction precisely and apply it to the provided word/text. Return ONLY the result of applying the instruction, nothing else. Do NOT repeat the instruction, do NOT add prefixes like "Result:", "Here is:", or any explanatory text. Do NOT just concatenate words. If asked to "make a sentence", create a complete, meaningful sentence that naturally includes the word.';
    } else {
      // Default: Directly fulfill the user's request
      // Parse the request to extract the actual task
      let directRequest = text;
      
      // Common patterns - extract the actual action needed
      if (text.toLowerCase().includes('generate a word') || text.toLowerCase().includes('give me a word')) {
        directRequest = 'A single random word.';
      } else if (text.toLowerCase().includes('generate') || text.toLowerCase().includes('create') || text.toLowerCase().includes('make')) {
        // Extract what to generate/create
        directRequest = `${text}\n\nReturn only the result itself, with no prefixes, labels, or explanatory text.`;
      }
      
      prompt = directRequest;
    }

    // Set token limit within model constraints (gpt-4o-mini supports max 16384 completion tokens)
    const maxTokens = 16384;
    console.log('Sending request to OpenAI:', {
      model: 'gpt-4o-mini',
      action,
      promptLength: prompt.length,
      systemPromptLength: systemPrompt.length,
      maxTokens
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const result = completion.choices[0]?.message?.content?.trim() || text;
    
    // Check if response was truncated
    const finishReason = completion.choices[0]?.finish_reason;
    if (finishReason === 'length') {
      console.warn('AI response was truncated');
      console.warn('Response length:', result.length, 'characters');
    }

    // Log for debugging
    console.log('AI response received:', {
      action,
      resultLength: result.length,
      finishReason,
      usage: completion.usage,
    });

    return NextResponse.json({
      success: true,
      result,
      originalText: text,
      wasTruncated: finishReason === 'length',
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

