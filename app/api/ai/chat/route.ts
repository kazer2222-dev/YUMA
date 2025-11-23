import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

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

    const { message, spaceId, context, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }

    // Mock AI response - In production, integrate with OpenAI, Anthropic, or similar
    // This is a simplified version that provides helpful responses
    const aiResponse = generateAIResponse(message, context, conversationHistory);

    return NextResponse.json({
      success: true,
      response: aiResponse,
    });

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateAIResponse(message: string, context?: string, history?: any[]): string {
  const lowerMessage = message.toLowerCase();

  // Task-related responses
  if (lowerMessage.includes('task') || lowerMessage.includes('suggest')) {
    return `I can help you with tasks! Here are some suggestions:
    
1. Break down large tasks into smaller, actionable items
2. Prioritize tasks based on urgency and importance
3. Set realistic deadlines and time estimates
4. Use tags to organize related tasks
5. Assign tasks to team members for better collaboration

Would you like me to help you create specific tasks for your project?`;
  }

  // Prioritization
  if (lowerMessage.includes('prioritize') || lowerMessage.includes('priority')) {
    return `To prioritize effectively, consider:

1. **Urgency vs Importance**: Focus on tasks that are both urgent and important
2. **Dependencies**: Complete tasks that block others first
3. **Deadlines**: Tasks with approaching deadlines should be prioritized
4. **Impact**: Consider the business/value impact of each task
5. **Effort**: Sometimes quick wins (low effort, high impact) are valuable

I can analyze your current tasks and suggest a priority order. Would you like me to do that?`;
  }

  // Roadmap
  if (lowerMessage.includes('roadmap') || lowerMessage.includes('plan')) {
    return `I can help you create a roadmap! Here's a suggested approach:

1. **Define Goals**: Start with clear, measurable objectives
2. **Break into Phases**: Organize work into logical phases or sprints
3. **Set Milestones**: Define key milestones to track progress
4. **Estimate Timeline**: Consider dependencies and team capacity
5. **Review Regularly**: Update the roadmap as priorities change

Would you like me to generate a detailed roadmap based on your current tasks?`;
  }

  // General help
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return `I'm here to help! I can assist with:

- Task creation and management
- Prioritization strategies
- Project planning and roadmaps
- Best practices for productivity
- Answering questions about your workspace

What would you like help with today?`;
  }

  // Default response
  return `I understand you're asking about: "${message}"

I'm an AI assistant designed to help you manage tasks and projects more effectively. I can:
- Suggest tasks and subtasks
- Help prioritize your work
- Generate project roadmaps
- Provide productivity tips
- Answer questions about your workspace

How can I help you today?`;
}
















