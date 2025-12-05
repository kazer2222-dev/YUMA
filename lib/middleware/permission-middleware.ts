import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { PermissionService } from '@/lib/services/permission-service';
import { type PermissionKey } from '@/lib/constants/permissions';

/**
 * Helper to get user from request
 */
async function getUserFromRequest(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    if (!accessToken) {
        return null;
    }
    return await AuthService.getUserFromToken(accessToken);
}

/**
 * Middleware to check if user has required permission in a space
 */
export async function requirePermission(
    request: NextRequest,
    spaceId: string,
    permission: PermissionKey
): Promise<{ user: any; authorized: boolean; response?: NextResponse }> {
    // Check authentication
    const user = await getUserFromRequest(request);

    if (!user) {
        return {
            user: null,
            authorized: false,
            response: NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            ),
        };
    }

    // Check permission
    const hasPermission = await PermissionService.hasPermission(
        user.id,
        spaceId,
        permission
    );

    if (!hasPermission) {
        return {
            user,
            authorized: false,
            response: NextResponse.json(
                {
                    success: false,
                    message: 'Insufficient permissions',
                    required: permission,
                },
                { status: 403 }
            ),
        };
    }

    return {
        user,
        authorized: true,
    };
}

/**
 * Middleware to check if user has ANY of the required permissions
 */
export async function requireAnyPermission(
    request: NextRequest,
    spaceId: string,
    permissions: PermissionKey[]
): Promise<{ user: any; authorized: boolean; response?: NextResponse }> {
    const user = await getUserFromRequest(request);

    if (!user) {
        return {
            user: null,
            authorized: false,
            response: NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            ),
        };
    }

    const hasAnyPermission = await PermissionService.hasAnyPermission(
        user.id,
        spaceId,
        permissions
    );

    if (!hasAnyPermission) {
        return {
            user,
            authorized: false,
            response: NextResponse.json(
                {
                    success: false,
                    message: 'Insufficient permissions',
                    requiredAny: permissions,
                },
                { status: 403 }
            ),
        };
    }

    return {
        user,
        authorized: true,
    };
}

/**
 * Middleware to check if user is a space admin
 */
export async function requireSpaceAdmin(
    request: NextRequest,
    spaceId: string
): Promise<{ user: any; authorized: boolean; response?: NextResponse }> {
    const user = await getUserFromRequest(request);

    if (!user) {
        return {
            user: null,
            authorized: false,
            response: NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            ),
        };
    }

    const isAdmin = await PermissionService.isSpaceAdmin(user.id, spaceId);

    if (!isAdmin) {
        return {
            user,
            authorized: false,
            response: NextResponse.json(
                { success: false, message: 'Space admin access required' },
                { status: 403 }
            ),
        };
    }

    return {
        user,
        authorized: true,
    };
}
