import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { performTransition } from '@/lib/workflows/transition-engine';

async function requireAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return null;
  return AuthService.getUserFromToken(token);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> | { taskId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const body = await request.json();
    const { transitionId, transitionKey } = body ?? {};

    if (!transitionId && !transitionKey) {
      return NextResponse.json({ success: false, message: 'transitionId or transitionKey is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: resolvedParams.taskId },
      select: { spaceId: true },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    const [membership, isSystemAdmin] = await Promise.all([
      prisma.spaceMember.findFirst({ where: { spaceId: task.spaceId, userId: user.id } }),
      AuthService.isAdmin(user.id),
    ]);

    if (!membership && !isSystemAdmin) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    const result = await performTransition({
      taskId: resolvedParams.taskId,
      transitionId,
      transitionKey,
      userId: user.id,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Failed to perform workflow transition', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to transition task' }, { status: 400 });
  }
}
























