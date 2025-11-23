import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';

// Event stream for Server-Sent Events (SSE)
export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('accessToken')?.value;
  
  if (!accessToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  const user = await AuthService.getUserFromToken(accessToken);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  const channel = searchParams.get('channel') || 'global';

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Set up interval to send keepalive messages
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'keepalive', timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch (error) {
          clearInterval(keepaliveInterval);
          controller.close();
        }
      }, 30000); // Every 30 seconds

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
    },
  });
}
















