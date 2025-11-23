import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function authenticateRequest(request: NextRequest) {
  // Extract token from Authorization header or cookies
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.cookies.get('accessToken')?.value;

  if (!token) {
    return null;
  }

  return await AuthService.getUserFromToken(token);
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    ...data,
    ...(message && { message })
  });
}
















