'use client';

import { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SpoolFilterBar } from '@/components/dashboard/spool-filter-bar';
import { Printer, QrCode, Settings2 } from 'lucide-react';
import type { Spool } from '@/lib/api/spoolman';
import { buildSpoolSearchValue, parseExtraValue } from '@/lib/api/spoolman';

interface QRCodeGeneratorProps {
  spools: Spool[];
}

interface FilterField {
  key: string;
  name: string;
  values: string[];
  builtIn: boolean;
}

interface LabelSettings {
  showVendor: boolean;
  showName: boolean;
  showMaterial: boolean;
  showSpoolId: boolean;
  showColor: boolean;
  fontSize: 'small' | 'medium' | 'large';
  showBorder: boolean;
  borderStyle: 'solid' | 'dashed' | 'dotted';
  marginMm: number;
}

const FONT_SIZES = {
  small: { title: 10, subtitle: 8, scale: 0.8 },
  medium: { title: 12, subtitle: 10, scale: 1 },
  large: { title: 14, subtitle: 12, scale: 1.2 },
};

function getSpoolFieldValue(spool: Spool, fieldKey: string): string | null {
  switch (fieldKey) {
    case 'material':
      return spool.filament.material || null;
    case 'vendor':
      return spool.filament.vendor?.name || null;
    case 'location':
      return spool.location || null;
    case 'lot_nr':
      return spool.lot_nr || null;
    default:
      if (fieldKey.startsWith('extra_')) {
        const extraKey = fieldKey.replace('extra_', '');
        return parseExtraValue(spool.extra?.[extraKey]) || null;
      }
      return null;
  }
}

export function QRCodeGenerator({ spools }: QRCodeGeneratorProps) {
  const [selectedSpool, setSelectedSpool] = useState<Spool | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | null>>({});
  const [enabledFields, setEnabledFields] = useState<FilterField[]>([]);
  const [labelSettings, setLabelSettings] = useState<LabelSettings>({
    showVendor: true,
    showName: true,
    showMaterial: true,
    showSpoolId: true,
    showColor: true,
    fontSize: 'medium',
    showBorder: true,
    borderStyle: 'dashed',
    marginMm: 2,
  });

  // Fetch filter fields on mount
  useEffect(() => {
    fetch('/api/spools/extra-fields')
      .then((res) => res.json())
      .then((data) => {
        if (data.fields && data.filterConfig) {
          const enabled = data.fields.filter(
            (f: FilterField) => data.filterConfig.includes(f.key)
          );
          setEnabledFields(enabled);
        }
      })
      .catch((err) => console.error('Failed to fetch filter fields:', err));
  }, []);

  // Filter spools based on active filters
  const filteredSpools = useMemo(() => {
    return spools.filter((spool) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          const spoolValue = getSpoolFieldValue(spool, key);
          if (spoolValue !== value) return false;
        }
      }
      return true;
    });
  }, [spools, filters]);

  const qrUrl = selectedSpool
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/scan/spool/${selectedSpool.id}`
    : null;

  const handlePrint = () => {
    window.print();
  };

  const handleSpoolSelect = (spool: Spool) => {
    setSelectedSpool(spool);
    setSearchValue('');
  };

  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const fontSize = FONT_SIZES[labelSettings.fontSize];

  return (
    <div className="space-y-4">
      {/* Filters */}
      {enabledFields.length > 0 && (
        <SpoolFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
          fields={enabledFields}
        />
      )}

      {/* Spool Selector */}
      <Command className="rounded-lg border">
        <CommandInput
          placeholder="Search spools by name, vendor, material, or ID..."
          value={searchValue}
          onValueChange={setSearchValue}
        />
        <CommandList className="max-h-[200px]">
          <CommandEmpty>No spools found.</CommandEmpty>
          <CommandGroup heading={`${filteredSpools.length} spools`}>
            {filteredSpools.map((spool) => (
              <CommandItem
                key={spool.id}
                value={buildSpoolSearchValue(spool)}
                onSelect={() => handleSpoolSelect(spool)}
                className="flex items-center gap-3 py-2 cursor-pointer"
              >
                <div
                  className="h-5 w-5 rounded-full border flex-shrink-0"
                  style={{ backgroundColor: `#${spool.filament.color_hex}` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {spool.filament.name || spool.filament.material}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {spool.filament.vendor.name} • #{spool.id}
                  </p>
                </div>
                <Badge variant="secondary" className="flex-shrink-0">
                  {spool.filament.material}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {/* QR Code Display */}
      {selectedSpool && qrUrl && (
        <div className="space-y-4">
          {/* Label Settings Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="w-full no-print"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {showSettings ? 'Hide' : 'Show'} Label Settings
          </Button>

          {/* Label Settings Panel */}
          {showSettings && (
            <div className="border rounded-lg p-4 space-y-4 no-print bg-muted/50 flex flex-col items-center">
              <div className="grid grid-cols-3 gap-4">
                {/* Font Size */}
                <div className="space-y-2">
                  <Label className="text-center block">Font Size</Label>
                  <Select
                    value={labelSettings.fontSize}
                    onValueChange={(v) => setLabelSettings((s) => ({ ...s, fontSize: v as LabelSettings['fontSize'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Border Style */}
                <div className="space-y-2">
                  <Label className="text-center block">Border</Label>
                  <Select
                    value={labelSettings.showBorder ? labelSettings.borderStyle : 'none'}
                    onValueChange={(v) => {
                      if (v === 'none') {
                        setLabelSettings((s) => ({ ...s, showBorder: false }));
                      } else {
                        setLabelSettings((s) => ({ ...s, showBorder: true, borderStyle: v as LabelSettings['borderStyle'] }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Margin */}
                <div className="space-y-2">
                  <Label className="text-center block">Margin (mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={labelSettings.marginMm}
                    onChange={(e) => setLabelSettings((s) => ({ ...s, marginMm: Math.max(0, Math.min(20, parseInt(e.target.value) || 0)) }))}
                    className="text-center"
                  />
                </div>
              </div>

              {/* Content Toggles */}
              <div className="space-y-2">
                <Label className="text-center block">Label Content</Label>
                {/* Row 1: 3 checkboxes */}
                <div className="flex justify-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showVendor"
                      checked={labelSettings.showVendor}
                      onCheckedChange={(c) => setLabelSettings((s) => ({ ...s, showVendor: !!c }))}
                    />
                    <label htmlFor="showVendor" className="text-sm">Vendor</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showName"
                      checked={labelSettings.showName}
                      onCheckedChange={(c) => setLabelSettings((s) => ({ ...s, showName: !!c }))}
                    />
                    <label htmlFor="showName" className="text-sm">Filament Name</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showMaterial"
                      checked={labelSettings.showMaterial}
                      onCheckedChange={(c) => setLabelSettings((s) => ({ ...s, showMaterial: !!c }))}
                    />
                    <label htmlFor="showMaterial" className="text-sm">Material</label>
                  </div>
                </div>
                {/* Row 2: 2 checkboxes centered */}
                <div className="flex justify-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showSpoolId"
                      checked={labelSettings.showSpoolId}
                      onCheckedChange={(c) => setLabelSettings((s) => ({ ...s, showSpoolId: !!c }))}
                    />
                    <label htmlFor="showSpoolId" className="text-sm">Spool ID</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showColor"
                      checked={labelSettings.showColor}
                      onCheckedChange={(c) => setLabelSettings((s) => ({ ...s, showColor: !!c }))}
                    />
                    <label htmlFor="showColor" className="text-sm">Color Dot</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Label Preview */}
          <div className="flex justify-center">
            <div
              className="qr-label-printable bg-white flex items-center gap-3 p-2"
              style={{
                width: 220,
                height: 100,
                borderWidth: labelSettings.showBorder ? 2 : 0,
                borderStyle: labelSettings.showBorder ? labelSettings.borderStyle : 'none',
                borderColor: labelSettings.showBorder ? '#000000' : 'transparent',
                // Pass margin and font scale to CSS for print
                ['--print-margin' as string]: `${labelSettings.marginMm}mm`,
                ['--font-scale' as string]: fontSize.scale,
              }}
            >
              {/* QR Code */}
              <QRCodeSVG
                value={qrUrl}
                size={80}
                level="M"
                className="flex-shrink-0 qr-code-svg"
              />

              {/* Label Text */}
              <div className="flex-1 min-w-0 overflow-hidden text-black">
                {labelSettings.showVendor && (
                  <p
                    className="label-text-vendor font-semibold truncate leading-tight"
                    style={{ fontSize: fontSize.title }}
                  >
                    {selectedSpool.filament.vendor.name}
                  </p>
                )}
                {labelSettings.showName && selectedSpool.filament.name && (
                  <p
                    className="label-text-name truncate leading-tight"
                    style={{ fontSize: fontSize.subtitle }}
                  >
                    {selectedSpool.filament.name}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {labelSettings.showColor && (
                    <div
                      className="label-color-dot rounded-full border border-black flex-shrink-0"
                      style={{
                        width: fontSize.subtitle,
                        height: fontSize.subtitle,
                        backgroundColor: `#${selectedSpool.filament.color_hex}`,
                      }}
                    />
                  )}
                  {labelSettings.showMaterial && (
                    <span
                      className="label-text-material truncate"
                      style={{ fontSize: fontSize.subtitle }}
                    >
                      {selectedSpool.filament.material}
                    </span>
                  )}
                </div>
                {labelSettings.showSpoolId && (
                  <p
                    className="label-text-id text-black leading-tight"
                    style={{ fontSize: fontSize.subtitle }}
                  >
                    #{selectedSpool.id}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Print Label
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedSpool(null)}
            >
              Clear
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center no-print">
            Scan this QR code with your phone camera to quickly assign this spool to an AMS tray.
          </p>
          <p className="text-xs text-muted-foreground/70 text-center no-print font-mono break-all">
            {qrUrl}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!selectedSpool && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <QrCode className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Select a spool above to generate a QR code label</p>
        </div>
      )}
    </div>
  );
}
