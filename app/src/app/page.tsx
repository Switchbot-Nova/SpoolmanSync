'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Nav } from '@/components/nav';
import { PrinterCard } from '@/components/dashboard/printer-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import type { HAPrinter } from '@/lib/api/homeassistant';
import type { Spool } from '@/lib/api/spoolman';
import Link from 'next/link';

interface PrinterWithSpools extends HAPrinter {
  ams_units: Array<{
    entity_id: string;
    name: string;
    trays: Array<{
      entity_id: string;
      tray_number: number;
      name?: string; // Filament name from printer, "Empty" if no filament loaded
      assigned_spool?: Spool;
      [key: string]: unknown;
    }>;
  }>;
  external_spool?: {
    entity_id: string;
    tray_number: number;
    name?: string;
    assigned_spool?: Spool;
    [key: string]: unknown;
  };
}

interface Settings {
  homeassistant: { url: string; connected: boolean } | null;
  spoolman: { url: string; connected: boolean } | null;
}

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [printers, setPrinters] = useState<PrinterWithSpools[]>([]);
  const [spools, setSpools] = useState<Spool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track trays that have filament loaded but no spool assigned
  // Returns both count and list of specific tray identifiers
  const unassignedTrays = useMemo(() => {
    const trays: string[] = [];
    for (const printer of printers) {
      for (const ams of printer.ams_units) {
        for (const tray of ams.trays) {
          // Check if tray has filament (name is not empty/Empty)
          const trayName = tray.name?.toLowerCase().trim() || '';
          const hasFilament = trayName && trayName !== 'empty';

          // Only count if filament is loaded but no spool assigned
          if (hasFilament && !tray.assigned_spool) {
            // Format: "AMS 1 Tray 3" or just "Tray 3" if only one AMS
            const amsPrefix = printer.ams_units.length > 1 ? `${ams.name} ` : '';
            trays.push(`${amsPrefix}Tray ${tray.tray_number}`);
          }
        }
      }
      // Don't count external spool as "unassigned" by default since many don't use it
    }
    return trays;
  }, [printers]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch settings first
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);

      // Only fetch printers and spools if both services are configured
      if (settingsData.homeassistant && settingsData.spoolman) {
        const [printersRes, spoolsRes] = await Promise.all([
          fetch('/api/printers'),
          fetch('/api/spools'),
        ]);

        if (printersRes.ok) {
          const printersData = await printersRes.json();
          setPrinters(printersData.printers || []);
        }

        if (spoolsRes.ok) {
          const spoolsData = await spoolsRes.json();
          setSpools(spoolsData.spools || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates: try SSE first, fall back to polling if SSE doesn't work
  // (HA's ingress proxy doesn't support SSE streaming)
  useEffect(() => {
    if (!settings?.homeassistant || !settings?.spoolman) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let sseConnected = false;
    let pollInterval: NodeJS.Timeout | null = null;
    let sseCheckTimeout: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollInterval) return; // Already polling
      console.log('SSE unavailable, falling back to polling every 2s');
      pollInterval = setInterval(() => {
        fetchData();
      }, 2000);
    };

    const handleSSEMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          sseConnected = true;
          // SSE works — cancel the fallback check
          if (sseCheckTimeout) {
            clearTimeout(sseCheckTimeout);
            sseCheckTimeout = null;
          }
          return;
        }

        if (data.type === 'heartbeat') return;

        if (data.type === 'usage') {
          toast.info(`Filament used: ${data.deducted}g from ${data.spoolName || 'spool'}`);
          fetchData();
        } else if (data.type === 'assign') {
          toast.success(`Auto-assigned ${data.spoolName || 'spool'} to tray`);
          fetchData();
        } else if (data.type === 'unassign') {
          toast.info(`Unassigned ${data.spoolName || 'spool'} from tray`);
          fetchData();
        } else if (data.type === 'tray_change') {
          fetchData();
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    const connect = () => {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = handleSSEMessage;

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (!sseConnected) {
          // SSE never connected — go straight to polling
          if (sseCheckTimeout) {
            clearTimeout(sseCheckTimeout);
            sseCheckTimeout = null;
          }
          startPolling();
        } else {
          // Was working, try to reconnect after a delay
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    // If SSE doesn't deliver a "connected" message within 4 seconds, fall back to polling
    sseCheckTimeout = setTimeout(() => {
      if (!sseConnected) {
        eventSource?.close();
        eventSource = null;
        startPolling();
      }
    }, 4000);

    return () => {
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (sseCheckTimeout) clearTimeout(sseCheckTimeout);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [settings?.homeassistant, settings?.spoolman, fetchData]);

  const handleSpoolAssign = async (trayId: string, spoolId: number) => {
    try {
      const res = await fetch('/api/spools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trayId, spoolId }),
      });

      if (!res.ok) {
        throw new Error('Failed to assign spool');
      }

      toast.success('Spool assigned successfully');
      fetchData(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign spool');
    }
  };

  const handleSpoolUnassign = async (spoolId: number) => {
    try {
      const res = await fetch('/api/spools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spoolId }),
      });

      if (!res.ok) {
        throw new Error('Failed to unassign spool');
      }

      toast.success('Spool unassigned');
      await fetchData(); // Refresh data - await to ensure UI updates
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unassign spool');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
              <Button onClick={fetchData} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Show setup prompt if services aren't configured
  if (!settings?.homeassistant || !settings?.spoolman) {
    return (
      <div className="min-h-screen bg-background">
        <Nav />
        <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to SpoolmanSync</CardTitle>
              <CardDescription>
                Connect your Home Assistant and Spoolman to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${settings?.homeassistant ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Home Assistant: {settings?.homeassistant ? 'Connected' : 'Not configured'}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`h-3 w-3 rounded-full ${settings?.spoolman ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Spoolman: {settings?.spoolman ? 'Connected' : 'Not configured'}</span>
              </div>
              <Link href="/settings">
                <Button>Configure Settings</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="w-full max-w-7xl mx-auto py-6 px-3 sm:px-4 md:px-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <Button variant="outline" size="sm" onClick={fetchData}>
            Refresh
          </Button>
        </div>

        {printers.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Printers Found</CardTitle>
              <CardDescription>
                Make sure your Bambu Lab printer is connected to Home Assistant via the ha-bambulab integration.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Show instruction banner when there are unassigned trays */}
            {unassignedTrays.length > 0 && (
              <Alert>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <AlertTitle>Assign Spools to Trays</AlertTitle>
                <AlertDescription>
                  {unassignedTrays.length === 1 ? (
                    <>{unassignedTrays[0]} has filament but no assigned spool.</>
                  ) : (
                    <>{unassignedTrays.join(', ')} have filament but no assigned spools.</>
                  )}
                  {' '}Click on the tray card below to select which Spoolman spool is loaded.
                  This ensures accurate filament tracking when prints complete.
                </AlertDescription>
              </Alert>
            )}

            {printers.map((printer) => (
              <PrinterCard
                key={printer.entity_id}
                printer={printer as Parameters<typeof PrinterCard>[0]['printer']}
                spools={spools}
                onSpoolAssign={handleSpoolAssign}
                onSpoolUnassign={handleSpoolUnassign}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
