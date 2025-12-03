import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';
import { resolveParams } from '@/lib/api-helpers';

// POST /api/spaces/[slug]/pages/[pageId]/copy - Copy a page
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; pageId: string }> | { slug: string; pageId: string } }
) {
    try {
        const { slug, pageId } = await resolveParams(params);

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

        // Check if user is member of space
        const membership = await prisma.spaceMember.findFirst({
            where: {
                space: { slug },
                userId: user.id
            }
        });

        const isAdmin = await AuthService.isAdmin(user.id);

        if (!isAdmin && !membership) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Get the original page
        const originalPage = await prisma.document.findUnique({
            where: { id: pageId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    }
                }
            }
        });

        if (!originalPage) {
            return NextResponse.json(
                { success: false, message: 'Page not found' },
                { status: 404 }
            );
        }

        // Get space
        const space = await prisma.space.findUnique({
            where: { slug }
        });

        if (!space || originalPage.spaceId !== space.id) {
            return NextResponse.json(
                { success: false, message: 'Page does not belong to this space' },
                { status: 400 }
            );
        }

        // Calculate new position
        const maxOrderResult = await prisma.document.aggregate({
            where: {
                spaceId: space.id,
                parentId: originalPage.parentId,
                deletedAt: null,
            },
            _max: {
                position: true,
            }
        });
        const newPosition = (maxOrderResult._max.position ?? -1) + 1;

        // Create the copy
        const copiedPage = await prisma.document.create({
            data: {
                spaceId: space.id,
                parentId: originalPage.parentId,
                title: `${originalPage.title} (Copy)`,
                description: originalPage.description,
                summary: originalPage.summary,
                icon: originalPage.icon,
                coverImage: originalPage.coverImage,
                type: originalPage.type,
                pageStatus: 'DRAFT',
                status: 'DRAFT',
                content: originalPage.content,
                tags: originalPage.tags,
                labels: originalPage.labels,
                position: newPosition,
                order: newPosition,
                authorId: user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    }
                },
            }
        });

        // Create initial version
        await prisma.documentVersion.create({
            data: {
                documentId: copiedPage.id,
                version: 1,
                content: originalPage.content || '',
                createdBy: user.id,
                label: 'initial'
            }
        });

        // Create activity
        await prisma.documentActivity.create({
            data: {
                documentId: copiedPage.id,
                userId: user.id,
                type: 'CREATED',
                data: JSON.stringify({
                    title: copiedPage.title,
                    copiedFrom: originalPage.id
                })
            }
        });

        return NextResponse.json({
            success: true,
            page: {
                id: copiedPage.id,
                parentId: copiedPage.parentId,
                title: copiedPage.title,
                icon: copiedPage.icon,
                status: 'DRAFT' as const,
                labels: [],
                hasUnpublishedChanges: false,
                position: copiedPage.position,
                childCount: 0,
                isExpanded: true,
                depth: copiedPage.parentId ? 1 : 0,
                path: [],
                createdAt: copiedPage.createdAt.toISOString(),
                updatedAt: copiedPage.updatedAt.toISOString(),
                authorId: copiedPage.authorId,
                authorName: copiedPage.author.name,
                authorAvatar: copiedPage.author.avatar,
            }
        });
    } catch (error: any) {
        console.error('Error copying page:', error);
        return NextResponse.json(
            { success: false, message: error?.message || 'Failed to copy page' },
            { status: 500 }
        );
    }
}
