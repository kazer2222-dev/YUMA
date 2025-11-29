import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const accessToken = request.cookies.get('accessToken')?.value
    if (!accessToken) return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    const user = await AuthService.getUserFromToken(accessToken)
    if (!user) return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 })

    const { sprintId } = await request.json()
    const task = await prisma.task.findUnique({ where: { id: params.taskId }, include: { space: true, status: true } })
    if (!task) return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 })

    const isAdmin = await AuthService.isAdmin(user.id)
    const membership = await prisma.spaceMember.findFirst({ where: { spaceId: task.spaceId, userId: user.id } })
    if (!isAdmin && !membership) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })

    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({ where: { id: sprintId } })
      if (!sprint) return NextResponse.json({ success: false, message: 'Sprint not found' }, { status: 404 })
      // Optional: ensure sprint.boardId matches task.status.boardId
    }

    const updated = await prisma.task.update({ where: { id: params.taskId }, data: { sprintId: sprintId || null } })
    return NextResponse.json({ success: true, task: updated })
  } catch (e) {
    console.error('Assign sprint error:', e)
    return NextResponse.json({ success: false, message: 'Failed to assign sprint' }, { status: 500 })
  }
}














