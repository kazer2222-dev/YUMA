import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { duplicateWorkflow } from '@/lib/workflows/service';

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

  if (isSystemAdmin) return true;
  if (!membership) return false;
  return ['OWNER', 'ADMIN'].includes(membership.role.toUpperCase());
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ workflowId: string }> | { workflowId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    if (!spaceId) {
      return NextResponse.json({ success: false, message: 'spaceId is required' }, { status: 400 });
    }

    const hasAccess = await assertSpaceAdmin(spaceId, user.id);
    if (!hasAccess) {
      return NextResponse.json({ success: false, message: 'Only space admins can duplicate workflows' }, { status: 403 });
    }

    const workflow = await duplicateWorkflow(spaceId, resolvedParams.workflowId, user.id);
    return NextResponse.json({ success: true, workflow }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to duplicate workflow', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to duplicate workflow' }, { status: 500 });
  }
}
























