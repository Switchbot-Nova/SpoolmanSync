import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { HomeAssistantClient, isEmbeddedMode, HATray } from '@/lib/api/homeassistant';
import { SpoolmanClient, Spool } from '@/lib/api/spoolman';

interface MismatchInfo {
  type: 'material' | 'color' | 'both';
  printerReports: {
    material?: string;
    color?: string;
  };
  spoolmanHas: {
    material: string;
    color: string;
  };
  message: string;
}

/**
 * Detect if the printer's RFID data doesn't match the assigned spool
 * This helps users catch mistakes before printing with the wrong filament
 *
 * Compares material type and hex color code. The RFID color includes an alpha
 * channel (e.g., "#042f56ff") while Spoolman uses 6-char hex (e.g., "#042f56"),
 * so we compare only the first 6 hex characters.
 *
 * Note: Only works for Bambu spools with RFID tags. Non-Bambu spools
 * won't have printer-reported data to compare against.
 */
function detectTrayMismatch(tray: HATray, assignedSpool: Spool): MismatchInfo | null {
  // If the tray has no material reported by printer, can't detect mismatch
  // This happens with non-Bambu spools (no RFID) or empty trays
  const trayName = tray.name?.toLowerCase().trim() || '';
  if (!trayName || trayName === 'empty') {
    return null;
  }

  const printerMaterial = tray.material?.toUpperCase() || '';
  const spoolMaterial = assignedSpool.filament?.material?.toUpperCase() || '';

  // Get hex colors - RFID may have alpha channel (8 chars), Spoolman has 6 chars
  // Compare only first 6 characters (RGB, ignore alpha)
  const rfidColor = tray.color?.replace('#', '').toLowerCase().substring(0, 6) || '';
  const spoolColor = assignedSpool.filament?.color_hex?.toLowerCase().substring(0, 6) || '';

  // Check for material mismatch
  const materialMismatch = printerMaterial && spoolMaterial && printerMaterial !== spoolMaterial;

  // Check for color mismatch (exact match on first 6 hex chars)
  const colorMismatch = rfidColor && spoolColor && rfidColor !== spoolColor;

  if (!materialMismatch && !colorMismatch) {
    return null;
  }

  // Build mismatch info
  const mismatchType: 'material' | 'color' | 'both' =
    materialMismatch && colorMismatch ? 'both' :
    materialMismatch ? 'material' : 'color';

  return {
    type: mismatchType,
    printerReports: {
      material: tray.material,
      color: `#${rfidColor}`,
    },
    spoolmanHas: {
      material: assignedSpool.filament?.material || '',
      color: `#${spoolColor}`,
    },
    message: `Mismatch detected: ${mismatchType}`,
  };
}

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

      // Enrich printer data with spool info and mismatch detection
      for (const printer of printers) {
        for (const ams of printer.ams_units) {
          for (const tray of ams.trays) {
            const assignedSpool = traySpoolMap.get(tray.entity_id);
            const trayRecord = tray as unknown as Record<string, unknown>;

            if (assignedSpool) {
              trayRecord.assigned_spool = assignedSpool;

              // Mismatch detection: compare printer's RFID data with assigned spool
              // Only meaningful for Bambu spools with RFID tags
              const mismatch = detectTrayMismatch(tray, assignedSpool);
              if (mismatch) {
                trayRecord.mismatch = mismatch;
              }
            }
          }
        }
        if (printer.external_spool) {
          const assignedSpool = traySpoolMap.get(printer.external_spool.entity_id);
          if (assignedSpool) {
            const extRecord = printer.external_spool as unknown as Record<string, unknown>;
            extRecord.assigned_spool = assignedSpool;

            // External spool doesn't have RFID reader, so no mismatch detection
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
