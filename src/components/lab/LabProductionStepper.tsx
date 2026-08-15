'use client';

import React from 'react';
import { 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Flame, 
  CheckSquare, 
  Truck, 
  ChevronRight, 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CaseStatus } from '@/types';

export interface ProductionStage {
  id: CaseStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  leadTimeHours: number;
}

export const PRODUCTION_STAGES: ProductionStage[] = [
  {
    id: 'PENDING',
    label: 'Intake & File Verification',
    shortLabel: 'Intake',
    icon: Layers,
    description: 'Verify 3D prep scans, margin integrity & RX notes',
    leadTimeHours: 2,
  },
  {
    id: 'IN_PROGRESS',
    label: 'CAD Modeling & Morpho',
    shortLabel: 'CAD',
    icon: Cpu,
    description: 'Design crown anatomy, cement gap & contact points',
    leadTimeHours: 6,
  },
  {
    id: 'IN_PROGRESS',
    label: 'CAM Milling & Sintering',
    shortLabel: 'CAM & Sinter',
    icon: Flame,
    description: '5-axis dry milling & 1500°C furnace sintering',
    leadTimeHours: 12,
  },
  {
    id: 'QUALITY_CHECK',
    label: 'Ceramic Glaze & QC Fit',
    shortLabel: 'QC Fit',
    icon: CheckSquare,
    description: 'VITA 3D Master staining, margin seal & microscope QC',
    leadTimeHours: 4,
  },
  {
    id: 'DISPATCHED',
    label: 'Dispatched & Logistics',
    shortLabel: 'Dispatched',
    icon: Truck,
    description: 'Secure packaging, tamper-proof seal & courier pickup',
    leadTimeHours: 1,
  },
  {
    id: 'DELIVERED',
    label: 'Delivered to Clinic',
    shortLabel: 'Delivered',
    icon: CheckCircle2,
    description: 'Received by clinic chairside operatory',
    leadTimeHours: 0,
  }
];

const STAGE_ORDER: CaseStatus[] = ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED'];

interface LabProductionStepperProps {
  currentStatus: CaseStatus;
  onAdvanceStage?: (nextStatus: CaseStatus) => void;
  isReadOnly?: boolean;
}

export function LabProductionStepper({
  currentStatus,
  onAdvanceStage,
  isReadOnly = false,
}: LabProductionStepperProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStatus);
  const normalizedIndex = currentIndex === -1 ? 0 : currentIndex;
  const isCompleted = currentStatus === 'DELIVERED';
  const nextStatus = STAGE_ORDER[Math.min(normalizedIndex + 1, STAGE_ORDER.length - 1)];

  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Lab Production Stage
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h4 className="text-sm font-extrabold text-foreground">
              {currentStatus === 'PENDING' && 'Case Ingestion & Intake'}
              {currentStatus === 'IN_PROGRESS' && 'CAD/CAM Manufacturing'}
              {currentStatus === 'QUALITY_CHECK' && 'Microscope QC & Glazing'}
              {currentStatus === 'DISPATCHED' && 'Dispatched / In Transit'}
              {currentStatus === 'DELIVERED' && 'Completed & Delivered'}
            </h4>
            <Badge 
              variant="outline"
              className="text-[9px] font-mono font-bold uppercase px-1.5 py-0 border-primary/40 text-primary"
            >
              Stage {normalizedIndex + 1} of {STAGE_ORDER.length}
            </Badge>
          </div>
        </div>

        {!isReadOnly && !isCompleted && onAdvanceStage && (
          <Button
            size="sm"
            onClick={() => onAdvanceStage(nextStatus)}
            className="h-8 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-98"
          >
            <span>Advance to {nextStatus.replace('_', ' ')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Interactive Stepper Track */}
      <div className="relative pt-2 pb-1">
        {/* Track Line */}
        <div className="absolute top-4.5 left-4 right-4 h-0.5 bg-muted z-0">
          <div 
            className="h-full bg-gradient-to-r from-primary via-teal-400 to-emerald-400 transition-all duration-500 ease-out"
            style={{ width: `${(normalizedIndex / (STAGE_ORDER.length - 1)) * 100}%` }}
          />
        </div>

        {/* Stage Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {STAGE_ORDER.map((stageId, idx) => {
            const isDone = idx < normalizedIndex || isCompleted;
            const isCurrent = idx === normalizedIndex && !isCompleted;

            return (
              <div 
                key={stageId} 
                className="flex flex-col items-center group cursor-pointer" 
                onClick={() => !isReadOnly && onAdvanceStage?.(stageId)}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 shadow-sm'
                      : isCurrent
                      ? 'bg-primary/20 border-2 border-primary text-primary ring-4 ring-primary/20 scale-110 shadow-lg shadow-primary/20 animate-pulse'
                      : 'bg-muted/60 border-2 border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="text-xs font-mono font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors ${
                  isCurrent ? 'text-primary' : isDone ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {stageId === 'PENDING' && 'Intake'}
                  {stageId === 'IN_PROGRESS' && 'Production'}
                  {stageId === 'QUALITY_CHECK' && 'QC Fit'}
                  {stageId === 'DISPATCHED' && 'Transit'}
                  {stageId === 'DELIVERED' && 'Delivered'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
