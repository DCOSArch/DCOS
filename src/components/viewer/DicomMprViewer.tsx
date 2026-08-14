'use client';

import React, { useState } from 'react';
import {
  Scan,
  Layers,
  Activity,
  Sliders,
  Sparkles,
  Eye,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface HounsfieldPreset {
  name: string;
  windowWidth: number;
  windowCenter: number;
  description: string;
}

export const HOUNSFIELD_PRESETS: HounsfieldPreset[] = [
  { name: 'Bone', windowWidth: 2000, windowCenter: 500, description: 'Cortical & Trabecular Architecture' },
  { name: 'Soft Tissue', windowWidth: 400, windowCenter: 40, description: 'Gingiva & Mucosal Tissue' },
  { name: 'Enamel / Dentin', windowWidth: 4000, windowCenter: 1200, description: 'High-Density Tooth Crown & Pulp' },
];

export function DicomMprViewer() {
  const [selectedPreset, setSelectedPreset] = useState<HounsfieldPreset>(HOUNSFIELD_PRESETS[0]);
  const [axialSlice, setAxialSlice] = useState(128);
  const [coronalSlice, setCoronalSlice] = useState(128);
  const [sagittalSlice, setSagittalSlice] = useState(128);
  const [showNerveCanal, setShowNerveCanal] = useState(true);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Multi-Planar CBCT / DICOM Slice Viewer (MPR)
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                Tri-Planar
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Maxillofacial Volume Reconstruction • Hounsfield Window: {selectedPreset.name} (W: {selectedPreset.windowWidth}, C: {selectedPreset.windowCenter})
            </p>
          </div>
        </div>

        {/* Hounsfield Window Presets */}
        <div className="flex items-center gap-2">
          {HOUNSFIELD_PRESETS.map((preset) => (
            <Button
              key={preset.name}
              size="sm"
              variant={selectedPreset.name === preset.name ? 'default' : 'outline'}
              onClick={() => setSelectedPreset(preset)}
              className="text-xs h-7 px-3 font-semibold"
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tri-Planar Viewports Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-950">
        {/* 1. AXIAL VIEW */}
        <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 space-y-3">
          <div className="flex justify-between items-center text-xs text-neutral-300">
            <span className="font-bold text-emerald-400">Axial (Transverse)</span>
            <span className="font-mono text-[10px]">Slice: {axialSlice} / 256</span>
          </div>

          <div className="w-full aspect-square bg-black rounded-lg border border-neutral-800 relative flex items-center justify-center overflow-hidden">
            {/* Simulated CBCT Axial Cross Section */}
            <div className="w-3/4 h-3/4 rounded-full border-2 border-neutral-700/60 flex items-center justify-center relative">
              <div className="w-1/2 h-1/2 border border-dashed border-emerald-500/40 rounded-full" />
              {/* Crosshair */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/30" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/30" />
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={256}
            value={axialSlice}
            onChange={(e) => setAxialSlice(parseInt(e.target.value, 10))}
            aria-label="Axial Slice Index"
            className="w-full accent-emerald-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* 2. CORONAL VIEW */}
        <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 space-y-3">
          <div className="flex justify-between items-center text-xs text-neutral-300">
            <span className="font-bold text-sky-400">Coronal (Frontal)</span>
            <span className="font-mono text-[10px]">Slice: {coronalSlice} / 256</span>
          </div>

          <div className="w-full aspect-square bg-black rounded-lg border border-neutral-800 relative flex items-center justify-center overflow-hidden">
            {/* Simulated CBCT Coronal Cross Section */}
            <div className="w-4/5 h-3/5 rounded-t-3xl border-2 border-neutral-700/60 flex items-center justify-center relative">
              {/* Inferior Alveolar Nerve Spline Overlay */}
              {showNerveCanal && (
                <div className="absolute bottom-2 w-3/4 h-2 border-b-2 border-amber-400 rounded-full animate-pulse" />
              )}
              {/* Crosshair */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-sky-500/30" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-sky-500/30" />
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={256}
            value={coronalSlice}
            onChange={(e) => setCoronalSlice(parseInt(e.target.value, 10))}
            aria-label="Coronal Slice Index"
            className="w-full accent-sky-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* 3. SAGITTAL VIEW */}
        <div className="border border-neutral-800 rounded-xl p-3 bg-neutral-900/60 space-y-3">
          <div className="flex justify-between items-center text-xs text-neutral-300">
            <span className="font-bold text-purple-400">Sagittal (Profile)</span>
            <span className="font-mono text-[10px]">Slice: {sagittalSlice} / 256</span>
          </div>

          <div className="w-full aspect-square bg-black rounded-lg border border-neutral-800 relative flex items-center justify-center overflow-hidden">
            {/* Simulated CBCT Sagittal Cross Section */}
            <div className="w-3/5 h-4/5 rounded-r-3xl border-2 border-neutral-700/60 flex items-center justify-center relative">
              {showNerveCanal && (
                <div className="absolute bottom-4 left-2 w-3/4 h-3 border-b-2 border-amber-400 rounded-full" />
              )}
              {/* Crosshair */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-purple-500/30" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-purple-500/30" />
            </div>
          </div>

          <input
            type="range"
            min={1}
            max={256}
            value={sagittalSlice}
            onChange={(e) => setSagittalSlice(parseInt(e.target.value, 10))}
            aria-label="Sagittal Slice Index"
            className="w-full accent-purple-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Footer Tools */}
      <div className="p-4 border-t border-border bg-muted/20 flex justify-between items-center">
        <Button
          size="sm"
          variant={showNerveCanal ? 'default' : 'outline'}
          onClick={() => setShowNerveCanal(!showNerveCanal)}
          className="text-xs h-7 gap-1.5 font-semibold"
        >
          <Eye className="w-3.5 h-3.5" /> Inferior Alveolar Nerve (IAN) Canal Tracing
        </Button>

        <span className="text-[11px] text-muted-foreground font-mono">
          16-bit DICOM Grayscale Rendering • Pixel Spacing: 0.125mm
        </span>
      </div>
    </div>
  );
}
