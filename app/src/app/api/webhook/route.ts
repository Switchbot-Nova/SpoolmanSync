import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SpoolmanClient } from '@/lib/api/spoolman';

/**
 * Webhook endpoint for Home Assistant automations
 *
 * This endpoint receives tray change events from HA and syncs with Spoolman.
 *
 * Expected payload:
 * {
 *   event: "tray_change",
 *   tray_entity_id: "sensor.x1c_..._tray_1_2",
 *   tag_uid: "...",
 *   color: "#FFFFFF",
 *   material: "PLA",
 *   remaining_weight: 800
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, tray_entity_id, tag_uid, color, material, remaining_weight } = body;

    console.log('Webhook received:', body);

    // Log the webhook event
    await prisma.activityLog.create({
      data: {
        type: 'webhook',
        message: `Received ${event} event for ${tray_entity_id}`,
        details: JSON.stringify(body),
      },
    });

    if (event !== 'tray_change') {
      return NextResponse.json({ status: 'ignored', reason: 'unknown event type' });
    }

    const spoolmanConnection = await prisma.spoolmanConnection.findFirst();

    if (!spoolmanConnection) {
      console.warn('Webhook received but Spoolman not configured');
      return NextResponse.json({ status: 'ignored', reason: 'spoolman not configured' });
    }

    const client = new SpoolmanClient(spoolmanConnection.url);
    const spools = await client.getSpools();

    // Auto-match by tag_uid only (if user has set tag_uid in Spoolman's extra field)
    // We intentionally don't match by color/material as it's unreliable when users
    // have multiple spools of the same type. Users should manually assign spools.
    if (tag_uid && tag_uid !== 'unknown' && tag_uid !== '') {
      const jsonTagUid = JSON.stringify(tag_uid);
      const matchedSpool = spools.find(s => s.extra?.['tag_uid'] === jsonTagUid);

      if (matchedSpool) {
        await client.assignSpoolToTray(matchedSpool.id, tray_entity_id);

        await prisma.activityLog.create({
          data: {
            type: 'spool_change',
            message: `Auto-assigned spool #${matchedSpool.id} to ${tray_entity_id} (matched by tag UID)`,
            details: JSON.stringify({ spoolId: matchedSpool.id, trayId: tray_entity_id, matchedBy: 'tag_uid' }),
          },
        });

        return NextResponse.json({
          status: 'success',
          spool: matchedSpool,
          matchedBy: 'tag_uid',
        });
      }
    }

    // No auto-match - user needs to manually assign spool
    return NextResponse.json({
      status: 'no_match',
      message: 'No spool assigned to this tray. Please assign a spool manually in SpoolmanSync.',
    });
  } catch (error) {
    console.error('Webhook error:', error);

    await prisma.activityLog.create({
      data: {
        type: 'error',
        message: 'Webhook processing failed',
        details: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// GET endpoint for testing/verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'SpoolmanSync webhook endpoint',
    expectedPayload: {
      event: 'tray_change',
      tray_entity_id: 'sensor.x1c_..._tray_1_2',
      tag_uid: '...',
      color: '#FFFFFF',
      material: 'PLA',
      remaining_weight: 800,
    },
  });
}
