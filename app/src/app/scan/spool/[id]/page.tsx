'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import type { Spool } from '@/lib/api/spoolman';
import Link from 'next/link';

interface TrayOption {
  id: string;
  label: string;
  printer: string;
  amsName?: string;
}

export default function SpoolAssignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [spool, setSpool] = useState<Spool | null>(null);
  const [trays, setTrays] = useState<TrayOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch spool and trays in parallel
      const [spoolsRes, printersRes] = await Promise.all([
        fetch('/api/spools'),
        fetch('/api/printers'),
      ]);

      if (!spoolsRes.ok) {
        if (spoolsRes.status === 400) {
          setError('Spoolman is not configured. Please set up Spoolman in Settings first.');
        } else {
          setError('Failed to fetch spool data');
        }
        setLoading(false);
        return;
      }

      const spoolsData = await spoolsRes.json();
      const foundSpool = spoolsData.spools?.find(
        (s: Spool) => s.id.toString() === id
      );

      if (!foundSpool) {
        setError(`Spool #${id} not found in Spoolman`);
        setLoading(false);
        return;
      }

      setSpool(foundSpool);

      // Build tray options
      if (printersRes.ok) {
        const printersData = await printersRes.json();
        const trayOptions: TrayOption[] = [];

        for (const printer of printersData.printers || []) {
          for (const ams of printer.ams_units || []) {
            for (const tray of ams.trays || []) {
              trayOptions.push({
                id: tray.entity_id,
                label: `Tray ${tray.tray_number}`,
                printer: printer.name,
                amsName: ams.name,
              });
            }
          }
          if (printer.external_spool) {
            trayOptions.push({
              id: printer.external_spool.entity_id,
              label: 'External Spool',
              printer: printer.name,
            });
          }
        }

        setTrays(trayOptions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (tray: TrayOption) => {
    if (!spool) return;

    setAssigning(true);
    try {
      const res = await fetch('/api/spools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spoolId: spool.id, trayId: tray.id }),
      });

      if (!res.ok) throw new Error('Failed to assign spool');

      toast.success('Spool assigned successfully!');
      // Auto-redirect to dashboard after successful assignment
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign');
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="w-full max-w-2xl mx-auto py-6 px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/scan">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Assign Spool</h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">{error}</p>
              <Link href="/scan">
                <Button variant="outline">Go to Scan Page</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Spool Details & Tray Selection */}
        {!loading && !error && spool && (
          <div className="space-y-6">
            {/* Spool Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full border"
                    style={{ backgroundColor: `#${spool.filament.color_hex}` }}
                  />
                  Spool #{spool.id}
                </CardTitle>
                <CardDescription>
                  {spool.filament.vendor.name} {spool.filament.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Material:</span>
                    <Badge variant="secondary" className="ml-2">
                      {spool.filament.material}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="ml-2 font-medium">{spool.remaining_weight}g</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tray Selection */}
            {trays.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Select Tray</CardTitle>
                  <CardDescription>
                    Choose which AMS tray to assign this spool to
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Command className="rounded-lg border">
                    <CommandInput placeholder="Search trays..." />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No trays found.</CommandEmpty>
                      <CommandGroup>
                        {trays.map((tray) => (
                          <CommandItem
                            key={tray.id}
                            value={`${tray.printer} ${tray.amsName || ''} ${tray.label}`}
                            onSelect={() => handleAssign(tray)}
                            disabled={assigning}
                            className="flex items-center justify-between py-3 cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">{tray.printer}</p>
                              <p className="text-sm text-muted-foreground">
                                {tray.amsName ? `${tray.amsName} - ` : ''}{tray.label}
                              </p>
                            </div>
                            {assigning ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <Badge variant="outline">Select</Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No printers or trays found. Please set up Home Assistant and discover printers first.
                  </p>
                  <div className="flex justify-center mt-4">
                    <Link href="/settings">
                      <Button variant="outline">Go to Settings</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
