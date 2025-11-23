import { NextRequest, NextResponse } from 'next/server';

const MIN_CONFIDENCE = 0.6;

interface TransitionPredictionRequest {
  taskId?: string;
  summary?: string;
  currentStatusKey?: string;
  workflowId?: string;
  transitions: Array<{
    id: string;
    name: string;
    fromKey: string;
    toKey: string;
    uiTrigger?: string;
    conditions?: Record<string, any> | null;
    validators?: Record<string, any> | null;
    postFunctions?: Record<string, any> | null;
    disabled?: boolean;
    isDisabled?: boolean;
  }>;
  recentHistory?: Array<{
    fromKey: string;
    toKey: string;
  }>;
  tags?: string[];
  priority?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TransitionPredictionRequest = await request.json();
    const suggestion = suggestTransition(body);

    return NextResponse.json({ success: true, suggestion });
  } catch (error) {
    console.error('AI transition prediction error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to predict transition' },
      { status: 500 },
    );
  }
}

function suggestTransition(input: TransitionPredictionRequest) {
  if (!Array.isArray(input.transitions) || input.transitions.length === 0) {
    return null;
  }

  const eligibleTransitions = input.transitions.filter((transition) => {
    if (!transition) return false;
    if (transition.disabled === true || transition.isDisabled === true) {
      return false;
    }
    if (!transition.fromKey || !transition.toKey) {
      return false;
    }
    if (transition.toKey === input.currentStatusKey) {
      return false;
    }
    const trigger = (transition.uiTrigger || '').toUpperCase();
    if (trigger === 'HIDDEN' || trigger === 'DISABLED') {
      return false;
    }
    const roles = Array.isArray(transition.conditions?.roles) ? transition.conditions?.roles : [];
    if (roles.length > 0) {
      return false;
    }
    return true;
  });

  if (eligibleTransitions.length === 0) {
    return null;
  }

  const priorityWeight = getPriorityWeight(input.priority);
  const tagWeight = getTagWeight(input.tags);

  const scored = eligibleTransitions.map((transition) => {
    let score = 1;
    if (transition.toKey.toLowerCase().includes('review')) score += 1.5;
    if (transition.toKey.toLowerCase().includes('qa')) score += tagWeight.qa;
    if (transition.toKey.toLowerCase().includes('done')) score += priorityWeight.done;
    if (transition.toKey.toLowerCase().includes('progress')) score += 0.5;

    if (input.recentHistory && input.recentHistory.length > 0) {
      const lastHop = input.recentHistory[input.recentHistory.length - 1];
      if (lastHop && lastHop.fromKey === transition.fromKey && lastHop.toKey === transition.toKey) {
        score += 1;
      }
    }

    return { transition, score };
  });

  if (scored.length === 0) {
    return null;
  }

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  const maxScore = best.score;
  const minScore = scored[scored.length - 1].score;
  const diversity = maxScore - minScore;
  const confidence = normalizeConfidence(maxScore, diversity, scored.length);

  if (confidence < MIN_CONFIDENCE) {
    return null;
  }

  return {
    transitionId: best.transition.id,
    transitionKey: best.transition.fromKey + '::' + best.transition.toKey,
    confidence,
    rationale: buildRationale(best.transition, input),
  };
}

function normalizeConfidence(bestScore: number, spread: number, total: number) {
  if (!Number.isFinite(bestScore) || bestScore <= 0) {
    return 0;
  }

  const relativeSpread = spread <= 0 ? 0.1 : Math.min(spread / Math.max(bestScore, 1), 1);
  const crowdFactor = total > 1 ? Math.min(1, 2 / total) : 1;
  const base = 0.45 + Math.min(bestScore / (bestScore + 5), 0.4);
  const bonus = 0.1 * relativeSpread * crowdFactor;
  return Math.min(0.95, +(base + bonus).toFixed(3));
}

function getPriorityWeight(priority?: string) {
  switch ((priority || '').toUpperCase()) {
    case 'HIGHEST':
    case 'HIGH':
      return { done: 1.2 };
    case 'LOW':
    case 'LOWEST':
      return { done: 0.4 };
    default:
      return { done: 0.8 };
  }
}

function getTagWeight(tags?: string[]) {
  const weights = { qa: 1, design: 0.8 } as Record<string, number>;
  if (!tags) return weights;
  const lowered = tags.map((tag) => tag.toLowerCase());
  if (lowered.some((tag) => tag.includes('qa') || tag.includes('test'))) {
    weights.qa = 2;
  }
  if (lowered.some((tag) => tag.includes('design'))) {
    weights.design = 1.5;
  }
  return weights;
}

function buildRationale(transition: TransitionPredictionRequest['transitions'][number], input: TransitionPredictionRequest) {
  const reasons: string[] = [];
  if (transition.toKey.toLowerCase().includes('review')) reasons.push('tasks usually move to Review after progress');
  if (transition.toKey.toLowerCase().includes('qa') && (input.tags || []).some((tag) => tag.toLowerCase().includes('qa'))) {
    reasons.push('QA tag detected on task');
  }
  if ((input.priority || '').toUpperCase() === 'HIGH' && transition.toKey.toLowerCase().includes('done')) {
    reasons.push('high priority items should complete swiftly');
  }
  if (reasons.length === 0) {
    reasons.push('pattern learned from similar tasks');
  }
  return reasons;
}





