import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createWorkflow, listWorkflows } from '@/lib/workflows/service';
import { WorkflowInput } from '@/lib/workflows/types';

async function resolveParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  return { spaceId };
}

async function requireAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return null;
  return AuthService.getUserFromToken(token);
}

async function assertSpaceAdmin(spaceId: string, userId: string) {
  const [membership, isSystemAdmin] = await Promise.all([
    prisma.spaceMember.findFirst({ where: { spaceId, userId } }),
    AuthService.isAdmin(userId),
  ]);

  if (isSystemAdmin) {
    return true;
  }

  if (!membership) {
    return false;
  }

  return ['OWNER', 'ADMIN'].includes(membership.role.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const { spaceId } = await resolveParams(request);
    if (!spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const hasAccess = await prisma.spaceMember.findFirst({ where: { spaceId, userId: user.id } });
    const isAdmin = await AuthService.isAdmin(user.id);
    if (!hasAccess && !isAdmin) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const workflows = await listWorkflows(spaceId);
    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    console.error('Failed to list workflows', error);
    return NextResponse.json({ success: false, message: 'Failed to list workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<WorkflowInput>;
    if (!body.spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const isSpaceAdmin = await assertSpaceAdmin(body.spaceId, user.id);
    if (!isSpaceAdmin) {
      return NextResponse.json({ success: false, message: 'Only space admins can create workflows' }, { status: 403 });
    }

    if (!body.name || !body.statuses || body.statuses.length === 0) {
      return NextResponse.json({ success: false, message: 'Workflow name and statuses are required' }, { status: 400 });
    }

    const result = await createWorkflow(body.spaceId, body as WorkflowInput, user.id);
    return NextResponse.json({ success: true, workflow: result }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create workflow', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to create workflow' }, { status: 500 });
  }
}
























