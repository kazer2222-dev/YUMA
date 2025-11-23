import { NextRequest, NextResponse } from 'next/server';

interface AISuggestionRequest {
  type: 'task_suggestion' | 'status_suggestion' | 'priority_suggestion' | 'mockup_generation';
  context: {
    spaceId?: string;
    taskTitle?: string;
    taskDescription?: string;
    existingTasks?: Array<{
      title: string;
      description?: string;
      priority: string;
      status: string;
    }>;
    projectType?: string;
    requirements?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AISuggestionRequest = await request.json();
    const { type, context } = body;

    let suggestions: any = {};

    switch (type) {
      case 'task_suggestion':
        suggestions = await generateTaskSuggestions(context);
        break;
      case 'status_suggestion':
        suggestions = await generateStatusSuggestions(context);
        break;
      case 'priority_suggestion':
        suggestions = await generatePrioritySuggestions(context);
        break;
      case 'mockup_generation':
        suggestions = await generateMockupSuggestions(context);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid suggestion type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateTaskSuggestions(context: any) {
  // Mock AI suggestions based on context
  const baseSuggestions = [
    'Review and test the implementation',
    'Update documentation',
    'Create user feedback collection',
    'Optimize performance',
    'Add error handling',
    'Implement security measures',
    'Create backup strategy',
    'Plan deployment process'
  ];

  // Filter suggestions based on existing tasks
  const existingTitles = context.existingTasks?.map((t: any) => t.title.toLowerCase()) || [];
  const filteredSuggestions = baseSuggestions.filter(
    suggestion => !existingTitles.some((title: string) => 
      title.includes(suggestion.toLowerCase()) || suggestion.toLowerCase().includes(title)
    )
  );

  return {
    tasks: filteredSuggestions.slice(0, 5).map((title, index) => ({
      id: `suggestion-${index}`,
      title,
      description: generateDescriptionForTask(title),
      priority: suggestPriority(title),
      estimatedHours: Math.floor(Math.random() * 8) + 1
    }))
  };
}

async function generateStatusSuggestions(context: any) {
  const statuses = [
    { name: 'To Do', key: 'TODO', color: '#6b7280' },
    { name: 'In Progress', key: 'IN_PROGRESS', color: '#3b82f6' },
    { name: 'Review', key: 'REVIEW', color: '#f59e0b' },
    { name: 'Testing', key: 'TESTING', color: '#8b5cf6' },
    { name: 'Done', key: 'DONE', color: '#10b981' },
    { name: 'Blocked', key: 'BLOCKED', color: '#ef4444' }
  ];

  return { statuses };
}

async function generatePrioritySuggestions(context: any) {
  const priorities = [
    { value: 'LOWEST', label: 'Lowest', color: '#6b7280' },
    { value: 'LOW', label: 'Low', color: '#10b981' },
    { value: 'NORMAL', label: 'Normal', color: '#3b82f6' },
    { value: 'HIGH', label: 'High', color: '#f59e0b' },
    { value: 'HIGHEST', label: 'Highest', color: '#ef4444' }
  ];

  return { priorities };
}

async function generateMockupSuggestions(context: any) {
  // Mock mockup generation
  const mockups = [
    {
      id: 'mockup-1',
      title: 'Dashboard Layout',
      description: 'Clean dashboard with task overview and quick actions',
      imageUrl: '/api/placeholder/400/300',
      type: 'dashboard'
    },
    {
      id: 'mockup-2',
      title: 'Task Detail View',
      description: 'Detailed task view with comments and attachments',
      imageUrl: '/api/placeholder/400/300',
      type: 'task-detail'
    },
    {
      id: 'mockup-3',
      title: 'Mobile Interface',
      description: 'Responsive mobile interface for task management',
      imageUrl: '/api/placeholder/400/300',
      type: 'mobile'
    }
  ];

  return { mockups };
}

function generateDescriptionForTask(title: string): string {
  const descriptions: { [key: string]: string } = {
    'Review and test the implementation': 'Thoroughly test all functionality and ensure quality standards are met',
    'Update documentation': 'Keep documentation current with latest changes and improvements',
    'Create user feedback collection': 'Implement system to gather and analyze user feedback',
    'Optimize performance': 'Identify and resolve performance bottlenecks',
    'Add error handling': 'Implement comprehensive error handling and logging',
    'Implement security measures': 'Add necessary security features and best practices',
    'Create backup strategy': 'Develop and implement data backup and recovery procedures',
    'Plan deployment process': 'Create detailed deployment plan and procedures'
  };

  return descriptions[title] || 'Task description to be defined';
}

function suggestPriority(title: string): string {
  const highPriorityKeywords = ['security', 'critical', 'urgent', 'bug', 'fix'];
  const lowPriorityKeywords = ['documentation', 'optimization', 'cleanup', 'refactor'];

  const titleLower = title.toLowerCase();
  
  if (highPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'HIGH';
  } else if (lowPriorityKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'LOW';
  } else {
    return 'NORMAL';
  }
}

