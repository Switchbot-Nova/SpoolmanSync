'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { HATray } from '@/lib/api/homeassistant';
import type { Spool } from '@/lib/api/spoolman';

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

interface TraySlotProps {
  tray: HATray;
  assignedSpool?: Spool;
  spools: Spool[];
  onAssign: (spoolId: number) => void;
  onUnassign?: (spoolId: number) => void;
  mismatch?: MismatchInfo;
}

export function TraySlot({ tray, assignedSpool, spools, onAssign, onUnassign, mismatch }: TraySlotProps) {
  const [open, setOpen] = useState(false);

  const colorHex = assignedSpool?.filament.color_hex || tray.color?.replace('#', '') || 'cccccc';
  // Only show weight from Spoolman when a spool is assigned
  const displayWeight = assignedSpool?.remaining_weight;
  // Only show weight if spool is assigned and weight is a valid positive number
  const showWeight = assignedSpool && typeof displayWeight === 'number' && displayWeight >= 0;

  const handleUnassign = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the dialog
    if (assignedSpool && onUnassign) {
      onUnassign(assignedSpool.id);
    }
  };

  const trayLabel = tray.tray_number === 0 ? 'External' : `Tray ${tray.tray_number}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="relative flex w-full flex-col rounded-lg border-2 border-border p-3 transition-colors hover:border-primary hover:bg-accent text-left min-h-[140px]"
        >
          {/* Header row with tray label and unassign button */}
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {trayLabel}
            </span>
            {assignedSpool && onUnassign && (
              <span
                onClick={handleUnassign}
                className="h-5 w-5 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer text-xs"
                title="Unassign spool"
              >
                ✕
              </span>
            )}
          </div>

          {/* Mismatch warning banner */}
          {mismatch && assignedSpool && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 mb-2 rounded bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700"
              title={`RFID: ${mismatch.printerReports.color} (${mismatch.printerReports.material}) | Assigned: ${mismatch.spoolmanHas.color} (${mismatch.spoolmanHas.material})`}
            >
              <span className="text-amber-600 dark:text-amber-400 text-xs">⚠️</span>
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 truncate">
                Possible wrong spool
              </span>
            </div>
          )}

          {assignedSpool ? (
            <>
              {/* Main content: color circle + filament name */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="h-8 w-8 rounded-full border-2 border-border flex-shrink-0"
                  style={{ backgroundColor: `#${colorHex}` }}
                />
                <p className="text-sm font-semibold leading-tight line-clamp-2" title={assignedSpool.filament.name || assignedSpool.filament.material}>
                  {assignedSpool.filament.name || assignedSpool.filament.material}
                </p>
              </div>

              {/* Info: material and vendor stacked */}
              <div className="space-y-1 mb-2 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">Material:</span>
                  <span className="text-xs font-medium">{assignedSpool.filament.material}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] font-medium text-muted-foreground uppercase">Vendor:</span>
                  <span className="text-xs font-medium truncate">{assignedSpool.filament.vendor.name}</span>
                </div>
              </div>

              {/* Footer: spool ID and weight */}
              <div className="flex items-center justify-between mt-auto pt-1">
                <span className="text-[10px] text-muted-foreground">
                  #{assignedSpool.id}
                </span>
                {showWeight && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {Math.round(displayWeight)}g
                  </Badge>
                )}
              </div>
            </>
          ) : (
            /* Empty tray state */
            <div className="flex flex-col items-center justify-center flex-1 py-2">
              <div
                className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/30 mb-2"
              />
              <p className="text-xs text-muted-foreground">
                No spool assigned
              </p>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1">
                Click to assign
              </p>
            </div>
          )}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Assign Spool to {tray.tray_number === 0 ? 'External Slot' : `Tray ${tray.tray_number}`}
          </DialogTitle>
        </DialogHeader>

        {/* Mismatch warning in dialog */}
        {mismatch && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div className="space-y-1.5">
                <p className="font-medium text-amber-700 dark:text-amber-300">
                  Possible wrong spool assigned
                </p>
                <div className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                  <p>
                    <span className="opacity-70">RFID reports:</span>{' '}
                    {mismatch.printerReports.material || 'unknown material'}
                    {mismatch.printerReports.color && (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-amber-400"
                          style={{ backgroundColor: mismatch.printerReports.color }}
                        />
                        <span className="opacity-70">{mismatch.printerReports.color}</span>
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="opacity-70">Assigned spool:</span>{' '}
                    {mismatch.spoolmanHas.material}
                    <span className="inline-flex items-center gap-1 ml-1">
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-amber-400"
                        style={{ backgroundColor: mismatch.spoolmanHas.color }}
                      />
                      <span className="opacity-70">{mismatch.spoolmanHas.color}</span>
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the correct spool below.
                </p>
              </div>
            </div>
          </div>
        )}

        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Search spools..." />
          <CommandList>
            <CommandEmpty>No spools found.</CommandEmpty>
            <CommandGroup heading="Available Spools">
              {spools.map((spool) => (
                <CommandItem
                  key={spool.id}
                  value={`${spool.id} ${spool.filament.vendor.name} ${spool.filament.material} ${spool.filament.name}`}
                  onSelect={() => {
                    onAssign(spool.id);
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 py-2"
                >
                  <div
                    className="h-6 w-6 rounded-full border flex-shrink-0"
                    style={{ backgroundColor: `#${spool.filament.color_hex}` }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {spool.filament.name || spool.filament.material}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {spool.filament.vendor.name} • {spool.filament.material} • {Math.round(spool.remaining_weight)}g
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    #{spool.id}
                  </span>
                  {assignedSpool?.id === spool.id && (
                    <Badge variant="outline" className="ml-1">Current</Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
