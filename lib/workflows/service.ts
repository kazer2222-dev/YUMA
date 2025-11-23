import { Prisma, Workflow } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { WorkflowDetail, WorkflowInput, WorkflowSummary, WorkflowTransitionInput, WorkflowUpdateInput } from './types';
import { randomUUID } from 'crypto';

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function serializeJSON(value?: Record<string, any> | null): string | null {
  if (!value) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function ensureStatuses(input: WorkflowInput | WorkflowUpdateInput) {
  if (!input.statuses || input.statuses.length === 0) {
    throw new Error('Workflow must include at least one status');
  }

  const hasInitial = input.statuses.some((status) => status.isInitial);
  if (!hasInitial) {
    input.statuses[0]!.isInitial = true;
  }
}

async function createStatuses(tx: Prisma.TransactionClient, workflow: Workflow, version: number, statusesInput: WorkflowInput['statuses']) {
  const keyToStatusId = new Map<string, string>();

  let orderCounter = 0;

  for (const status of statusesInput) {
    const key = normalizeKey(status.key || status.name);
    const created = await tx.workflowStatus.create({
      data: {
        workflowId: workflow.id,
        version,
        name: status.name,
        category: status.category,
        color: status.color ?? null,
        isInitial: Boolean(status.isInitial),
        isFinal: Boolean(status.isFinal),
        order: status.order ?? orderCounter,
        visibilityRules: serializeJSON(status.visibilityRules),
        fieldLockRules: serializeJSON(status.fieldLockRules),
        statusRefId: status.statusRefId ?? null,
        key,
      },
    } as any);

    keyToStatusId.set(key, created.id);
    orderCounter += 1;
  }

  return keyToStatusId;
}

async function createTransitions(
  tx: Prisma.TransactionClient,
  workflow: Workflow,
  version: number,
  transitionsInput: WorkflowTransitionInput[],
  keyToStatusId: Map<string, string>,
)
{
  for (const transition of transitionsInput) {
    const fromKey = normalizeKey(transition.fromKey);
    const toKey = normalizeKey(transition.toKey);

    const fromStatusId = keyToStatusId.get(fromKey);
    const toStatusId = keyToStatusId.get(toKey);

    if (!fromStatusId || !toStatusId) {
      throw new Error(`Transition references unknown status: ${transition.name}`);
    }

    await tx.workflowTransition.create({
      data: {
        workflowId: workflow.id,
        version,
        name: transition.name,
        fromStatusId,
        toStatusId,
        conditions: serializeJSON(transition.conditions),
        validators: serializeJSON(transition.validators),
        postFunctions: serializeJSON(transition.postFunctions),
        uiTrigger: transition.uiTrigger ?? null,
        order: transition.order ?? 0,
        key: transition.key ? normalizeKey(transition.key) : randomUUID(),
      },
    } as any);
  }
}

export async function listWorkflows(spaceId: string): Promise<WorkflowSummary[]> {
  const workflows = await prisma.workflow.findMany({
    where: { spaceId },
    include: {
      templates: {
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return workflows.map((workflow) => ({
    id: workflow.id,
    spaceId: workflow.spaceId,
    name: workflow.name,
    description: workflow.description ?? undefined,
    isDefault: workflow.isDefault,
    aiOptimized: workflow.aiOptimized,
    version: workflow.version,
    linkedTemplates: workflow.templates.map((template) => template.id),
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }));
}

export async function getWorkflowDetail(spaceId: string, workflowId: string, version?: number): Promise<WorkflowDetail | null> {
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, spaceId },
    include: {
      templates: { select: { id: true } },
    },
  });

  if (!workflow) return null;

  const targetVersion = version ?? workflow.version;

  const statuses = await prisma.workflowStatus.findMany({
    where: { workflowId, version: targetVersion },
    orderBy: { order: 'asc' },
  });

  const transitions = await prisma.workflowTransition.findMany({
    where: { workflowId, version: targetVersion },
    orderBy: { order: 'asc' },
  });

  const statusKeyMap = new Map<string, string>();
  statuses.forEach((status) => {
    if ((status as any).key) {
      statusKeyMap.set(status.id, (status as any).key as string);
    }
  });

  return {
    id: workflow.id,
    spaceId: workflow.spaceId,
    name: workflow.name,
    description: workflow.description ?? undefined,
    isDefault: workflow.isDefault,
    aiOptimized: workflow.aiOptimized,
    version: targetVersion,
    linkedTemplates: workflow.templates.map((template) => template.id),
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
    statuses: statuses.map((status) => ({
      id: status.id,
      key: (status as any).key ?? '',
      name: status.name,
      category: status.category as any,
      color: status.color ?? undefined,
      isInitial: status.isInitial,
      isFinal: status.isFinal,
      order: status.order,
      visibilityRules: status.visibilityRules ? JSON.parse(status.visibilityRules) : undefined,
      fieldLockRules: status.fieldLockRules ? JSON.parse(status.fieldLockRules) : undefined,
      statusRefId: status.statusRefId ?? undefined,
    })),
    transitions: transitions.map((transition) => ({
      id: transition.id,
      key: (transition as any).key ?? undefined,
      name: transition.name,
      fromId: transition.fromStatusId,
      toId: transition.toStatusId,
      fromKey: statusKeyMap.get(transition.fromStatusId) ?? '',
      toKey: statusKeyMap.get(transition.toStatusId) ?? '',
      conditions: transition.conditions ? JSON.parse(transition.conditions) : undefined,
      validators: transition.validators ? JSON.parse(transition.validators) : undefined,
      postFunctions: transition.postFunctions ? JSON.parse(transition.postFunctions) : undefined,
      uiTrigger: transition.uiTrigger ?? undefined,
      order: transition.order,
    })),
  };
}

export async function createWorkflow(spaceId: string, input: WorkflowInput, userId?: string): Promise<WorkflowDetail> {
  ensureStatuses(input);

  const workflowId = await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.workflow.updateMany({
        where: { spaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const workflow = await tx.workflow.create({
      data: {
        spaceId,
        name: input.name,
        description: input.description ?? null,
        isDefault: Boolean(input.isDefault),
        aiOptimized: Boolean(input.aiOptimized),
        version: 1,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    const keyToStatusId = await createStatuses(tx, workflow, 1, input.statuses);
    await createTransitions(tx, workflow, 1, input.transitions ?? [], keyToStatusId);

    if (input.linkedTemplateIds?.length) {
      await tx.template.updateMany({
        where: { id: { in: input.linkedTemplateIds } },
        data: { workflowId: workflow.id },
      });
    }

    await tx.workflowAudit.create({
      data: {
        workflowId: workflow.id,
        version: 1,
        action: 'CREATED',
        actorId: userId,
      },
    });

    return workflow.id;
  });

  return getWorkflowDetail(spaceId, workflowId)!;
}

export async function updateWorkflow(spaceId: string, workflowId: string, input: WorkflowUpdateInput, userId?: string): Promise<WorkflowDetail> {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, spaceId } });
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const existingDetail = await getWorkflowDetail(spaceId, workflowId);
  if (!existingDetail) {
    throw new Error('Workflow detail not found');
  }

  const nextVersion = workflow.version + 1;

  await prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.workflow.updateMany({
        where: { spaceId, isDefault: true, NOT: { id: workflowId } },
        data: { isDefault: false },
      });
    }

    const updatedWorkflow = await tx.workflow.update({
      where: { id: workflowId },
      data: {
        name: input.name ?? workflow.name,
        description: input.description ?? workflow.description,
        isDefault: input.isDefault ?? workflow.isDefault,
        aiOptimized: input.aiOptimized ?? workflow.aiOptimized,
        version: input.statuses || input.transitions ? nextVersion : workflow.version,
        updatedBy: userId,
      },
    });

    if (input.statuses || input.transitions) {
      const statusesInput = (input.statuses && input.statuses.length > 0)
        ? input.statuses
        : existingDetail.statuses.map((status) => ({
            key: status.key || normalizeKey(status.name),
            name: status.name,
            category: status.category,
            color: status.color,
            isInitial: status.isInitial,
            isFinal: status.isFinal,
            order: status.order,
            visibilityRules: status.visibilityRules ?? undefined,
            fieldLockRules: status.fieldLockRules ?? undefined,
            statusRefId: status.statusRefId ?? undefined,
          }));

      ensureStatuses({ ...input, statuses: statusesInput } as WorkflowInput);

      await tx.workflowStatus.deleteMany({ where: { workflowId, version: nextVersion } });
      await tx.workflowTransition.deleteMany({ where: { workflowId, version: nextVersion } });

      const transitionsInput = (input.transitions && input.transitions.length > 0)
        ? input.transitions
        : existingDetail.transitions.map((transition) => ({
            name: transition.name,
            fromKey: transition.fromKey,
            toKey: transition.toKey,
            conditions: transition.conditions ?? undefined,
            validators: transition.validators ?? undefined,
            postFunctions: transition.postFunctions ?? undefined,
            uiTrigger: transition.uiTrigger ?? undefined,
            order: transition.order,
          }));

      const keyToStatusId = await createStatuses(tx, updatedWorkflow, nextVersion, statusesInput);
      await createTransitions(tx, updatedWorkflow, nextVersion, transitionsInput, keyToStatusId);

      await tx.workflowAudit.create({
        data: {
          workflowId,
          version: nextVersion,
          action: 'UPDATED',
          actorId: userId,
          metadata: JSON.stringify({ fields: Object.keys(input).filter((key) => key !== 'linkedTemplateIds') }),
        },
      });
    }

    if (input.linkedTemplateIds) {
      await tx.template.updateMany({
        where: { workflowId, NOT: { id: { in: input.linkedTemplateIds } } },
        data: { workflowId: null },
      });
      if (input.linkedTemplateIds.length) {
        await tx.template.updateMany({
          where: { id: { in: input.linkedTemplateIds } },
          data: { workflowId },
        });
      }
    }
  });

  return getWorkflowDetail(spaceId, workflowId)!;
}

export async function deleteWorkflow(spaceId: string, workflowId: string): Promise<void> {
  const dependencyCounts = await prisma.template.count({ where: { workflowId } });
  const taskCount = await prisma.task.count({ where: { workflowId } });

  if (dependencyCounts > 0 || taskCount > 0) {
    throw new Error('Workflow has linked templates or tasks and cannot be deleted');
  }

  await prisma.workflow.delete({
    where: { id: workflowId, spaceId },
  });
}

export async function duplicateWorkflow(spaceId: string, workflowId: string, userId?: string): Promise<WorkflowDetail> {
  const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, spaceId } });
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const detail = await getWorkflowDetail(spaceId, workflowId);
  if (!detail) {
    throw new Error('Workflow not found');
  }

  const input: WorkflowInput = {
    spaceId,
    name: `${workflow.name} Copy`,
    description: workflow.description,
    isDefault: false,
    aiOptimized: workflow.aiOptimized,
    statuses: detail.statuses.map((status) => ({
      key: status.key || normalizeKey(status.name),
      name: status.name,
      category: status.category,
      color: status.color,
      isInitial: status.isInitial,
      isFinal: status.isFinal,
      order: status.order,
      visibilityRules: status.visibilityRules ?? undefined,
      fieldLockRules: status.fieldLockRules ?? undefined,
      statusRefId: status.statusRefId ?? undefined,
    })),
    transitions: detail.transitions.map((transition) => ({
      name: transition.name,
      fromKey: transition.fromKey,
      toKey: transition.toKey,
      conditions: transition.conditions ?? undefined,
      validators: transition.validators ?? undefined,
      postFunctions: transition.postFunctions ?? undefined,
      uiTrigger: transition.uiTrigger ?? undefined,
      order: transition.order,
    })),
  };

  return createWorkflow(spaceId, input, userId);
}

export async function assignWorkflowToTemplate(spaceId: string, templateId: string, workflowId: string | null) {
  await prisma.template.update({
    where: { id: templateId, spaceId },
    data: { workflowId },
  });
}


