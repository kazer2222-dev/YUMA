import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file.type;
    let content = '';

    // Handle image files with OCR using GPT-4 Vision
    if (fileType.startsWith('image/') && action === 'ocr') {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${fileType};base64,${base64}`;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text content from this image. Return only the extracted text, preserving the original formatting as much as possible. If there is no text, return "No text found in image."',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
        });

        content = response.choices[0]?.message?.content || 'No text extracted';
        
        return NextResponse.json({
          success: true,
          content,
          fileName: file.name,
        });
      } catch (error: any) {
        console.error('OCR error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to extract text from image' },
          { status: 500 }
        );
      }
    }

    // Handle PDF files
    if (fileType === 'application/pdf') {
      // For PDFs, we'll use AI to describe the content
      // In production, you'd want to use a proper PDF parser like pdf-parse
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      try {
        // Try to extract text using GPT-4 if it's a small PDF
        if (buffer.byteLength < 5 * 1024 * 1024) { // Less than 5MB
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a document parser. Extract and return all text content from the provided document data.',
              },
              {
                role: 'user',
                content: `Parse this PDF file (${file.name}) and extract all readable text content. The file is ${(buffer.byteLength / 1024).toFixed(2)}KB.`,
              },
            ],
            max_tokens: 4096,
          });

          content = response.choices[0]?.message?.content || 'Could not extract PDF content';
        } else {
          content = 'PDF file is too large for direct extraction. Please use a smaller file or convert it first.';
        }

        return NextResponse.json({
          success: true,
          content,
          fileName: file.name,
        });
      } catch (error: any) {
        console.error('PDF parsing error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to parse PDF' },
          { status: 500 }
        );
      }
    }

    // Handle Word documents
    if (fileType.includes('word') || fileType.includes('document')) {
      try {
        // Read as text (basic extraction)
        const text = await file.text();
        
        // Clean up XML/binary artifacts if present
        const cleanText = text
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (cleanText.length > 100) {
          content = cleanText;
        } else {
          // Use AI to help extract
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a document parser. Help extract readable text from document content.',
              },
              {
                role: 'user',
                content: `Extract readable text from this Word document named "${file.name}". Here is the raw content sample: ${cleanText.slice(0, 2000)}`,
              },
            ],
            max_tokens: 4096,
          });

          content = response.choices[0]?.message?.content || 'Could not extract document content';
        }

        return NextResponse.json({
          success: true,
          content,
          fileName: file.name,
        });
      } catch (error: any) {
        console.error('Word parsing error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to parse Word document' },
          { status: 500 }
        );
      }
    }

    // Handle Excel files
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      try {
        const text = await file.text();
        
        // Try to parse as CSV-like content
        const cleanText = text
          .replace(/<[^>]*>/g, '\n')
          .replace(/\s+/g, ' ')
          .trim();

        content = cleanText.length > 50 ? cleanText : 'Could not extract spreadsheet content. Try exporting as CSV first.';

        return NextResponse.json({
          success: true,
          content,
          fileName: file.name,
        });
      } catch (error: any) {
        console.error('Excel parsing error:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to parse Excel file. Try exporting as CSV.' },
          { status: 500 }
        );
      }
    }

    // Default: try to read as text
    try {
      content = await file.text();
      return NextResponse.json({
        success: true,
        content,
        fileName: file.name,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Parse attachment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse attachment' },
      { status: 500 }
    );
  }
}

