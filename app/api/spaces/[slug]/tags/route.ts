import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;

    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await AuthService.getUserFromToken(accessToken);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const isAdmin = await AuthService.isAdmin(user.id);
    const membership = await prisma.spaceMember.findFirst({
      where: {
        space: { slug },
        userId: user.id
      }
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { space: { slug } },
      select: { tags: true }
    });

    const tagSet = new Set<string>();

    for (const task of tasks) {
      if (!task.tags) continue;
      try {
        const parsed = JSON.parse(task.tags) as unknown;
        if (Array.isArray(parsed)) {
          parsed.forEach((tag) => {
            if (typeof tag === 'string' && tag.trim()) {
              tagSet.add(tag.trim());
            }
          });
        }
      } catch (error) {
        console.warn('[Tags] Failed to parse task tags', { error, tags: task.tags });
      }
    }

    const tags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
























