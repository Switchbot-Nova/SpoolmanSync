'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TraySlot } from './tray-slot';
import type { HATray } from '@/lib/api/homeassistant';
import type { Spool } from '@/lib/api/spoolman';
import { extractPrinterPrefix } from '@/lib/entity-patterns';

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

interface TrayWithSpool extends HATray {
  assigned_spool?: Spool;
  mismatch?: MismatchInfo;
}

interface AMSWithSpools {
  entity_id: string;
  name: string;
  trays: TrayWithSpool[];
}

interface PrinterWithSpools {
  entity_id: string;
  name: string;
  state: string;
  ams_units: AMSWithSpools[];
  external_spool?: TrayWithSpool;
}

interface PrinterCardProps {
  printer: PrinterWithSpools;
  spools: Spool[];
  onSpoolAssign: (trayId: string, spoolId: number) => void;
  onSpoolUnassign: (spoolId: number) => void;
}

export function PrinterCard({ printer, spools, onSpoolAssign, onSpoolUnassign }: PrinterCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          {printer.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {printer.ams_units.map((ams) => (
          <div key={ams.entity_id} className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {ams.name}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ams.trays.map((tray) => (
                <TraySlot
                  key={tray.entity_id}
                  tray={tray}
                  assignedSpool={tray.assigned_spool}
                  spools={spools}
                  onAssign={(spoolId) => onSpoolAssign(tray.entity_id, spoolId)}
                  onUnassign={onSpoolUnassign}
                  mismatch={tray.mismatch}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Always show external spool slot */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            External Spool
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <TraySlot
              tray={printer.external_spool || {
                // Use centralized pattern extraction for external spool fallback
                entity_id: `sensor.${extractPrinterPrefix(printer.entity_id)}_external_spool`,
                tray_number: 0,
              }}
              assignedSpool={printer.external_spool?.assigned_spool}
              spools={spools}
              onAssign={(spoolId) => {
                const extEntityId = printer.external_spool?.entity_id ||
                  `sensor.${extractPrinterPrefix(printer.entity_id)}_external_spool`;
                onSpoolAssign(extEntityId, spoolId);
              }}
              onUnassign={onSpoolUnassign}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
