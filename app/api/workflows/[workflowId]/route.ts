import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteWorkflow, getWorkflowDetail, updateWorkflow } from '@/lib/workflows/service';
import { WorkflowUpdateInput } from '@/lib/workflows/types';

async function requireAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return null;
  return AuthService.getUserFromToken(token);
}

async function resolveParams(
  request: NextRequest,
  params: Promise<{ workflowId: string }> | { workflowId: string },
) {
  const resolvedParams = await Promise.resolve(params);
  const { searchParams } = new URL(request.url);
  return {
    workflowId: resolvedParams.workflowId,
    spaceId: searchParams.get('spaceId'),
    version: searchParams.get('version'),
  };
}

async function assertSpaceAdmin(spaceId: string, userId: string) {
  const [membership, isSystemAdmin] = await Promise.all([
    prisma.spaceMember.findFirst({ where: { spaceId, userId } }),
    AuthService.isAdmin(userId),
  ]);

  if (isSystemAdmin) return true;
  if (!membership) return false;
  return ['OWNER', 'ADMIN'].includes(membership.role.toUpperCase());
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> | { workflowId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { workflowId, spaceId, version } = await resolveParams(request, context.params);
    if (!spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const membership = await prisma.spaceMember.findFirst({ where: { spaceId, userId: user.id } });
    const isAdmin = await AuthService.isAdmin(user.id);
    if (!membership && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const detail = await getWorkflowDetail(spaceId, workflowId, version ? Number(version) : undefined);
    if (!detail) {
      return NextResponse.json({ success: false, message: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, workflow: detail });
  } catch (error) {
    console.error('Failed to fetch workflow detail', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> | { workflowId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { workflowId, spaceId } = await resolveParams(request, context.params);
    if (!spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const hasAccess = await assertSpaceAdmin(spaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'Only space admins can update workflows' }, { status: 403 });
    }

    const body = (await request.json()) as WorkflowUpdateInput;
    const detail = await updateWorkflow(spaceId, workflowId, body, user.id);
    return NextResponse.json({ success: true, workflow: detail });
  } catch (error: any) {
    console.error('Failed to update workflow', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> | { workflowId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { workflowId, spaceId } = await resolveParams(request, context.params);
    if (!spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const hasAccess = await assertSpaceAdmin(spaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'Only space admins can delete workflows' }, { status: 403 });
    }

    await deleteWorkflow(spaceId, workflowId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete workflow', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to delete workflow' }, { status: 500 });
  }
}
























