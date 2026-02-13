import { NextRequest, NextResponse } from 'next/server';
import { HomeAssistantClient } from '@/lib/api/homeassistant';

const BAMBU_LAB_DOMAIN = 'bambu_lab';

/**
 * GET /api/printers/setup
 * Get current Bambu Lab config entries (configured printers)
 */
export async function GET() {
  try {
    const client = await HomeAssistantClient.fromConnection();
    if (!client) {
      console.error('[Printers] No HA client available');
      return NextResponse.json({ error: 'Home Assistant not connected' }, { status: 400 });
    }

    console.log('[Printers] Fetching config entries for domain:', BAMBU_LAB_DOMAIN);
    const entries = await client.getConfigEntries(BAMBU_LAB_DOMAIN);
    console.log('[Printers] Found', entries.length, 'entries:', JSON.stringify(entries.map(e => ({ entry_id: e.entry_id, title: e.title, domain: e.domain, state: e.state }))));
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('[Printers] Error getting Bambu Lab entries:', error);
    return NextResponse.json({ error: 'Failed to get printer configurations' }, { status: 500 });
  }
}

/**
 * POST /api/printers/setup
 * Start or continue a Bambu Lab config flow
 *
 * Body for starting flow: { action: 'start' }
 * Body for continuing flow: { action: 'continue', flowId: string, userInput: object }
 * Body for aborting flow: { action: 'abort', flowId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const client = await HomeAssistantClient.fromConnection();
    if (!client) {
      return NextResponse.json({ error: 'Home Assistant not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { action, flowId, userInput } = body;

    switch (action) {
      case 'start': {
        const result = await client.startConfigFlow(BAMBU_LAB_DOMAIN);
        return NextResponse.json(result);
      }

      case 'continue': {
        if (!flowId) {
          return NextResponse.json({ error: 'flowId required' }, { status: 400 });
        }
        const result = await client.continueConfigFlow(flowId, userInput || {});
        return NextResponse.json(result);
      }

      case 'abort': {
        if (!flowId) {
          return NextResponse.json({ error: 'flowId required' }, { status: 400 });
        }
        await client.deleteConfigFlow(flowId);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in printer setup:', error);
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/printers/setup
 * Remove a Bambu Lab config entry (printer)
 *
 * Body: { entryId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = await HomeAssistantClient.fromConnection();
    if (!client) {
      return NextResponse.json({ error: 'Home Assistant not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { entryId } = body;

    if (!entryId) {
      return NextResponse.json({ error: 'entryId required' }, { status: 400 });
    }

    await client.deleteConfigEntry(entryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing printer:', error);
    return NextResponse.json({ error: 'Failed to remove printer' }, { status: 500 });
  }
}
