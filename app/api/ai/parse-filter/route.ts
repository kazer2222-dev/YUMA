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
      // Fallback: try to parse simple filters without AI
      const { query, fields } = await request.json();
      return NextResponse.json({
        success: true,
        filters: parseSimpleFilters(query, fields),
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { query, fields } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Query is required' },
        { status: 400 }
      );
    }

    const fieldDescriptions = fields.map((f: any) => `${f.key}: ${f.label}`).join(', ');
    
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const systemPrompt = `You are a task filtering assistant. Parse natural language queries into structured filter conditions.

Available fields: ${fieldDescriptions}

Return a JSON array of filter objects. Each filter has:
- field: the field key (e.g., "status", "assignee", "priority", "dueDate", "createdAt", "summary")
- operator: one of "equals", "contains", "not_equals", "is_empty", "is_not_empty", "greater_than", "less_than", "before", "after", "between"
- value: the filter value (string, number, or date string in YYYY-MM-DD format)
- value2: (optional, only for "between" operator) the second date value in YYYY-MM-DD format

IMPORTANT DATE HANDLING:
- "today" = ${today}
- "tomorrow" = ${tomorrow}
- "yesterday" = ${yesterday}
- Always use YYYY-MM-DD format for dates
- For date fields (dueDate, createdAt), use operators: "equals", "before", "after", "between", "is_empty", "is_not_empty"

Examples:
- "tasks assigned to John" -> [{"field": "assignee", "operator": "contains", "value": "John"}]
- "high priority tasks" -> [{"field": "priority", "operator": "equals", "value": "High"}]
- "tasks due today" -> [{"field": "dueDate", "operator": "equals", "value": "${today}"}]
- "tasks due till today" or "tasks due before today" -> [{"field": "dueDate", "operator": "before", "value": "${today}"}]
- "tasks due after today" -> [{"field": "dueDate", "operator": "after", "value": "${today}"}]
- "tasks due this week" -> [{"field": "dueDate", "operator": "between", "value": "${today}", "value2": "${tomorrow}"}]
- "tasks with 'bug' in summary" -> [{"field": "summary", "operator": "contains", "value": "bug"}]

Return ONLY valid JSON, no explanations.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this query into filters: "${query}"` }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const result = completion.choices[0]?.message?.content?.trim() || '[]';
    
    try {
      const filters = JSON.parse(result);
      return NextResponse.json({
        success: true,
        filters: Array.isArray(filters) ? filters : [],
      });
    } catch (parseError) {
      // Fallback to simple parsing
      return NextResponse.json({
        success: true,
        filters: parseSimpleFilters(query, fields),
      });
    }

  } catch (error: any) {
    console.error('AI filter parsing error:', error);
    // Fallback to simple parsing
    try {
      const { query, fields } = await request.json();
      return NextResponse.json({
        success: true,
        filters: parseSimpleFilters(query, fields),
      });
    } catch {
      return NextResponse.json(
        { success: false, message: 'Failed to parse filters' },
        { status: 500 }
      );
    }
  }
}

function parseSimpleFilters(query: string, fields: any[]): any[] {
  const filters: any[] = [];
  const lowerQuery = query.toLowerCase();
  const today = new Date().toISOString().split('T')[0];

  // Date-related queries
  if (lowerQuery.includes('due') || lowerQuery.includes('date')) {
    if (lowerQuery.includes('till today') || lowerQuery.includes('until today') || lowerQuery.includes('before today') || lowerQuery.includes('by today')) {
      filters.push({ field: 'dueDate', operator: 'before', value: today });
      return filters;
    }
    if (lowerQuery.includes('after today') || lowerQuery.includes('from today')) {
      filters.push({ field: 'dueDate', operator: 'after', value: today });
      return filters;
    }
    if (lowerQuery.includes('today')) {
      filters.push({ field: 'dueDate', operator: 'equals', value: today });
      return filters;
    }
    if (lowerQuery.includes('tomorrow')) {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      filters.push({ field: 'dueDate', operator: 'equals', value: tomorrow });
      return filters;
    }
    if (lowerQuery.includes('yesterday')) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      filters.push({ field: 'dueDate', operator: 'equals', value: yesterday });
      return filters;
    }
  }

  // Simple keyword matching
  if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent')) {
    filters.push({ field: 'priority', operator: 'equals', value: 'High' });
  }
  if (lowerQuery.includes('low priority')) {
    filters.push({ field: 'priority', operator: 'equals', value: 'Low' });
  }
  if (lowerQuery.includes('unassigned') || lowerQuery.includes('no assignee')) {
    filters.push({ field: 'assignee', operator: 'is_empty', value: null });
  }
  if (lowerQuery.includes('done') || lowerQuery.includes('completed')) {
    filters.push({ field: 'status', operator: 'contains', value: 'Done' });
  }
  if (lowerQuery.includes('in progress')) {
    filters.push({ field: 'status', operator: 'contains', value: 'In Progress' });
  }
  if (lowerQuery.includes('to do') || lowerQuery.includes('todo')) {
    filters.push({ field: 'status', operator: 'contains', value: 'To Do' });
  }
  if (lowerQuery.includes('blocked')) {
    filters.push({ field: 'status', operator: 'contains', value: 'Blocked' });
  }

  // If no specific filters found, use contains on summary
  if (filters.length === 0) {
    filters.push({ field: 'summary', operator: 'contains', value: query });
  }

  return filters;
}

