import { spoolEvents, SPOOL_UPDATED, ACTIVITY_LOG_CREATED, SpoolUpdateEvent, ActivityLogEvent } from '@/lib/events';

/**
 * Server-Sent Events endpoint for real-time dashboard updates
 *
 * Clients connect to this endpoint and receive updates when:
 * - Spool usage is deducted (from webhook)
 * - Spools are assigned/unassigned to trays
 * - Activity logs are created
 */

// Ensure this route is never statically optimized
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send a large padding comment to flush through proxy buffers.
      // HA's ingress proxy and nginx may hold small chunks in internal
      // buffers (~4KB). SSE comments (lines starting with :) are ignored
      // by EventSource but push data through the proxy chain.
      const padding = `: ${' '.repeat(4096)}\n\n`;
      controller.enqueue(encoder.encode(padding));

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Subscribe to spool update events
      const unsubscribeSpool = spoolEvents.on(SPOOL_UPDATED, (data: unknown) => {
        try {
          const event = data as SpoolUpdateEvent;
          const message = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Client disconnected, will be cleaned up
        }
      });

      // Subscribe to activity log events
      const unsubscribeLog = spoolEvents.on(ACTIVITY_LOG_CREATED, (data: unknown) => {
        try {
          const event = data as ActivityLogEvent;
          const message = `data: ${JSON.stringify({ ...event, eventType: 'activity_log' })}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Client disconnected, will be cleaned up
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch {
          // Client disconnected
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Clean up on close
      // Note: The controller doesn't have a direct close event, but the stream
      // will be garbage collected when the client disconnects
      const cleanup = () => {
        unsubscribeSpool();
        unsubscribeLog();
        clearInterval(heartbeatInterval);
      };

      // Store cleanup function for potential manual cleanup
      (controller as unknown as { cleanup?: () => void }).cleanup = cleanup;
    },
    cancel() {
      // Stream was cancelled (client disconnected)
      console.log('SSE client disconnected');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      // Prevent HA's ingress proxy from adding Content-Encoding: deflate
      // which causes browsers to buffer the entire response instead of streaming
      'Content-Encoding': 'identity',
    },
  });
}
