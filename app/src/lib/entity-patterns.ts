/**
 * Centralized entity name patterns for ha-bambulab integration
 *
 * ha-bambulab localizes entity IDs based on Home Assistant's language setting.
 * Add new language patterns here - they will automatically be used throughout the app.
 */

// Localized suffixes for the print_status sensor (used to identify printers)
export const PRINT_STATUS_SUFFIXES = [
  'print_status',           // English
  'druckstatus',            // German
  'printstatus',            // Dutch
  'estado_de_la_impresion', // Spanish
  'stato_di_stampa',        // Italian
  // Add more languages here:
];

// Localized names for AMS humidity sensor
export const AMS_HUMIDITY_NAMES = [
  'humidity',          // English
  'luftfeuchtigkeit',  // German
  'vochtigheid',       // Dutch
  'humedad',           // Spanish
  'umidita',           // Italian
  // Add more languages here:
];

// Localized names for AMS tray sensor
export const TRAY_NAMES = [
  'tray',              // English (also used in Dutch)
  'slot',              // German, Italian
  'bandeja',           // Spanish
  // Add more languages here:
];

// Localized names for external spool sensor
export const EXTERNAL_SPOOL_NAMES = [
  'external_spool',                   // English
  'externalspool_external_spool',     // English newer ha-bambulab format
  'externe_spule',                    // German
  'externespule_externe_spule',       // German newer format
  'externe_spoel',                    // Dutch
  'externespoel_externe_spoel',       // Dutch newer format
  'bobina_externa',                   // Spanish
  'bobinaexterna_bobina_externa',     // Spanish newer format
  'bobina_esterna',                   // Italian
  'bobinaesterna_bobina_esterna',     // Italian newer format
  // Add more languages here:
];

// Localized friendly name suffixes to strip from printer names
export const FRIENDLY_NAME_SUFFIXES = [
  'Print Status',           // English
  'Druckstatus',            // German
  'Printstatus',            // Dutch
  'Estado de la Impresión', // Spanish
  'Stato di stampa',        // Italian
  // Add more languages here:
];

/**
 * Build a regex pattern that matches any of the print status suffixes
 * Includes optional version suffix (_2, _3, etc.)
 */
export function buildPrintStatusPattern(): RegExp {
  const suffixes = PRINT_STATUS_SUFFIXES.join('|');
  return new RegExp(`^sensor\\.(.+?)_(?:${suffixes})(?:_\\d+)?$`);
}

/**
 * Build a regex pattern for AMS humidity sensors
 * @param prefix - The printer prefix (e.g., "x1c_00m09d462101575")
 */
export function buildAmsPattern(prefix: string): RegExp {
  const names = AMS_HUMIDITY_NAMES.join('|');
  return new RegExp(`^sensor\\.${prefix}_ams_(\\d+)_(?:${names})(?:_(\\d+))?$`);
}

/**
 * Build a regex pattern for AMS tray sensors
 * @param prefix - The printer prefix
 * @param amsNumber - The AMS unit number (1-4)
 * @param trayNum - The tray number (1-4)
 */
export function buildTrayPattern(prefix: string, amsNumber: string, trayNum: number): RegExp {
  const names = TRAY_NAMES.join('|');
  return new RegExp(`^sensor\\.${prefix}_ams_${amsNumber}_(?:${names})_${trayNum}(?:_(\\d+))?$`);
}

/**
 * Build a regex pattern for external spool sensors
 * @param prefix - The printer prefix
 */
export function buildExternalSpoolPattern(prefix: string): RegExp {
  const names = EXTERNAL_SPOOL_NAMES.join('|');
  return new RegExp(`^sensor\\.${prefix}_(${names})(?:_(\\d+))?$`);
}

/**
 * Check if an entity ID matches any print status pattern
 */
export function isPrintStatusEntity(entityId: string): boolean {
  if (!entityId.startsWith('sensor.')) return false;
  return PRINT_STATUS_SUFFIXES.some(suffix =>
    entityId.endsWith(`_${suffix}`) ||
    entityId.match(new RegExp(`_${suffix}_\\d+$`))
  );
}

/**
 * Extract printer prefix from a print status entity ID
 * e.g., "sensor.x1c_00m09d462101575_print_status" -> "x1c_00m09d462101575"
 * e.g., "sensor.bambulab_p1s_druckstatus" -> "bambulab_p1s"
 */
export function extractPrinterPrefix(entityId: string): string {
  const match = entityId.match(buildPrintStatusPattern());
  if (match) return match[1];

  // Fallback: strip known patterns
  let result = entityId.replace(/^sensor\./, '');
  for (const suffix of PRINT_STATUS_SUFFIXES) {
    result = result.replace(new RegExp(`_${suffix}(?:_\\d+)?$`), '');
  }
  return result;
}

/**
 * Clean friendly name by removing status suffix
 * e.g., "Bambu Lab P1S Print Status" -> "Bambu Lab P1S"
 */
export function cleanFriendlyName(friendlyName: string | undefined, fallback: string): string {
  if (!friendlyName) return fallback;

  let cleaned = friendlyName;
  for (const suffix of FRIENDLY_NAME_SUFFIXES) {
    cleaned = cleaned.replace(new RegExp(` ${suffix}$`, 'i'), '');
  }
  return cleaned || fallback;
}
