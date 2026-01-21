import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { HomeAssistantClient, isEmbeddedMode } from '@/lib/api/homeassistant';
import { SpoolmanClient } from '@/lib/api/spoolman';

export async function GET() {
  try {
    const haConnection = await prisma.hAConnection.findFirst();
    const spoolmanConnection = await prisma.spoolmanConnection.findFirst();

    if (!haConnection) {
      return NextResponse.json({ error: 'Home Assistant not configured' }, { status: 400 });
    }

    const haClient = new HomeAssistantClient(
      haConnection.url,
      haConnection.accessToken,
      haConnection.refreshToken,
      haConnection.expiresAt,
      isEmbeddedMode(),
      haConnection.clientId
    );
    const printers = await haClient.discoverPrinters();

    // If Spoolman is configured, enrich with spool data
    if (spoolmanConnection) {
      const spoolmanClient = new SpoolmanClient(spoolmanConnection.url);
      const spools = await spoolmanClient.getSpools();

      // Create a map of tray ID to spool
      const traySpoolMap = new Map<string, typeof spools[0]>();
      for (const spool of spools) {
        const trayId = spool.extra?.['active_tray'];
        // Skip empty, null, or missing active_tray values
        // Values are JSON-encoded, so empty string is '""', null is 'null'
        if (trayId && trayId !== '' && trayId !== 'null' && trayId !== '""' && trayId !== '\"\"') {
          // Remove JSON quotes from tray ID
          const cleanTrayId = trayId.replace(/^"|"$/g, '');
          if (cleanTrayId) {
            traySpoolMap.set(cleanTrayId, spool);
          }
        }
      }

      // Enrich printer data with spool info
      for (const printer of printers) {
        for (const ams of printer.ams_units) {
          for (const tray of ams.trays) {
            const assignedSpool = traySpoolMap.get(tray.entity_id);
            if (assignedSpool) {
              (tray as unknown as Record<string, unknown>).assigned_spool = assignedSpool;
            }
          }
        }
        if (printer.external_spool) {
          const assignedSpool = traySpoolMap.get(printer.external_spool.entity_id);
          if (assignedSpool) {
            (printer.external_spool as unknown as Record<string, unknown>).assigned_spool = assignedSpool;
          }
        }
      }
    }

    return NextResponse.json({ printers });
  } catch (error) {
    console.error('Error fetching printers:', error);
    return NextResponse.json({ error: 'Failed to fetch printers' }, { status: 500 });
  }
}
