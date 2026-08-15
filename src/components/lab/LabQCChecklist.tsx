'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Microscope,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface QCItem {
  id: string;
  title: string;
  category: 'MARGIN' | 'OCCLUSION' | 'SHADE' | 'STRUCTURE' | 'FINISH';
  description: string;
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'PENDING';
  measuredValue?: string;
  tolerance?: string;
}

const DEFAULT_QC_ITEMS: QCItem[] = [
  {
    id: 'qc-1',
    title: 'Marginal Seal & Finish Line Fit',
    category: 'MARGIN',
    description: '360° subgingival die seating under 10x microscope inspection with zero ledge.',
    status: 'PASSED',
    measuredValue: '18 μm',
    tolerance: '< 25 μm',
  },
  {
    id: 'qc-2',
    title: 'Occlusal Clearance & Centric Stops',
    category: 'OCCLUSION',
    description: 'Shimstock holding foil test (8 μm) with proper canine guidance and zero prematurity.',
    status: 'PASSED',
    measuredValue: '1.6 mm clearance',
    tolerance: '> 1.5 mm',
  },
  {
    id: 'qc-3',
    title: 'Interproximal Contact Pressure',
    category: 'OCCLUSION',
    description: 'Floss drag test on mesial and distal contact points with anatomically correct embrasure.',
    status: 'PASSED',
    measuredValue: 'Firm snap',
    tolerance: 'Passive/Firm',
  },
  {
    id: 'qc-4',
    title: 'VITA 3D-Master / Classical Shade Match',
    category: 'SHADE',
    description: 'Cervical, body, and incisal translucency gradient matching shade photos under 5500K daylight.',
    status: 'PASSED',
    measuredValue: 'VITA A2 / Incisal Translucency',
    tolerance: 'ΔE < 1.2',
  },
  {
    id: 'qc-5',
    title: 'Sintering Density & Surface Polish',
    category: 'STRUCTURE',
    description: 'Full sintering cycle completion, zero micro-fractures, mirror high-gloss ceramic glaze.',
    status: 'PASSED',
    measuredValue: '6.08 g/cm³',
    tolerance: 'Theoretical density > 99.5%',
  }
];

interface LabQCChecklistProps {
  caseId: string;
  technicianName?: string;
  onQCPassed?: () => void;
}

export function LabQCChecklist({
  caseId,
  technicianName = 'Senior Master Ceramist',
  onQCPassed,
}: LabQCChecklistProps) {
  const [items, setItems] = useState<QCItem[]>(DEFAULT_QC_ITEMS);
  const [isCertified, setIsCertified] = useState(false);

  const toggleItemStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus: QCItem['status'] = 
          item.status === 'PASSED' ? 'WARNING' :
          item.status === 'WARNING' ? 'FAILED' :
          item.status === 'FAILED' ? 'PENDING' : 'PASSED';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const allPassed = items.every(i => i.status === 'PASSED');
  const failedCount = items.filter(i => i.status === 'FAILED').length;

  const handleCertify = () => {
    setIsCertified(true);
    toast.success(`Case #${caseId.slice(-6).toUpperCase()} QC Certified by ${technicianName}`);
    onQCPassed?.();
  };

  return (
    <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
            <Microscope className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
              Microscope QC & Fit Verification
              {allPassed && (
                <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-400 bg-emerald-950/20 font-bold">
                  All 5 Passed
                </Badge>
              )}
            </h4>
            <p className="text-[11px] text-muted-foreground">Digital inspection protocol before clinic dispatch</p>
          </div>
        </div>

        <Button
          size="sm"
          variant={allPassed ? 'default' : 'secondary'}
          disabled={failedCount > 0 || isCertified}
          onClick={handleCertify}
          className="h-8 px-3 rounded-xl text-xs font-bold"
        >
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
          {isCertified ? 'QC Certified' : 'Certify Inspection'}
        </Button>
      </div>

      {/* QC Criteria List */}
      <div className="grid gap-2">
        {items.map(item => {
          return (
            <div
              key={item.id}
              onClick={() => toggleItemStatus(item.id)}
              className="p-2.5 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/60 flex items-start justify-between gap-3 cursor-pointer transition-all hover:scale-[1.005]"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground truncate">{item.title}</span>
                  {item.measuredValue && (
                    <Badge variant="outline" className="text-[9px] font-mono border-border px-1.5 py-0">
                      {item.measuredValue}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {item.status === 'PASSED' && (
                  <Badge className="bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pass
                  </Badge>
                )}
                {item.status === 'WARNING' && (
                  <Badge className="bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold text-[10px] gap-1">
                    <AlertTriangle className="w-3 h-3" /> Review
                  </Badge>
                )}
                {item.status === 'FAILED' && (
                  <Badge className="bg-red-500/15 border-red-500/40 text-red-400 font-bold text-[10px] gap-1">
                    <XCircle className="w-3 h-3" /> Remake
                  </Badge>
                )}
                {item.status === 'PENDING' && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
