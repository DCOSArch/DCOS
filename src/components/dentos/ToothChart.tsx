'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToothChartData, ToothCondition, ToothData, ToothSurface } from '@/types';
import { Check, X, Edit3, RotateCcw, Sparkles, Layers } from 'lucide-react';

export const CONDITIONS: Record<
  ToothCondition,
  { label: string; color: string; border: string; bg: string; description: string }
> = {
  healthy: {
    label: 'Healthy / Intact',
    color: 'var(--foreground)',
    border: 'var(--border)',
    bg: 'var(--card)',
    description: 'No pathology detected',
  },
  cavity: {
    label: 'Carious Cavity',
    color: '#EF4444',
    border: '#DC2626',
    bg: 'rgba(239, 68, 68, 0.15)',
    description: 'Active dental caries',
  },
  filling: {
    label: 'Restoration / Filling',
    color: '#3B82F6',
    border: '#2563EB',
    bg: 'rgba(59, 130, 246, 0.15)',
    description: 'Composite or amalgam filling',
  },
  rct: {
    label: 'Root Canal (RCT)',
    color: '#A855F7',
    border: '#9333EA',
    bg: 'rgba(168, 85, 247, 0.15)',
    description: 'Endodontically treated',
  },
  crown: {
    label: 'Prosthetic Crown',
    color: '#F59E0B',
    border: '#D97706',
    bg: 'rgba(245, 158, 11, 0.15)',
    description: 'Full coverage crown (Zirconia / Ceramic / PFM)',
  },
  missing: {
    label: 'Missing / Extracted',
    color: '#9CA3AF',
    border: '#6B7280',
    bg: 'rgba(156, 163, 175, 0.2)',
    description: 'Tooth is absent',
  },
  implant: {
    label: 'Dental Implant',
    color: '#14B8A6',
    border: '#0D9488',
    bg: 'rgba(20, 184, 166, 0.15)',
    description: 'Osseointegrated fixture with abutment',
  },
  bridge: {
    label: 'Bridge Pontic/Abutment',
    color: '#F97316',
    border: '#EA580C',
    bg: 'rgba(249, 115, 22, 0.15)',
    description: 'Fixed partial denture unit',
  },
  fracture: {
    label: 'Fractured Tooth',
    color: '#DC2626',
    border: '#B91C1C',
    bg: 'rgba(220, 38, 38, 0.2)',
    description: 'Cusp or enamel/dentin fracture',
  },
  sealant: {
    label: 'Pit & Fissure Sealant',
    color: '#10B981',
    border: '#059669',
    bg: 'rgba(16, 185, 129, 0.15)',
    description: 'Preventive sealant applied',
  },
  watch: {
    label: 'Watch / Monitor',
    color: '#EAB308',
    border: '#CA8A04',
    bg: 'rgba(234, 179, 8, 0.15)',
    description: 'Incipient lesion or wear under observation',
  },
  unerupted: {
    label: 'Unerupted / Impacted',
    color: '#94A3B8',
    border: '#64748B',
    bg: 'rgba(148, 163, 184, 0.15)',
    description: 'Not yet erupted or surgically impacted',
  },
};

// FDI Notation Quadrants
const UPPER_RIGHT_FDI = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT_FDI = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT_FDI = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT_FDI = [31, 32, 33, 34, 35, 36, 37, 38];

// Mapping to Universal Numbering System (1 to 32)
const FDI_TO_UNIVERSAL: Record<number, number> = {
  18: 1, 17: 2, 16: 3, 15: 4, 14: 5, 13: 6, 12: 7, 11: 8,
  21: 9, 22: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
  38: 17, 37: 18, 36: 19, 35: 20, 34: 21, 33: 22, 32: 23, 31: 24,
  41: 25, 42: 26, 43: 27, 44: 28, 45: 29, 46: 30, 47: 31, 48: 32,
};

const ANTERIOR_TEETH = new Set([11, 12, 13, 21, 22, 23, 31, 32, 33, 41, 42, 43]);

interface ToothChartProps {
  initialData?: ToothChartData;
  onChange?: (data: ToothChartData) => void;
  readOnly?: boolean;
  selectedTeeth?: number[];
  onToothSelect?: (toothNumber: number) => void;
  title?: string;
  description?: string;
}

export function ToothChart({
  initialData = {},
  onChange,
  readOnly = false,
  selectedTeeth = [],
  onToothSelect,
  title = 'Interactive Odontogram & Dental Chart',
  description = 'Click any tooth or anatomical surface to diagnose, prescribe restorative work, or inspect status.',
}: ToothChartProps) {
  const [chartData, setChartData] = useState<ToothChartData>(initialData);
  const [system, setSystem] = useState<'FDI' | 'UNIVERSAL'>('FDI');
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [activeSurface, setActiveSurface] = useState<ToothSurface | null>(null);
  const [toothNote, setToothNote] = useState<string>('');

  const getToothName = (fdiNumber: number) => {
    const isUpper = fdiNumber < 30;
    const isRight = fdiNumber.toString().startsWith('1') || fdiNumber.toString().startsWith('4');
    const pos = fdiNumber % 10;
    const names = [
      '',
      'Central Incisor',
      'Lateral Incisor',
      'Canine / Cuspid',
      '1st Premolar / Bicuspid',
      '2nd Premolar / Bicuspid',
      '1st Molar (6-yr)',
      '2nd Molar (12-yr)',
      '3rd Molar (Wisdom)',
    ];
    return `${isUpper ? 'Maxillary' : 'Mandibular'} ${isRight ? 'Right' : 'Left'} ${names[pos] || ''}`;
  };

  const getToothDisplayNumber = (fdiNumber: number) => {
    return system === 'FDI' ? fdiNumber : FDI_TO_UNIVERSAL[fdiNumber] || fdiNumber;
  };

  const handleOpenToothModal = (fdiNumber: number, surface: ToothSurface | null = null) => {
    if (readOnly && !onToothSelect) return;
    if (onToothSelect) {
      onToothSelect(fdiNumber);
    }
    if (!readOnly) {
      setActiveTooth(fdiNumber);
      setActiveSurface(surface);
      setToothNote(chartData[fdiNumber]?.note || '');
    }
  };

  const applyCondition = (condition: ToothCondition) => {
    if (!activeTooth) return;

    const currentTooth: ToothData = chartData[activeTooth] || {
      condition: 'healthy',
      surfaces: { B: 'healthy', M: 'healthy', O: 'healthy', D: 'healthy', L: 'healthy' },
    };

    let updatedTooth: ToothData;

    if (activeSurface) {
      updatedTooth = {
        ...currentTooth,
        surfaces: {
          ...currentTooth.surfaces,
          [activeSurface]: condition,
        },
        condition: condition !== 'healthy' ? condition : currentTooth.condition,
        note: toothNote,
      };
    } else {
      updatedTooth = {
        condition,
        surfaces: {
          B: condition,
          M: condition,
          O: condition,
          D: condition,
          L: condition,
          I: condition,
        },
        note: toothNote,
      };
    }

    const nextChart = {
      ...chartData,
      [activeTooth]: updatedTooth,
    };

    setChartData(nextChart);
    onChange?.(nextChart);
    setActiveTooth(null);
    setActiveSurface(null);
  };

  const clearTooth = () => {
    if (!activeTooth) return;
    const nextChart = { ...chartData };
    delete nextChart[activeTooth];
    setChartData(nextChart);
    onChange?.(nextChart);
    setActiveTooth(null);
    setActiveSurface(null);
  };

  const renderSurfaceGrid = (fdiNumber: number) => {
    const data = chartData[fdiNumber];
    const toothCondition = data?.condition || 'healthy';
    const isMissing = toothCondition === 'missing';
    const isCrown = toothCondition === 'crown';
    const isImplant = toothCondition === 'implant';
    const isRCT = toothCondition === 'rct';
    const isAnterior = ANTERIOR_TEETH.has(fdiNumber);
    const occlusalSurfaceKey = isAnterior ? 'I' : 'O';

    const getSurfaceColor = (surf: ToothSurface) => {
      const cond = data?.surfaces?.[surf] || data?.condition || 'healthy';
      return CONDITIONS[cond]?.color || 'var(--foreground)';
    };

    const getSurfaceBg = (surf: ToothSurface) => {
      const cond = data?.surfaces?.[surf] || data?.condition || 'healthy';
      return CONDITIONS[cond]?.bg || 'var(--card)';
    };

    const isSelected = selectedTeeth.includes(fdiNumber) || activeTooth === fdiNumber;

    return (
      <div
        key={fdiNumber}
        className={`group relative flex flex-col items-center p-1 rounded-lg transition-all duration-200 ${
          isSelected
            ? 'ring-2 ring-primary bg-primary/10 scale-105'
            : 'hover:bg-muted/60 hover:scale-105'
        } ${!readOnly ? 'cursor-pointer' : ''}`}
        onClick={() => handleOpenToothModal(fdiNumber, null)}
      >
        {/* Tooth Number Label */}
        <span className="text-[11px] font-mono font-bold text-muted-foreground group-hover:text-foreground mb-1">
          {getToothDisplayNumber(fdiNumber)}
        </span>

        {/* 5-Surface Odontogram Box */}
        <div
          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-md border ${
            isCrown ? 'border-amber-500 ring-2 ring-amber-500/40' : 'border-border'
          } bg-card overflow-hidden shadow-xs`}
        >
          {isMissing ? (
            <div className="absolute inset-0 bg-muted flex items-center justify-center text-muted-foreground font-bold text-base">
              ✕
            </div>
          ) : isImplant ? (
            <div className="absolute inset-0 bg-teal-500/15 border border-teal-500 flex flex-col items-center justify-center text-teal-600 dark:text-teal-400 text-[10px] font-bold">
              <span>🔩</span>
              <span className="text-[8px]">IMP</span>
            </div>
          ) : (
            <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px] p-[1px] bg-border/40">
              {/* Buccal / Facial (Top Center) */}
              <div
                title="Buccal / Facial surface"
                className="col-start-2 row-start-1 rounded-t-[2px] transition-colors hover:brightness-110"
                style={{ backgroundColor: getSurfaceBg('B') }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenToothModal(fdiNumber, 'B');
                }}
              />

              {/* Mesial (Left Center) */}
              <div
                title="Mesial surface"
                className="col-start-1 row-start-2 rounded-l-[2px] transition-colors hover:brightness-110"
                style={{ backgroundColor: getSurfaceBg('M') }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenToothModal(fdiNumber, 'M');
                }}
              />

              {/* Occlusal / Incisal (Center) */}
              <div
                title={`${isAnterior ? 'Incisal' : 'Occlusal'} surface`}
                className="col-start-2 row-start-2 transition-colors hover:brightness-110 flex items-center justify-center text-[7px] font-bold font-mono"
                style={{
                  backgroundColor: getSurfaceBg(occlusalSurfaceKey as ToothSurface),
                  color: getSurfaceColor(occlusalSurfaceKey as ToothSurface),
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenToothModal(fdiNumber, occlusalSurfaceKey as ToothSurface);
                }}
              >
                {isRCT ? '⚡' : isAnterior ? 'I' : 'O'}
              </div>

              {/* Distal (Right Center) */}
              <div
                title="Distal surface"
                className="col-start-3 row-start-2 rounded-r-[2px] transition-colors hover:brightness-110"
                style={{ backgroundColor: getSurfaceBg('D') }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenToothModal(fdiNumber, 'D');
                }}
              />

              {/* Lingual / Palatal (Bottom Center) */}
              <div
                title="Lingual / Palatal surface"
                className="col-start-2 row-start-3 rounded-b-[2px] transition-colors hover:brightness-110"
                style={{ backgroundColor: getSurfaceBg('L') }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenToothModal(fdiNumber, 'L');
                }}
              />
            </div>
          )}
        </div>

        {/* Condition Indicator Pip */}
        {toothCondition !== 'healthy' && (
          <span
            className="w-1.5 h-1.5 rounded-full mt-1"
            style={{ backgroundColor: CONDITIONS[toothCondition]?.color || 'var(--primary)' }}
            title={CONDITIONS[toothCondition]?.label}
          />
        )}
      </div>
    );
  };

  return (
    <Card className="w-full border-border bg-card text-card-foreground shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Layers className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            {description}
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {/* Notation Toggle */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSystem('FDI')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                system === 'FDI'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              FDI (11-48)
            </button>
            <button
              type="button"
              onClick={() => setSystem('UNIVERSAL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                system === 'UNIVERSAL'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Universal (1-32)
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Upper Arch (Maxilla) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span>Upper Right (Q1)</span>
            <span className="text-muted-foreground font-mono text-[10px]">MAXILLARY ARCH</span>
            <span>Upper Left (Q2)</span>
          </div>
          <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border overflow-x-auto">
            {/* Upper Right (18 to 11) */}
            <div className="flex items-center gap-1">
              {UPPER_RIGHT_FDI.map(renderSurfaceGrid)}
            </div>

            {/* Midline Divider */}
            <div className="h-10 w-[2px] bg-primary/40 mx-1.5 rounded-full" />

            {/* Upper Left (21 to 28) */}
            <div className="flex items-center gap-1">
              {UPPER_LEFT_FDI.map(renderSurfaceGrid)}
            </div>
          </div>
        </div>

        {/* Lower Arch (Mandible) */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-muted/20 border border-border overflow-x-auto">
            {/* Lower Right (48 to 41) */}
            <div className="flex items-center gap-1">
              {LOWER_RIGHT_FDI.map(renderSurfaceGrid)}
            </div>

            {/* Midline Divider */}
            <div className="h-10 w-[2px] bg-primary/40 mx-1.5 rounded-full" />

            {/* Lower Left (31 to 38) */}
            <div className="flex items-center gap-1">
              {LOWER_LEFT_FDI.map(renderSurfaceGrid)}
            </div>
          </div>
          <div className="flex justify-between items-center px-2 text-xs font-bold uppercase tracking-wider text-primary">
            <span>Lower Right (Q4)</span>
            <span className="text-muted-foreground font-mono text-[10px]">MANDIBULAR ARCH</span>
            <span>Lower Left (Q3)</span>
          </div>
        </div>

        {/* Condition Legends Bar */}
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Clinical Conditions Legend:
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONDITIONS).map(([key, info]) => (
              <span
                key={key}
                className="text-[11px] font-medium py-0.5 px-2 rounded-md flex items-center gap-1.5 border border-border/80 bg-card text-foreground"
              >
                <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: info.color }} />
                {info.label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Condition Selection Dialog / Drawer */}
      {activeTooth && !readOnly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-card-foreground">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Diagnose Tooth #{getToothDisplayNumber(activeTooth)}
                </h3>
                <p className="text-xs text-primary font-medium mt-0.5">{getToothName(activeTooth)}</p>
                {activeSurface && (
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    Targeting Surface: {activeSurface} (
                    {activeSurface === 'B'
                      ? 'Buccal'
                      : activeSurface === 'M'
                      ? 'Mesial'
                      : activeSurface === 'D'
                      ? 'Distal'
                      : activeSurface === 'L'
                      ? 'Lingual'
                      : 'Occlusal/Incisal'}
                    )
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActiveTooth(null);
                  setActiveSurface(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Condition Picker Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Select Diagnosis / Condition
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(CONDITIONS).map(([key, info]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyCondition(key as ToothCondition)}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-border hover:border-primary text-left transition-all hover:scale-[1.02] active:scale-95 bg-muted/30"
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                      {info.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{info.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tooth Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Clinical Notes / Remarks
              </label>
              <input
                type="text"
                value={toothNote}
                onChange={(e) => setToothNote(e.target.value)}
                placeholder="e.g., Deep mesial pocket, cold sensitivity, shade A2 required"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="destructive"
                size="sm"
                onClick={clearTooth}
                className="text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear Status
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTooth(null);
                    setActiveSurface(null);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyCondition(chartData[activeTooth]?.condition || 'healthy')}
                  className="bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save Note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
