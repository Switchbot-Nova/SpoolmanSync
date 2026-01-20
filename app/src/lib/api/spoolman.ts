/**
 * Spoolman API client
 */

export interface Vendor {
  id: number;
  name: string;
  registered: string;
}

export interface Filament {
  id: number;
  name: string;
  vendor: Vendor;
  material: string;
  color_hex: string;
  density: number;
  diameter: number;
  weight?: number;
}

export interface Spool {
  id: number;
  filament: Filament;
  remaining_weight: number;
  used_weight: number;
  initial_weight: number;
  spool_weight?: number;
  registered: string;
  first_used?: string;
  last_used?: string;
  extra: Record<string, string>;
  comment?: string;
  archived: boolean;
}

export interface UpdateTrayPayload {
  spool_id: number;
  active_tray_id: string;
}

export class SpoolmanClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Spoolman API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check if connection is valid
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get all spools
   */
  async getSpools(): Promise<Spool[]> {
    return this.fetch('/spool');
  }

  /**
   * Get a spool by ID
   */
  async getSpool(id: number): Promise<Spool> {
    return this.fetch(`/spool/${id}`);
  }

  /**
   * Get spools currently assigned to a tray
   */
  async getSpoolsByTray(trayId: string): Promise<Spool[]> {
    const spools = await this.getSpools();
    const jsonTrayId = JSON.stringify(trayId);
    return spools.filter(s => s.extra?.['active_tray'] === jsonTrayId);
  }

  /**
   * Assign a spool to a tray
   */
  async assignSpoolToTray(spoolId: number, trayId: string): Promise<Spool> {
    // First, unassign any spool currently in this tray
    const currentSpools = await this.getSpoolsByTray(trayId);
    for (const spool of currentSpools) {
      await this.unassignSpoolFromTray(spool.id);
    }

    // Assign the new spool
    return this.fetch(`/spool/${spoolId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        extra: {
          active_tray: JSON.stringify(trayId),
        },
      }),
    });
  }

  /**
   * Unassign a spool from its current tray
   */
  async unassignSpoolFromTray(spoolId: number): Promise<Spool> {
    // Get current spool to preserve other extra fields
    const spool = await this.getSpool(spoolId);

    // Build new extra object with active_tray set to empty string
    // Spoolman's PATCH replaces the entire extra object, so we need to include
    // all fields we want to keep. Setting active_tray to "" clears the assignment.
    const newExtra: Record<string, string> = {};
    if (spool.extra) {
      for (const [key, value] of Object.entries(spool.extra)) {
        if (key !== 'active_tray') {
          newExtra[key] = value;
        }
      }
    }
    // Set active_tray to JSON-encoded empty string to clear it
    // Spoolman requires extra field values to be valid JSON
    newExtra['active_tray'] = JSON.stringify('');

    console.log(`[SpoolmanSync] Unassigning spool ${spoolId}`);
    console.log(`[SpoolmanSync] Current extra: ${JSON.stringify(spool.extra)}`);
    console.log(`[SpoolmanSync] New extra (with empty active_tray): ${JSON.stringify(newExtra)}`);

    // Send the updated extra object with empty active_tray
    const updatedSpool = await this.fetch<Spool>(`/spool/${spoolId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        extra: newExtra,
      }),
    });

    console.log(`[SpoolmanSync] Response extra after PATCH: ${JSON.stringify(updatedSpool.extra)}`);
    return updatedSpool;
  }

  /**
   * Update spool weight (use filament)
   */
  async useWeight(spoolId: number, weight: number): Promise<void> {
    await this.fetch(`/spool/${spoolId}/use`, {
      method: 'PUT',
      body: JSON.stringify({ use_weight: weight }),
    });
  }

  /**
   * Get all vendors
   */
  async getVendors(): Promise<Vendor[]> {
    return this.fetch('/vendor');
  }

  /**
   * Get all filaments
   */
  async getFilaments(): Promise<Filament[]> {
    return this.fetch('/filament');
  }
}
