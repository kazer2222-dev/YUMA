import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/documents/[documentId]/ai - AI operations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; documentId: string }> | { slug: string; documentId: string } }
) {
  try {
    const { slug, documentId } = await resolveParams(params);
    
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
    const body = await request.json();
    const { operation, options = {} } = body;

    if (!operation) {
      return NextResponse.json(
        { success: false, message: 'Operation is required' },
        { status: 400 }
      );
    }

    // Check access
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        space: { slug },
        deletedAt: null
      },
      include: {
        access: {
          where: { userId: user.id }
        }
      }
    });

    if (!document) {
      return NextResponse.json(
        { success: false, message: 'Document not found' },
        { status: 404 }
      );
    }

    const isAuthor = document.authorId === user.id;
    const hasAccess = document.access.length > 0 || isAuthor;
    const membership = await prisma.spaceMember.findFirst({
      where: { space: { slug }, userId: user.id }
    });
    const isAdmin = await AuthService.isAdmin(user.id);

    if (!hasAccess && !membership && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Get document content
    const content = document.content || '';
    const textContent = content.replace(/<[^>]*>/g, ''); // Strip HTML tags

    let result: any = {};

    switch (operation) {
      case 'summarize': {
        const length = options.length || 'medium'; // short, medium, long
        // In production, call actual AI service
        const summary = await generateSummary(textContent, length);
        result = { summary };
        break;
      }

      case 'tag': {
        // Auto-tagging
        const tags = await generateTags(textContent, document.title);
        // Update document tags
        const existingTags = document.tags ? JSON.parse(document.tags) : [];
        const uniqueTags = new Set([...existingTags, ...tags]);
        const newTags = Array.from(uniqueTags);
        await prisma.document.update({
          where: { id: documentId },
          data: { tags: JSON.stringify(newTags) }
        });
        result = { tags: newTags };
        break;
      }

      case 'extract-metadata': {
        // Extract entities, dates, action items
        const metadata = await extractMetadata(textContent);
        await prisma.document.update({
          where: { id: documentId },
          data: { metadata: JSON.stringify(metadata) }
        });
        result = { metadata };
        break;
      }

      case 'generate-toc': {
        // Generate table of contents
        const structure = await generateTOC(content, document.type);
        await prisma.document.update({
          where: { id: documentId },
          data: { structure: JSON.stringify(structure) }
        });
        result = { structure };
        break;
      }

      case 'detect-pii': {
        // Detect PII
        const piiDetections = await detectPII(textContent);
        result = { pii: piiDetections };
        break;
      }

      case 'qa': {
        // Question answering
        const question = options.question;
        if (!question) {
          return NextResponse.json(
            { success: false, message: 'Question is required' },
            { status: 400 }
          );
        }
        const answer = await answerQuestion(textContent, question);
        result = { question, answer };
        break;
      }

      case 'rewrite': {
        // AI rewrite
        const instruction = options.instruction || 'improve clarity';
        const rewritten = await rewriteText(textContent, instruction);
        result = { original: textContent, rewritten };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Unknown operation' },
          { status: 400 }
        );
    }

    // Create activity
    await prisma.documentActivity.create({
      data: {
        documentId,
        userId: user.id,
        type: 'AI_OPERATION',
        data: JSON.stringify({ operation, timestamp: new Date().toISOString() })
      }
    });

    return NextResponse.json({
      success: true,
      operation,
      result
    });
  } catch (error) {
    console.error('Error performing AI operation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to perform AI operation' },
      { status: 500 }
    );
  }
}

// Placeholder AI functions - replace with actual AI service calls
async function generateSummary(text: string, length: string): Promise<string> {
  // In production, call OpenAI, Anthropic, or similar
  const maxLength = length === 'short' ? 100 : length === 'medium' ? 300 : 500;
  return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
}

async function generateTags(text: string, title: string): Promise<string[]> {
  // In production, use NLP to extract tags
  const words = (title + ' ' + text).toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3 && !commonWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

async function extractMetadata(text: string): Promise<any> {
  // In production, use NLP to extract entities, dates, etc.
  return {
    entities: [],
    dates: [],
    actionItems: []
  };
}

async function generateTOC(content: string, type: string): Promise<any> {
  // Extract headings from HTML/Markdown
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  const headings: any[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, ''),
      id: `heading-${headings.length}`
    });
  }
  return { headings };
}

async function detectPII(text: string): Promise<any[]> {
  // In production, use PII detection service
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const detections: any[] = [];
  
  let match;
  while ((match = emailRegex.exec(text)) !== null) {
    detections.push({ type: 'EMAIL', value: match[0], position: match.index });
  }
  while ((match = phoneRegex.exec(text)) !== null) {
    detections.push({ type: 'PHONE', value: match[0], position: match.index });
  }
  
  return detections;
}

async function answerQuestion(text: string, question: string): Promise<any> {
  // In production, use RAG or LLM for Q&A
  return {
    answer: 'This is a placeholder answer. In production, use an AI service to answer questions about the document.',
    citations: []
  };
}

async function rewriteText(text: string, instruction: string): Promise<string> {
  // In production, use LLM for rewriting
  return text; // Placeholder
}

