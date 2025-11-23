import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

type JsonValue = Record<string, any> | null | undefined;

interface TransitionContext {
  task: Awaited<ReturnType<typeof loadTask>>;
  transition: Awaited<ReturnType<typeof loadTransition>>;
  userId: string;
  spaceRole?: string | null;
}

interface PerformTransitionOptions {
  taskId: string;
  transitionId?: string;
  transitionKey?: string;
  userId: string;
}

async function loadTask(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      space: true,
      assignee: true,
      subtasks: {
        select: { id: true, status: { select: { isDone: true } } },
      },
      customFieldValues: {
        include: { customField: true },
      },
      workflow: true,
      workflowStatus: true,
    },
  });
}

async function loadTransition(workflowId: string, workflowVersion: number, transitionId?: string, transitionKey?: string) {
  if (!transitionId && !transitionKey) return null;

  const where: any = { workflowId, version: workflowVersion };
  if (transitionId) {
    where.id = transitionId;
  }
  if (transitionKey) {
    where.key = transitionKey;
  }

  return prisma.workflowTransition.findFirst({
    where,
    include: {
      fromStatus: true,
      toStatus: true,
    },
  });
}

async function resolveSpaceRole(spaceId: string, userId: string) {
  const membership = await prisma.spaceMember.findFirst({ where: { spaceId, userId } });
  if (!membership) return null;
  return membership.role?.toUpperCase() ?? null;
}

function parseJSON<T = any>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse workflow JSON payload', error);
    return undefined;
  }
}

function evaluateRoleConditions(context: TransitionContext, conditions: JsonValue) {
  if (!conditions || !conditions.roles) return true;

  const roles: string[] = conditions.roles.map((role: string) => role.toUpperCase());
  if (roles.includes('ANY')) return true;

  // Space level privileges
  if (context.spaceRole && roles.includes(context.spaceRole)) {
    return true;
  }

  const isSystemAdmin = roles.includes('SYSTEM_ADMIN');
  if (isSystemAdmin) {
    // system admin handled separately in performTransition; assume pass if user is admin
    return true;
  }

  if (roles.includes('ASSIGNEE') && context.task?.assigneeId === context.userId) {
    return true;
  }

  return false;
}

function evaluateFieldRequirements(context: TransitionContext, conditions: JsonValue) {
  if (!conditions) return true;

  const requiredFields: string[] = conditions.requiredFields ?? [];
  const requiredTemplateFields: string[] = conditions.templateFields ?? [];

  if (requiredFields.length > 0) {
    for (const field of requiredFields) {
      const value = (context.task as any)[field];
      if (value === null || value === undefined || value === '') {
        return false;
      }
    }
  }

  if (requiredTemplateFields.length > 0) {
    const customValues = context.task?.customFieldValues ?? [];
    for (const fieldKey of requiredTemplateFields) {
      const hasValue = customValues.some((cfv) => cfv.customField.key === fieldKey && cfv.value !== null && cfv.value !== '');
      if (!hasValue) {
        return false;
      }
    }
  }

  return true;
}

function evaluateValidators(context: TransitionContext, validators: JsonValue) {
  if (!validators) return true;

  if (validators.preventOpenSubtasks) {
    const hasOpen = context.task?.subtasks?.some((subtask) => !subtask.status?.isDone);
    if (hasOpen) return false;
  }

  return true;
}

async function runPostFunctions(context: TransitionContext, postFunctions: JsonValue) {
  if (!postFunctions) return;

  const actions = Array.isArray(postFunctions.actions) ? postFunctions.actions : [];

  for (const action of actions) {
    switch (action.type) {
      case 'SET_FIELD':
        if (action.field && Object.prototype.hasOwnProperty.call(context.task, action.field)) {
          await prisma.task.update({
            where: { id: context.task.id },
            data: { [action.field]: action.value },
          });
        }
        break;
      case 'NOTIFY':
        // Placeholder for notification integration
        console.info('Workflow notification placeholder', {
          taskId: context.task.id,
          transition: context.transition.name,
          recipients: action.recipients,
        });
        break;
      case 'ASSIGN':
        if (action.userId) {
          await prisma.task.update({
            where: { id: context.task.id },
            data: { assigneeId: action.userId },
          });
        }
        break;
      default:
        console.info('Unhandled post-function action', action);
    }
  }
}

export async function performTransition(options: PerformTransitionOptions) {
  const task = await loadTask(options.taskId);
  if (!task) {
    throw new Error('Task not found');
  }

  if (!task.workflowId || !task.workflowStatusId || !task.workflowVersion) {
    throw new Error('Task is not using a workflow');
  }

  const transition = await loadTransition(
    task.workflowId,
    task.workflowVersion,
    options.transitionId,
    options.transitionKey,
  );

  if (!transition) {
    throw new Error('Transition not found');
  }

  if (transition.fromStatusId !== task.workflowStatusId) {
    throw new Error('Transition cannot be applied from current status');
  }

  const spaceRole = await resolveSpaceRole(task.spaceId, options.userId);
  const conditions = parseJSON(transition.conditions);
  const validators = parseJSON(transition.validators);
  const postFunctions = parseJSON(transition.postFunctions);

  const context: TransitionContext = {
    task,
    transition,
    userId: options.userId,
    spaceRole,
  };

  if (!evaluateRoleConditions(context, conditions)) {
    throw new Error('You do not have permission to perform this transition');
  }

  if (!evaluateFieldRequirements(context, conditions)) {
    throw new Error('Required fields are missing');
  }

  const isSystemAdmin = await AuthService.isAdmin(options.userId);
  if (!isSystemAdmin && conditions?.roles?.includes?.('SYSTEM_ADMIN')) {
    throw new Error('Only system administrators can perform this transition');
  }

  if (!evaluateValidators(context, validators)) {
    throw new Error('Transition validation failed');
  }

  const toStatus = transition.toStatus;

  await prisma.task.update({
    where: { id: task.id },
    data: {
      statusId: toStatus.statusRefId ?? task.statusId,
      workflowStatusId: toStatus.id,
      workflowVersion: task.workflowVersion,
    },
  });

  await prisma.activity.create({
    data: {
      taskId: task.id,
      userId: options.userId,
      type: 'STATUS_CHANGED',
      data: JSON.stringify({ from: task.workflowStatusId, to: toStatus.id, transitionId: transition.id }),
    },
  });

  await runPostFunctions(context, postFunctions);

  return {
    success: true,
    newStatusId: toStatus.id,
    workflowStatus: {
      id: toStatus.id,
      name: toStatus.name,
      category: toStatus.category,
      color: toStatus.color,
      isFinal: toStatus.isFinal,
    },
  };
}


