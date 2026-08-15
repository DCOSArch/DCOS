'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  Download, 
  Copy, 
  Check,
  Award,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface LabWarrantyCardProps {
  caseId: string;
  patientName: string;
  doctorName?: string;
  material?: string;
  shade?: string;
  selectedTeeth?: number[];
  labName?: string;
  warrantyYears?: number;
}

export function LabWarrantyCard({
  caseId,
  patientName,
  doctorName = 'Dr. Lead Practitioner',
  material = 'Multi-Layered Translucent Zirconia (5Y-PSZ)',
  shade = 'VITA Classical A2',
  selectedTeeth = [16],
  labName = 'Apex Dental CAD/CAM Center',
  warrantyYears = 5,
}: LabWarrantyCardProps) {
  const [copied, setCopied] = useState(false);
  const tokenHash = `WARR-${caseId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenHash);
    setCopied(true);
    toast.success('Warranty Token copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 shadow-xl text-white space-y-4">
      {/* Subtle Holographic Radial Sheen */}
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-primary/30 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
              Authenticity & Warranty Card
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">{labName}</span>
          </div>
        </div>

        <Badge className="bg-primary/20 border-primary/50 text-primary font-mono text-[10px] px-2 py-0.5">
          {warrantyYears}-Year Remake Guarantee
        </Badge>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-2 gap-2 text-xs relative z-10">
        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[9px] font-bold uppercase text-slate-400 block">Patient / Case</span>
          <p className="font-bold text-slate-200 truncate mt-0.5">{patientName}</p>
          <span className="text-[9px] font-mono text-slate-400">#{caseId.slice(-8).toUpperCase()}</span>
        </div>

        <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[9px] font-bold uppercase text-slate-400 block">Restoration & Teeth</span>
          <p className="font-bold text-primary truncate mt-0.5">
            Teeth: {selectedTeeth.map(t => `#${t}`).join(', ') || '#16'}
          </p>
          <span className="text-[9px] text-slate-400 truncate block">{shade}</span>
        </div>
      </div>

      <div className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-300">
        <span className="text-[9px] font-bold uppercase text-slate-400 block">Material Grade</span>
        <span className="font-medium text-slate-200">{material}</span>
      </div>

      {/* Token & QR Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-primary shrink-0" />
          <span className="text-[10px] text-slate-400 truncate">{tokenHash}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCopy}
          className="w-6 h-6 rounded-md hover:bg-slate-800 text-slate-300"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}
