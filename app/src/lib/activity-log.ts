import prisma from '@/lib/db';
import { spoolEvents, ACTIVITY_LOG_CREATED, ActivityLogEvent } from '@/lib/events';

interface CreateLogParams {
  type: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Creates an activity log entry and emits an SSE event for real-time updates
 */
export async function createActivityLog({ type, message, details }: CreateLogParams) {
  const log = await prisma.activityLog.create({
    data: {
      type,
      message,
      details: details ? JSON.stringify(details) : null,
    },
  });

  // Emit event for SSE subscribers
  const event: ActivityLogEvent = {
    id: log.id,
    type: log.type,
    message: log.message,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  };
  spoolEvents.emit(ACTIVITY_LOG_CREATED, event);

  return log;
}
