import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const filter = searchParams.get('filter') || 'all';

    // Build where clause based on filter
    let where = {};
    if (filter === 'actions') {
      // Only show logs where SpoolmanSync took an action
      where = {
        type: {
          in: ['spool_usage', 'spool_change', 'spool_unassign', 'spool_assign', 'tag_stored'],
        },
      };
    } else if (filter === 'tray_changes') {
      // Only show tray change events (including detected ones with no action)
      where = {
        type: {
          in: ['spool_change', 'spool_unassign', 'tray_change_detected', 'tray_empty_detected'],
        },
      };
    } else if (filter === 'errors') {
      where = {
        type: 'error',
      };
    }
    // 'all' filter shows everything

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
