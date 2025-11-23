import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { assignWorkflowToTemplate } from '@/lib/workflows/service';

async function requireAuthenticatedUser(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  if (!token) return null;
  return AuthService.getUserFromToken(token);
}

async function assertTemplateAccess(templateId: string, userId: string) {
  const template = await prisma.template.findUnique({
    where: { id: templateId },
    select: { id: true, spaceId: true, createdBy: true },
  });

  if (!template) {
    return { allowed: false, status: 404 as const, message: 'Template not found' };
  }

  const [membership, isSystemAdmin] = await Promise.all([
    prisma.spaceMember.findFirst({ where: { spaceId: template.spaceId, userId } }),
    AuthService.isAdmin(userId),
  ]);

  if (isSystemAdmin) {
    return { allowed: true, spaceId: template.spaceId };
  }

  if (membership && ['OWNER', 'ADMIN'].includes(membership.role.toUpperCase())) {
    return { allowed: true, spaceId: template.spaceId };
  }

  if (template.createdBy === userId) {
    return { allowed: true, spaceId: template.spaceId };
  }

  return { allowed: false, status: 403 as const, message: 'Insufficient permissions' };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ templateId: string }> | { templateId: string } },
) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(context.params);
    const { workflowId } = (await request.json()) as { workflowId?: string | null };

    const access = await assertTemplateAccess(resolvedParams.templateId, user.id);
    if (!access.allowed) {
      return NextResponse.json({ success: false, message: access.message }, { status: access.status });
    }

    await assignWorkflowToTemplate(access.spaceId!, resolvedParams.templateId, workflowId ?? null);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to assign workflow to template', error);
    return NextResponse.json({ success: false, message: error?.message || 'Failed to assign workflow' }, { status: 500 });
  }
}
























