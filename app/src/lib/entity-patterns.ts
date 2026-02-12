/**
 * Centralized entity name patterns for ha-bambulab integration
 *
 * ha-bambulab localizes entity IDs based on Home Assistant's language setting.
 * Supports all 17 languages from ha-bambulab translations.
 *
 * Supported languages:
 * ca (Catalan), cs (Czech), da (Danish), de (German), el (Greek),
 * en (English), es (Spanish), fr (French), it (Italian), ko (Korean),
 * nl (Dutch), pl (Polish), pt (Portuguese), pt-br (Portuguese Brazil),
 * sk (Slovak), th (Thai), zh-Hans (Chinese Simplified)
 */

// Localized suffixes for the print_status sensor (used to identify printers)
export const PRINT_STATUS_SUFFIXES = [
  'print_status',           // English
  'druckstatus',            // German
  'printstatus',            // Dutch
  'estado_de_la_impresion', // Spanish
  'stato_di_stampa',        // Italian
  'etat_de_l_impression',   // French (État de l'impression)
  'etat_de_limpression',    // French alternate
  'estat_de_la_impressio',  // Catalan (Estat de la Impressió)
  'stav_tisku',             // Czech (Stav tisku)
  'print_status',           // Danish (same as English)
  'katastasi_ektyposis',    // Greek (Κατάσταση εκτύπωσης)
  'chullyeog_sangtae',      // Korean (출력 상태)
  'status_druku',           // Polish (Status druku)
  'status_de_impressao',    // Portuguese (Status de impressão)
  'status_da_impressao',    // Portuguese Brazil (Status da impressão)
  'stav_tlace',             // Slovak (Stav tlače)
  'sathana_phim',           // Thai (สถานะพิมพ์)
  'dayin_zhuangtai',        // Chinese (打印状态)
];

// Localized names for AMS humidity sensor
export const AMS_HUMIDITY_NAMES = [
  'humidity',          // English
  'luftfeuchtigkeit',  // German
  'vochtigheid',       // Dutch (short form)
  'luchtvochtigheid',  // Dutch (full form - "air humidity")
  'humedad',           // Spanish
  'umidita',           // Italian
  'humidite',          // French (Humidité)
  'humitat',           // Catalan (Humitat)
  'vlhkost',           // Czech (Vlhkost)
  'fugtighed',         // Danish (Fugtighed)
  'ygrotita',          // Greek (Υγρότητα)
  'seupgi',            // Korean (습기)
  'wilgotnosc',        // Polish (Wilgotność)
  'umidade',           // Portuguese/Portuguese Brazil (Umidade)
  'vlhkost',           // Slovak (Vlhkosť) - same as Czech
  'khwam_chuen',       // Thai (ความชื้น)
  'shidu',             // Chinese (湿度)
  // Also support humidity_index variants
  'indice_d_humidite', // French (Indice d'humidité)
  'index_der_luftfeuchtigkeit', // German
];

// Localized names for AMS tray sensor
export const TRAY_NAMES = [
  'tray',              // English, Dutch
  'slot',              // German, Czech, Polish, Italian
  'bandeja',           // Spanish, Portuguese, Portuguese Brazil
  'emplacement',       // French (Emplacement)
  'safata',            // Catalan (Safata)
  'bakke',             // Danish (Bakke)
  'thesi',             // Greek (Θέση)
  'teulei',            // Korean (트레이)
  'zasobnik',          // Slovak (Zásobník)
  'thad',              // Thai (ถาด)
  'liaopan',           // Chinese (料盘)
];

// Localized names for external spool sensor
// Note: ha-bambulab uses various formats - we support all known variations
export const EXTERNAL_SPOOL_NAMES = [
  // English
  'external_spool',                   // Older format
  'externalspool_external_spool',     // Newer format
  // German
  'externe_spule',                    // Older format
  'externalspool_externe_spule',      // Newer hybrid (English prefix + German suffix)
  'externespule_externe_spule',       // Newer fully localized
  // Dutch
  'externe_spoel',                    // Older format
  'externalspool_externe_spoel',      // Newer hybrid
  'externespoel_externe_spoel',       // Newer fully localized
  // Spanish
  'bobina_externa',                   // Older format
  'externalspool_bobina_externa',     // Newer hybrid
  'bobinaexterna_bobina_externa',     // Newer fully localized
  // Italian
  'bobina_esterna',                   // Older format
  'externalspool_bobina_esterna',     // Newer hybrid
  'bobinaesterna_bobina_esterna',     // Newer fully localized
  // French
  'bobine_externe',                   // Older format
  'externalspool_bobine_externe',     // Newer hybrid
  'bobineexterne_bobine_externe',     // Newer fully localized
  // Catalan
  'bobina_externa',                   // Same as Spanish
  'externalspool_bobina_externa',     // Newer hybrid
  // Czech
  'externi_civka',                    // Older format (Externí cívka)
  'externalspool_externi_civka',      // Newer hybrid
  'externicivka_externi_civka',       // Newer fully localized
  // Danish
  'ekstern_spole',                    // Older format (Ekstern spole)
  'externalspool_ekstern_spole',      // Newer hybrid
  'eksternspole_ekstern_spole',       // Newer fully localized
  // Greek
  'exoteriko_nima',                   // Older format (Εξωτερικό νήμα)
  'externalspool_exoteriko_nima',     // Newer hybrid
  'exoteriko_nima_exoteriko_nima',    // Newer fully localized
  // Korean
  'oebu_seupul',                      // Older format (외부 스풀)
  'externalspool_oebu_seupul',        // Newer hybrid
  // Polish
  'zewnetrzna_szpula',                // Older format (Zewnętrzna szpula)
  'externalspool_zewnetrzna_szpula',  // Newer hybrid
  'zewnetrznaszpula_zewnetrzna_szpula', // Newer fully localized
  // Portuguese / Portuguese Brazil
  'carretel_externo',                 // Older format (Carretel externo)
  'externalspool_carretel_externo',   // Newer hybrid
  'carretelexterno_carretel_externo', // Newer fully localized
  // Slovak
  'vonkajsia_cievka',                 // Older format (Vonkajšia cievka)
  'externalspool_vonkajsia_cievka',   // Newer hybrid
  'vonkajsiacievka_vonkajsia_cievka', // Newer fully localized
  // Thai
  'sapun_phainok',                    // Older format (สปูลภายนอก)
  'externalspool_sapun_phainok',      // Newer hybrid
  // Chinese
  'waigua_liaopan',                   // Older format (外挂料盘)
  'externalspool_waigua_liaopan',     // Newer hybrid
  'waigualiaopan_waigua_liaopan',     // Newer fully localized
];

// Localized friendly name suffixes to strip from printer names
export const FRIENDLY_NAME_SUFFIXES = [
  'Print Status',           // English
  'Druckstatus',            // German
  'Printstatus',            // Dutch
  'Estado de la Impresión', // Spanish
  'Stato di stampa',        // Italian
  'État de l\'impression',  // French
  'Estat de la Impressió',  // Catalan
  'Stav tisku',             // Czech
  'Print status',           // Danish
  'Κατάσταση εκτύπωσης',    // Greek
  '출력 상태',               // Korean
  'Status druku',           // Polish
  'Status de impressão',    // Portuguese
  'Status da impressão',    // Portuguese Brazil
  'Stav tlače',             // Slovak
  'สถานะพิมพ์',              // Thai
  '打印状态',                // Chinese
];

// Localized names for current_stage sensor (used in automation triggers)
export const CURRENT_STAGE_NAMES = [
  'current_stage',           // English
  'aktueller_arbeitsschritt', // German (Aktueller Arbeitsschritt)
  'huidige_fase',            // Dutch (Huidige fase)
  'estado_actual',           // Spanish (Estado actual)
  'fase_corrente',           // Italian (Fase corrente)
  'etape_actuelle',          // French (Étape actuelle)
  'estat_actual',            // Catalan (Estat actual)
  'aktualni_faze',           // Czech (Aktuální fáze)
  'nuvaerende_trin',         // Danish (Nuværende trin)
  'trechon_stadio',          // Greek (Τρέχον στάδιο)
  'hyeonjae_dangye',         // Korean (현재 단계)
  'aktualny_stan',           // Polish (Aktualny stan)
  'fase_atual',              // Portuguese/Portuguese Brazil (Fase atual)
  'aktualny_stav',           // Slovak (Aktuálny stav)
  'khantaun_pajjuban',       // Thai (ขั้นตอนปัจจุบัน)
  'dangqian_jieduan',        // Chinese (当前阶段)
];

// Localized names for print_weight sensor
export const PRINT_WEIGHT_NAMES = [
  'print_weight',            // English
  'gewicht_des_drucks',      // German (Gewicht des Drucks)
  'gewicht_van_print',       // Dutch
  'peso_de_la_impresion',    // Spanish (Peso de la impresión)
  'grammatura_stampa',       // Italian (Grammatura stampa)
  'poids_de_l_impression',   // French (Poids de l'impression)
  'poids_de_limpression',    // French alternate
  'pes_de_la_impressio',     // Catalan (Pes de la impressió)
  'hmotnost_tisku',          // Czech (Hmotnost tisku)
  'printvaegt',              // Danish (Printvægt)
  'varos_ektyposis',         // Greek (Βάρος εκτύπωσης)
  'chullyeog_muge',          // Korean (출력 무게)
  'waga_filamentu',          // Polish (Waga filamentu)
  'peso_de_impressao',       // Portuguese (Peso de impressão)
  'peso_da_impressao',       // Portuguese Brazil (Peso da impressão)
  'vaha_tlace',              // Slovak (Váha tlače)
  'namnak_phim',             // Thai (น้ำหนักพิมพ์)
  'dayin_zhongliang',        // Chinese (打印重量)
];

// Localized names for print_progress sensor
export const PRINT_PROGRESS_NAMES = [
  'print_progress',          // English
  'druckfortschritt',        // German (Druckfortschritt)
  'printvoortgang',          // Dutch (Printvoortgang)
  'progreso_de_la_impresion', // Spanish (Progreso de la impresión)
  'progressi_di_stampa',     // Italian (Progressi di stampa)
  'progression_de_l_impression', // French (Progression de l'impression)
  'progression_de_limpression',  // French alternate
  'progres_de_la_impressio', // Catalan (Progrés de la impressió)
  'prubeh_tisku',            // Czech (Průběh tisku)
  'print_fremskridt',        // Danish (Print fremskridt)
  'proodos_ektyposis',       // Greek (Πρόοδος εκτύπωσης)
  'chullyeog_jinhaeng_sanghwang', // Korean (출력 진행 상황)
  'postep_drukowania',       // Polish (Postęp drukowania)
  'imprimir_progresso',      // Portuguese (Imprimir progresso)
  'progresso_da_impressao',  // Portuguese Brazil (Progresso da impressão)
  'priebeh_tlace',           // Slovak (Priebeh tlače)
  'khwam_khuebhna_kan_phim', // Thai (ความคืบหน้าการพิมพ์)
  'dayin_jindu',             // Chinese (打印进度)
];

// Supported languages for entity localization
export type SupportedLanguage =
  | 'en' | 'de' | 'nl' | 'es' | 'it' | 'fr'
  | 'ca' | 'cs' | 'da' | 'el' | 'ko' | 'pl'
  | 'pt' | 'pt-br' | 'sk' | 'th' | 'zh-Hans';

// Mapping of print_status suffix to language code
const PRINT_STATUS_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  'print_status': 'en',
  'druckstatus': 'de',
  'printstatus': 'nl',
  'estado_de_la_impresion': 'es',
  'stato_di_stampa': 'it',
  'etat_de_l_impression': 'fr',
  'etat_de_limpression': 'fr',
  'estat_de_la_impressio': 'ca',
  'stav_tisku': 'cs',
  'katastasi_ektyposis': 'el',
  'chullyeog_sangtae': 'ko',
  'status_druku': 'pl',
  'status_de_impressao': 'pt',
  'status_da_impressao': 'pt-br',
  'stav_tlace': 'sk',
  'sathana_phim': 'th',
  'dayin_zhuangtai': 'zh-Hans',
};

// Localized entity names by language
// These are used in the YAML generator for automation triggers
const LOCALIZED_ENTITIES: Record<SupportedLanguage, {
  current_stage: string;
  print_weight: string;
  print_progress: string;
  external_spool: string;
}> = {
  en: {
    current_stage: 'current_stage',
    print_weight: 'print_weight',
    print_progress: 'print_progress',
    external_spool: 'external_spool',
  },
  de: {
    current_stage: 'aktueller_arbeitsschritt',
    print_weight: 'gewicht_des_drucks',
    print_progress: 'druckfortschritt',
    external_spool: 'externe_spule',
  },
  nl: {
    current_stage: 'huidige_fase',
    print_weight: 'gewicht_van_print',
    print_progress: 'printvoortgang',
    external_spool: 'externe_spoel',
  },
  es: {
    current_stage: 'estado_actual',
    print_weight: 'peso_de_la_impresion',
    print_progress: 'progreso_de_la_impresion',
    external_spool: 'bobina_externa',
  },
  it: {
    current_stage: 'fase_corrente',
    print_weight: 'grammatura_stampa',
    print_progress: 'progressi_di_stampa',
    external_spool: 'bobina_esterna',
  },
  fr: {
    current_stage: 'etape_actuelle',
    print_weight: 'poids_de_l_impression',
    print_progress: 'progression_de_l_impression',
    external_spool: 'bobine_externe',
  },
  ca: {
    current_stage: 'estat_actual',
    print_weight: 'pes_de_la_impressio',
    print_progress: 'progres_de_la_impressio',
    external_spool: 'bobina_externa',
  },
  cs: {
    current_stage: 'aktualni_faze',
    print_weight: 'hmotnost_tisku',
    print_progress: 'prubeh_tisku',
    external_spool: 'externi_civka',
  },
  da: {
    current_stage: 'nuvaerende_trin',
    print_weight: 'printvaegt',
    print_progress: 'print_fremskridt',
    external_spool: 'ekstern_spole',
  },
  el: {
    current_stage: 'trechon_stadio',
    print_weight: 'varos_ektyposis',
    print_progress: 'proodos_ektyposis',
    external_spool: 'exoteriko_nima',
  },
  ko: {
    current_stage: 'hyeonjae_dangye',
    print_weight: 'chullyeog_muge',
    print_progress: 'chullyeog_jinhaeng_sanghwang',
    external_spool: 'oebu_seupul',
  },
  pl: {
    current_stage: 'aktualny_stan',
    print_weight: 'waga_filamentu',
    print_progress: 'postep_drukowania',
    external_spool: 'zewnetrzna_szpula',
  },
  pt: {
    current_stage: 'fase_atual',
    print_weight: 'peso_de_impressao',
    print_progress: 'imprimir_progresso',
    external_spool: 'carretel_externo',
  },
  'pt-br': {
    current_stage: 'fase_atual',
    print_weight: 'peso_da_impressao',
    print_progress: 'progresso_da_impressao',
    external_spool: 'carretel_externo',
  },
  sk: {
    current_stage: 'aktualny_stav',
    print_weight: 'vaha_tlace',
    print_progress: 'priebeh_tlace',
    external_spool: 'vonkajsia_cievka',
  },
  th: {
    current_stage: 'khantaun_pajjuban',
    print_weight: 'namnak_phim',
    print_progress: 'khwam_khuebhna_kan_phim',
    external_spool: 'sapun_phainok',
  },
  'zh-Hans': {
    current_stage: 'dangqian_jieduan',
    print_weight: 'dayin_zhongliang',
    print_progress: 'dayin_jindu',
    external_spool: 'waigua_liaopan',
  },
};

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
 *
 * Supported AMS naming patterns:
 * - Standard AMS: ams_1_humidity, ams_2_humidity
 * - AMS Lite: ams_lite_humidity, ams_humidity (no number)
 * - AMS 2 Pro: ams_2_pro_humidity
 * - AMS HT: ams_128_humidity, ams_ht_humidity
 */
export function buildAmsPattern(prefix: string): RegExp {
  const names = AMS_HUMIDITY_NAMES.join('|');
  // AMS number is optional - A1 with AMS Lite uses just "_ams_" without a number
  // AMS type suffix (pro, ht) is optional - P2S uses "ams_2_pro_", AMS HT may use "ams_128_" or "ams_ht_"
  // Group 1: AMS number (1, 2, 128, etc.)
  // Group 2: "lite" or "ht" when using standalone naming
  // Group 3: humidity index suffix (optional)
  return new RegExp(`^sensor\\.${prefix}_ams_(?:(\\d+)(?:_(?:pro|ht))?_|(lite|ht)_)?(?:${names})(?:_(\\d+))?$`);
}

/**
 * Build a regex pattern for AMS tray sensors
 * @param prefix - The printer prefix
 * @param amsNumber - The AMS unit number (1-4, 128 for HT, or "1" for A1 without explicit number)
 * @param trayNum - The tray number (1-4)
 *
 * Supported AMS naming patterns:
 * - Standard AMS: ams_1_tray_1, ams_2_slot_2
 * - AMS Lite: ams_lite_tray_1, ams_tray_1 (no number)
 * - AMS 2 Pro: ams_2_pro_slot_1
 * - AMS HT: ams_128_tray_1, ams_ht_tray_1
 */
export function buildTrayPattern(prefix: string, amsNumber: string, trayNum: number): RegExp {
  const names = TRAY_NAMES.join('|');
  // For A1 with AMS Lite (amsNumber="1"), also match entities without explicit AMS number
  // e.g., "sensor.schiller_ams_tray_1" in addition to "sensor.schiller_ams_1_tray_1"
  // AMS type suffix (pro, ht) is optional - P2S uses "ams_2_pro_", AMS HT may use "ams_128_" or "ams_ht_"
  if (amsNumber === '1') {
    return new RegExp(`^sensor\\.${prefix}_ams_(?:1(?:_(?:pro|ht))?_)?(?:${names})_${trayNum}(?:_(\\d+))?$`);
  }
  return new RegExp(`^sensor\\.${prefix}_ams_${amsNumber}(?:_(?:pro|ht))?_(?:${names})_${trayNum}(?:_(\\d+))?$`);
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
 * Build a regex pattern for current_stage sensors
 * @param prefix - The printer prefix
 */
export function buildCurrentStagePattern(prefix: string): RegExp {
  const names = CURRENT_STAGE_NAMES.join('|');
  return new RegExp(`^sensor\\.${prefix}_(${names})(?:_(\\d+))?$`);
}

/**
 * Build a regex pattern for print_weight sensors
 * @param prefix - The printer prefix
 */
export function buildPrintWeightPattern(prefix: string): RegExp {
  const names = PRINT_WEIGHT_NAMES.join('|');
  return new RegExp(`^sensor\\.${prefix}_(${names})(?:_(\\d+))?$`);
}

/**
 * Build a regex pattern for print_progress sensors
 * @param prefix - The printer prefix
 */
export function buildPrintProgressPattern(prefix: string): RegExp {
  const names = PRINT_PROGRESS_NAMES.join('|');
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

/**
 * Detect the language from a printer's print_status entity ID
 * e.g., "sensor.bambulab_p1s_druckstatus" -> "de"
 * Returns 'en' as default if language cannot be detected
 */
export function detectLanguageFromEntity(entityId: string): SupportedLanguage {
  for (const [suffix, lang] of Object.entries(PRINT_STATUS_TO_LANGUAGE)) {
    if (entityId.endsWith(`_${suffix}`) || entityId.match(new RegExp(`_${suffix}_\\d+$`))) {
      return lang;
    }
  }
  return 'en'; // Default to English
}

/**
 * Get localized entity names for a specific language
 * Used by the YAML generator to create automations with correct entity IDs
 */
export function getLocalizedEntities(language: SupportedLanguage) {
  return LOCALIZED_ENTITIES[language];
}

/**
 * Get the localized entity name for a specific entity type based on printer's entity ID
 * @param printerEntityId - The printer's print_status entity ID (used to detect language)
 * @param entityType - The type of entity to get the localized name for
 */
export function getLocalizedEntityName(
  printerEntityId: string,
  entityType: 'current_stage' | 'print_weight' | 'print_progress' | 'external_spool'
): string {
  const language = detectLanguageFromEntity(printerEntityId);
  return LOCALIZED_ENTITIES[language][entityType];
}

// =============================================================================
// Prefix-agnostic entity matching functions
// Used for device-based discovery when entity ID prefixes don't match
// (e.g., user renamed print_status entity but not AMS entities)
// =============================================================================

/**
 * Check if an entity ID is an AMS humidity sensor (any prefix)
 * Returns the AMS number if matched, null otherwise
 * e.g., "sensor.x1c_xxx_ams_1_humidity" -> "1"
 * e.g., "sensor.a1_ams_lite_indice_d_humidite" -> "lite"
 * e.g., "sensor.schiller_ams_humidity" -> "1" (A1 AMS Lite without number defaults to 1)
 * e.g., "sensor.bambu_lab_ams_2_pro_humidity" -> "2" (P2S AMS Pro)
 * e.g., "sensor.a1_mini_ams_128_humidity" -> "128" (AMS HT)
 * e.g., "sensor.a1_mini_ams_ht_humidity" -> "ht" (AMS HT alternate naming)
 */
export function matchAmsHumidityEntity(entityId: string): string | null {
  const names = AMS_HUMIDITY_NAMES.join('|');

  // Check for standalone "ht" naming first (ams_ht_humidity)
  const htPattern = new RegExp(`^sensor\\..+_ams_(ht)_(?:${names})(?:_\\d+)?$`);
  const htMatch = entityId.match(htPattern);
  if (htMatch) {
    return 'ht';
  }

  // AMS number is optional - A1 with AMS Lite uses just "_ams_" without a number
  // AMS type suffix (pro, ht) is optional - P2S uses "ams_2_pro_", AMS HT may use "ams_128_ht_"
  // Group 1: AMS number (1, 2, 128, etc.)
  // Group 2: "lite" when AMS Lite with explicit naming
  const pattern = new RegExp(`^sensor\\..+_ams_(?:(\\d+)(?:_(?:pro|ht))?_|(lite)_)?(?:${names})(?:_\\d+)?$`);
  const match = entityId.match(pattern);
  if (match) {
    // Return AMS number, or "lite", or default to "1" for A1 AMS Lite without explicit naming
    return match[1] || match[2] || '1';
  }
  return null;
}

/**
 * Check if an entity ID is an AMS tray sensor (any prefix)
 * Returns { amsNumber, trayNumber } if matched, null otherwise
 * e.g., "sensor.x1c_xxx_ams_1_tray_2" -> { amsNumber: "1", trayNumber: 2 }
 * e.g., "sensor.schiller_ams_tray_1" -> { amsNumber: "1", trayNumber: 1 } (A1 AMS Lite without number)
 * e.g., "sensor.bambu_lab_ams_2_pro_slot_1" -> { amsNumber: "2", trayNumber: 1 } (P2S AMS Pro)
 * e.g., "sensor.a1_mini_ams_128_tray_1" -> { amsNumber: "128", trayNumber: 1 } (AMS HT)
 * e.g., "sensor.a1_mini_ams_ht_tray_1" -> { amsNumber: "ht", trayNumber: 1 } (AMS HT alternate naming)
 */
export function matchTrayEntity(entityId: string): { amsNumber: string; trayNumber: number } | null {
  const names = TRAY_NAMES.join('|');

  // Check for standalone "ht" naming first (ams_ht_tray_N)
  const htPattern = new RegExp(`^sensor\\..+_ams_(ht)_(?:${names})_(\\d+)(?:_\\d+)?$`);
  const htMatch = entityId.match(htPattern);
  if (htMatch) {
    return {
      amsNumber: 'ht',
      trayNumber: parseInt(htMatch[2], 10),
    };
  }

  // AMS number is optional - A1 with AMS Lite uses just "_ams_tray_N" without a number
  // AMS type suffix (pro, ht) is optional - P2S uses "ams_2_pro_", AMS HT may use "ams_128_ht_"
  // Group 1: AMS number (1, 2, 128, etc.)
  // Group 2: "lite" when AMS Lite with explicit naming
  // Group 3: tray number
  const pattern = new RegExp(`^sensor\\..+_ams_(?:(\\d+)(?:_(?:pro|ht))?_|(lite)_)?(?:${names})_(\\d+)(?:_\\d+)?$`);
  const match = entityId.match(pattern);
  if (match) {
    return {
      // Return AMS number, or "lite", or default to "1" for A1 AMS Lite without explicit naming
      amsNumber: match[1] || match[2] || '1',
      trayNumber: parseInt(match[3], 10),
    };
  }
  return null;
}

/**
 * Check if an entity ID is an external spool sensor (any prefix)
 */
export function matchExternalSpoolEntity(entityId: string): boolean {
  const names = EXTERNAL_SPOOL_NAMES.join('|');
  const pattern = new RegExp(`^sensor\\..+_(${names})(?:_\\d+)?$`);
  return pattern.test(entityId);
}

/**
 * Check if an entity ID is a current_stage sensor (any prefix)
 */
export function matchCurrentStageEntity(entityId: string): boolean {
  const names = CURRENT_STAGE_NAMES.join('|');
  const pattern = new RegExp(`^sensor\\..+_(${names})(?:_\\d+)?$`);
  return pattern.test(entityId);
}

/**
 * Check if an entity ID is a print_weight sensor (any prefix)
 */
export function matchPrintWeightEntity(entityId: string): boolean {
  const names = PRINT_WEIGHT_NAMES.join('|');
  const pattern = new RegExp(`^sensor\\..+_(${names})(?:_\\d+)?$`);
  return pattern.test(entityId);
}

/**
 * Check if an entity ID is a print_progress sensor (any prefix)
 */
export function matchPrintProgressEntity(entityId: string): boolean {
  const names = PRINT_PROGRESS_NAMES.join('|');
  const pattern = new RegExp(`^sensor\\..+_(${names})(?:_\\d+)?$`);
  return pattern.test(entityId);
}
