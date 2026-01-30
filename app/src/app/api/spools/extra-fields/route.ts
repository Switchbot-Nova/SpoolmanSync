import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SpoolmanClient, BUILT_IN_FILTER_FIELDS, DEFAULT_ENABLED_FILTERS, parseExtraValue } from '@/lib/api/spoolman';

interface FilterField {
  key: string;
  name: string;
  values: string[];
  builtIn: boolean;
}

/**
 * GET /api/spools/extra-fields
 *
 * Returns all filterable spool fields (built-in + extra fields from Spoolman)
 * along with unique values for each field. Also returns the user's
 * filter configuration from settings.
 */
export async function GET() {
  try {
    const spoolmanConnection = await prisma.spoolmanConnection.findFirst();

    if (!spoolmanConnection) {
      return NextResponse.json({ error: 'Spoolman not configured' }, { status: 400 });
    }

    const client = new SpoolmanClient(spoolmanConnection.url);

    // Fetch all spools to extract unique values
    const spools = await client.getSpools();
    const activeSpools = spools.filter(s => !s.archived);

    // Build unique values for built-in fields
    const materials = new Set<string>();
    const vendors = new Set<string>();
    const locations = new Set<string>();
    const lotNumbers = new Set<string>();

    for (const spool of activeSpools) {
      if (spool.filament.material) materials.add(spool.filament.material);
      if (spool.filament.vendor?.name) vendors.add(spool.filament.vendor.name);
      if (spool.location) locations.add(spool.location);
      if (spool.lot_nr) lotNumbers.add(spool.lot_nr);
    }

    // Build filter fields with their values
    const fields: FilterField[] = [];

    // Add built-in fields
    for (const builtIn of BUILT_IN_FILTER_FIELDS) {
      let values: string[] = [];
      switch (builtIn.key) {
        case 'material':
          values = Array.from(materials).sort();
          break;
        case 'vendor':
          values = Array.from(vendors).sort();
          break;
        case 'location':
          values = Array.from(locations).sort();
          break;
        case 'lot_nr':
          values = Array.from(lotNumbers).sort();
          break;
      }
      fields.push({
        key: builtIn.key,
        name: builtIn.name,
        values,
        builtIn: true,
      });
    }

    // Fetch extra field definitions from Spoolman
    const extraFieldDefs = await client.getSpoolExtraFields();

    // Internal fields to exclude from user configuration
    const internalFields = ['active_tray', 'barcode', 'tag'];

    // Build unique values map for extra fields
    const extraFieldValuesMap: Record<string, Set<string>> = {};
    for (const spool of activeSpools) {
      if (spool.extra) {
        for (const [key, value] of Object.entries(spool.extra)) {
          if (internalFields.includes(key)) continue;
          if (!extraFieldValuesMap[key]) extraFieldValuesMap[key] = new Set();
          const parsed = parseExtraValue(value);
          if (parsed) extraFieldValuesMap[key].add(parsed);
        }
      }
    }

    // Add extra fields (excluding internal ones)
    for (const fieldDef of extraFieldDefs) {
      if (internalFields.includes(fieldDef.key)) continue;

      fields.push({
        key: `extra_${fieldDef.key}`,
        name: fieldDef.name,
        values: Array.from(extraFieldValuesMap[fieldDef.key] || []).sort(),
        builtIn: false,
      });
    }

    // Get user's filter configuration from settings
    let filterConfig: string[] | null = null;
    try {
      const setting = await prisma.settings.findUnique({
        where: { key: 'spool_filter_config' },
      });
      if (setting?.value) {
        filterConfig = JSON.parse(setting.value);
      }
    } catch {
      // If parsing fails, use null (will trigger default)
    }

    // If no config exists, use defaults
    const enabledFilters = filterConfig ?? DEFAULT_ENABLED_FILTERS;

    return NextResponse.json({
      fields,
      filterConfig: enabledFilters,
      isDefaultConfig: filterConfig === null,
    });
  } catch (error) {
    console.error('Error fetching filter fields:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch filter fields' },
      { status: 500 }
    );
  }
}
