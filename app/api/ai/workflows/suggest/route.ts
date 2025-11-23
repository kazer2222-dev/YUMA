import { NextRequest, NextResponse } from 'next/server';

interface TemplateFieldSummary {
  id: string;
  type: string;
  label: string;
  required?: boolean;
}

interface WorkflowSuggestionRequest {
  templateId?: string;
  templateName?: string;
  fields: TemplateFieldSummary[];
  spaceId?: string;
  prompt?: string;
}

interface WorkflowStatusSuggestion {
  key: string;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE';
  color?: string;
  isInitial: boolean;
  isFinal: boolean;
  order: number;
}

interface WorkflowTransitionSuggestion {
  name: string;
  fromKey: string;
  toKey: string;
  uiTrigger: string;
  order: number;
  assigneeOnly?: boolean;
  adminOnly?: boolean;
  requirePriority?: boolean;
  preventOpenSubtasks?: boolean;
}

interface WorkflowSuggestionResult {
  name: string;
  description: string;
  statuses: WorkflowStatusSuggestion[];
  transitions: WorkflowTransitionSuggestion[];
  recommendations: string[];
  warnings: string[];
}

interface WorkflowSuggestionValidation {
  valid: boolean;
  issues: string[];
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body: WorkflowSuggestionRequest = {
      ...rawBody,
      fields: Array.isArray(rawBody?.fields) ? rawBody.fields : [],
    };
    const suggestion = generateWorkflowSuggestion(body);
    const validation = validateSuggestion(suggestion);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: 'AI generated workflow did not pass validation',
          issues: validation.issues,
          warnings: suggestion.warnings,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      suggestion: {
        ...suggestion,
        validations: {
          warnings: suggestion.warnings,
          issues: validation.issues,
        },
      },
      issues: validation.issues,
    });
  } catch (error) {
    console.error('AI workflow suggestion error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate workflow suggestion' },
      { status: 500 },
    );
  }
}

function generateWorkflowSuggestion(input: WorkflowSuggestionRequest): WorkflowSuggestionResult {
  const fields = Array.isArray(input.fields) ? input.fields : [];
  const promptInsights = analysePrompt(input.prompt);

  const requiredFieldCount = fields.filter((field) => field.required).length;
  const hasDesignField = fields.some((field) => field.label.toLowerCase().includes('design')) || promptInsights.hasDesign;
  const hasReviewField = fields.some((field) => field.label.toLowerCase().includes('review')) || promptInsights.hasReview;
  const hasQaField =
    fields.some((field) => field.label.toLowerCase().includes('qa')) || promptInsights.hasQa || promptInsights.hasTesting;

  const statuses: WorkflowStatusSuggestion[] = [];
  const addStatus = (status: Omit<WorkflowStatusSuggestion, 'order'>) => {
    if (statuses.some((existing) => existing.key === status.key)) {
      return;
    }
    statuses.push({ ...status, order: statuses.length });
  };

  if (promptInsights.hasBacklog) {
    addStatus({
      key: 'backlog',
      name: 'Backlog',
      category: 'TODO',
      color: '#0ea5e9',
      isInitial: false,
      isFinal: false,
    });
  }

  addStatus({
    key: 'todo',
    name: 'To Do',
    category: 'TODO',
    color: '#71717a',
    isInitial: false,
    isFinal: false,
  });

  if (promptInsights.hasPlanning) {
    addStatus({
      key: 'planning',
      name: 'Planning',
      category: 'IN_PROGRESS',
      color: '#6366f1',
      isInitial: false,
      isFinal: false,
    });
  }

  if (hasDesignField) {
    addStatus({
      key: 'design',
      name: 'Design',
      category: 'IN_PROGRESS',
      color: '#ec4899',
      isInitial: false,
      isFinal: false,
    });
  }

  addStatus({
    key: 'in-progress',
    name: 'In Progress',
    category: 'IN_PROGRESS',
    color: '#3b82f6',
    isInitial: false,
    isFinal: false,
  });

  if (hasReviewField) {
    addStatus({
      key: 'review',
      name: 'Review',
      category: 'IN_PROGRESS',
      color: '#f59e0b',
      isInitial: false,
      isFinal: false,
    });
  }

  if (promptInsights.hasQa || promptInsights.hasTesting) {
    const key = promptInsights.hasQa ? 'qa' : 'testing';
    const name = promptInsights.hasQa ? 'QA Testing' : 'Testing';
    addStatus({
      key,
      name,
      category: 'IN_PROGRESS',
      color: '#8b5cf6',
      isInitial: false,
      isFinal: false,
    });
  }

  if (promptInsights.hasDeploy) {
    addStatus({
      key: 'deploy',
      name: 'Deploy',
      category: 'DONE',
      color: '#14b8a6',
      isInitial: false,
      isFinal: false,
    });
  }

  addStatus({
    key: 'done',
    name: 'Done',
    category: 'DONE',
    color: '#10b981',
    isInitial: false,
    isFinal: true,
  });

  if (statuses.length === 0) {
    addStatus({
      key: 'todo',
      name: 'To Do',
      category: 'TODO',
      color: '#71717a',
      isInitial: false,
      isFinal: false,
    });
    addStatus({
      key: 'done',
      name: 'Done',
      category: 'DONE',
      color: '#10b981',
      isInitial: false,
      isFinal: true,
    });
  }

  statuses.forEach((status, index) => {
    status.order = index;
    status.isInitial = index === 0;
    status.isFinal = index === statuses.length - 1;
  });

  const { statuses: sanitizedStatuses, warnings: statusWarnings } = ensureStatusIntegrity(statuses);
  const { transitions: sanitizedTransitions, warnings: transitionWarnings } = sanitizeTransitions(
    sanitizedStatuses,
    buildTransitionSuggestions(sanitizedStatuses, requiredFieldCount),
  );

  const recommendations = buildRecommendations(
    sanitizedStatuses.length,
    requiredFieldCount,
    hasQaField || promptInsights.hasTesting,
  );

  const suggestionWarnings = [...statusWarnings, ...transitionWarnings, ...promptInsights.warnings];
  const workflowName = input.templateName
    ? `${input.templateName} Flow`
    : promptInsights.derivedName
    ? `${promptInsights.derivedName} Workflow`
    : 'Suggested Workflow';

  const workflowDescription = input.prompt
    ? `AI generated workflow based on prompt: ${truncatePrompt(input.prompt)}`
    : 'AI generated workflow based on template fields and requirements.';

  return {
    name: workflowName,
    description: workflowDescription,
    statuses: sanitizedStatuses,
    transitions: sanitizedTransitions,
    recommendations,
    warnings: suggestionWarnings,
  };
}

interface PromptInsights {
  hasDesign: boolean;
  hasReview: boolean;
  hasQa: boolean;
  hasTesting: boolean;
  hasDeploy: boolean;
  hasBacklog: boolean;
  hasPlanning: boolean;
  derivedName?: string;
  warnings: string[];
}

function analysePrompt(prompt?: string): PromptInsights {
  if (!prompt || typeof prompt !== 'string') {
    return {
      hasDesign: false,
      hasReview: false,
      hasQa: false,
      hasTesting: false,
      hasDeploy: false,
      hasBacklog: false,
      hasPlanning: false,
      warnings: [],
    };
  }

  const text = prompt.toLowerCase();
  const warnings: string[] = [];

  const hasDesign = /\bdesign\b|\bux\b|\bprototype\b|\bwireframe\b/.test(text);
  const hasReview = /\breview\b|\bapproval\b|\bsign[- ]?off\b|\bpeer\b|\baudit\b/.test(text);
  const hasTesting = /\btest\b|\btesting\b|\bvalidate\b|\bverification\b/.test(text);
  const hasQa = /\bqa\b|\bquality assurance\b|\bquality\b/.test(text) || hasTesting;
  const hasDeploy = /\bdeploy\b|\brelease\b|\blaunch\b|\bproduction\b/.test(text);
  const hasBacklog = /\bbacklog\b|\binbox\b/.test(text);
  const hasPlanning = /\bplan\b|\bplanning\b|\brefine\b|\bgroom\b/.test(text);

  if (!hasDesign && !hasReview && !hasQa && !hasDeploy && !hasPlanning && !hasBacklog) {
    warnings.push('Prompt did not reference specific workflow stages. Generated a standard To Do -> In Progress -> Done flow.');
  }

  return {
    hasDesign,
    hasReview,
    hasQa,
    hasTesting,
    hasDeploy,
    hasBacklog,
    hasPlanning,
    derivedName: deriveNameFromPrompt(prompt),
    warnings,
  };
}

function deriveNameFromPrompt(prompt?: string): string | undefined {
  if (!prompt) {
    return undefined;
  }
  const cleaned = prompt.trim();
  if (!cleaned) {
    return undefined;
  }
  const firstSentence = cleaned.split(/[.!?]/)[0] || cleaned;
  const words = firstSentence.split(/\s+/).filter(Boolean).slice(0, 4);
  if (words.length === 0) {
    return undefined;
  }
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function truncatePrompt(prompt: string, limit = 160): string {
  const normalized = prompt.trim().replace(/\s+/g, ' ');
  if (normalized.length <= limit) {
    return normalized;
  }
  return `${normalized.slice(0, limit)}...`;
}

function buildTransitionSuggestions(
  statuses: WorkflowStatusSuggestion[],
  requiredFieldCount: number,
): WorkflowTransitionSuggestion[] {
  const transitions: WorkflowTransitionSuggestion[] = [];

  for (let index = 0; index < statuses.length - 1; index += 1) {
    const current = statuses[index];
    const next = statuses[index + 1];
    transitions.push({
      name: `Move to ${next.name}`,
      fromKey: current.key,
      toKey: next.key,
      uiTrigger: 'BUTTON',
      order: index,
      assigneeOnly: index === 0,
      adminOnly: false,
      requirePriority: requiredFieldCount > 0 && next.category === 'DONE',
      preventOpenSubtasks: next.category === 'DONE',
    });
  }

  return transitions;
}

function buildRecommendations(statusCount: number, requiredFieldCount: number, hasQa: boolean) {
  const recommendations: string[] = [];

  if (statusCount <= 3) {
    recommendations.push('Consider adding a dedicated review stage to improve quality.');
  }

  if (requiredFieldCount > 3) {
    recommendations.push('Many required fields detected. Ensure transitions validate critical information.');
  }

  if (!hasQa) {
    recommendations.push('Add a QA Testing status if quality assurance is important for this template.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Workflow looks balanced. Review automation rules for additional optimizations.');
  }

  return recommendations;
}

function ensureStatusIntegrity(statuses: WorkflowStatusSuggestion[]) {
  const seen = new Set<string>();
  const warnings: string[] = [];
  const deduped: WorkflowStatusSuggestion[] = [];

  statuses.forEach((status) => {
    const key = status.key.trim().toLowerCase();
    if (!key) {
      warnings.push('Encountered a status without a key. It has been skipped.');
      return;
    }
    if (seen.has(key)) {
      warnings.push(`Duplicate status key "${status.key}" removed.`);
      return;
    }
    seen.add(key);
    deduped.push({ ...status, key });
  });

  if (deduped.length === 0) {
    deduped.push({
      key: 'todo',
      name: 'To Do',
      category: 'TODO',
      color: '#71717a',
      isInitial: true,
      isFinal: false,
      order: 0,
    });
    deduped.push({
      key: 'done',
      name: 'Done',
      category: 'DONE',
      color: '#10b981',
      isInitial: false,
      isFinal: true,
      order: 1,
    });
    warnings.push('Fallback workflow created because no valid statuses were generated.');
  }

  let initialSet = false;
  let finalSet = false;
  deduped.forEach((status, index) => {
    if (status.isInitial && !initialSet) {
      initialSet = true;
      return;
    }
    if (status.isInitial && initialSet) {
      warnings.push(`Status "${status.name}" marked as initial has been demoted to regular.`);
      status.isInitial = false;
    }
  });

  deduped.forEach((status) => {
    if (status.isFinal) {
      finalSet = true;
    }
  });

  if (!initialSet) {
    deduped[0].isInitial = true;
    warnings.push('No initial status detected. The first status was marked as initial.');
  }

  if (!finalSet) {
    deduped[deduped.length - 1].isFinal = true;
    warnings.push('No final status detected. The last status was marked as final.');
  } else {
    // ensure only last marked final
    for (let i = 0; i < deduped.length - 1; i += 1) {
      if (deduped[i].isFinal) {
        deduped[i].isFinal = false;
        warnings.push(`Only the last status can be final. "${deduped[i].name}" final flag removed.`);
      }
    }
    deduped[deduped.length - 1].isFinal = true;
  }

  const normalized = deduped.map((status, index) => ({
    ...status,
    order: index,
  }));

  return { statuses: normalized, warnings };
}

function sanitizeTransitions(
  statuses: WorkflowStatusSuggestion[],
  transitions: WorkflowTransitionSuggestion[],
) {
  const statusKeys = new Set(statuses.map((status) => status.key));
  const warnings: string[] = [];
  const unique = new Map<string, WorkflowTransitionSuggestion>();

  transitions.forEach((transition) => {
    const pairKey = `${transition.fromKey}->${transition.toKey}`;
    if (!statusKeys.has(transition.fromKey) || !statusKeys.has(transition.toKey)) {
      warnings.push(
        `Transition "${transition.name}" references unavailable statuses and has been removed.`,
      );
      return;
    }
    if (unique.has(pairKey)) {
      warnings.push(`Duplicate transition ${pairKey} removed.`);
      return;
    }
    unique.set(pairKey, transition);
  });

  const sanitized = Array.from(unique.values()).map((transition, index) => ({
    ...transition,
    order: index,
  }));

  if (sanitized.length === 0) {
    warnings.push('No valid transitions were generated.');
  }

  return { transitions: sanitized, warnings };
}

function validateSuggestion(suggestion: WorkflowSuggestionResult): WorkflowSuggestionValidation {
  const issues: string[] = [];
  const statusKeySet = new Set<string>();
  const statusNameSet = new Set<string>();

  suggestion.statuses.forEach((status, index) => {
    const key = (status.key || '').trim();
    const name = (status.name || '').trim();

    if (!key) {
      issues.push(`Status ${index + 1} is missing a key.`);
    } else if (statusKeySet.has(key)) {
      issues.push(`Duplicate status key detected: ${key}`);
    } else {
      statusKeySet.add(key);
    }

    if (!name) {
      issues.push(`Status ${index + 1} is missing a name.`);
    } else if (statusNameSet.has(name.toLowerCase())) {
      issues.push(`Duplicate status name detected: ${name}`);
    } else {
      statusNameSet.add(name.toLowerCase());
    }
  });

  const hasInitial = suggestion.statuses.some((status) => status.isInitial);
  const hasFinal = suggestion.statuses.some((status) => status.isFinal);

  if (!hasInitial) {
    issues.push('Workflow is missing an initial status.');
  }

  if (!hasFinal) {
    issues.push('Workflow is missing a final status.');
  }

  const transitionsByFrom = new Map<string, Set<string>>();

  suggestion.transitions.forEach((transition, index) => {
    const fromKey = (transition.fromKey || '').trim();
    const toKey = (transition.toKey || '').trim();
    const name = (transition.name || '').trim();

    if (!fromKey || !statusKeySet.has(fromKey)) {
      issues.push(
        `Transition ${name || `#${index + 1}`} references unknown source status "${transition.fromKey}".`,
      );
    }

    if (!toKey || !statusKeySet.has(toKey)) {
      issues.push(
        `Transition ${name || `#${index + 1}`} references unknown target status "${transition.toKey}".`,
      );
    }

    if (name) {
      const bucket = transitionsByFrom.get(fromKey) ?? new Set<string>();
      if (bucket.has(name.toLowerCase())) {
        issues.push(
          `Transition name "${name}" is duplicated for source status "${fromKey || 'unknown'}".`,
        );
      }
      bucket.add(name.toLowerCase());
      transitionsByFrom.set(fromKey, bucket);
    }

    if (fromKey && toKey && fromKey === toKey) {
      issues.push(`Transition "${name || `#${index + 1}`}" loops to the same status.`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}