'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Activity,
  Eye,
  Maximize2,
  Minimize2,
  Sparkles,
  Zap,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MeshDecimator, DecimatedLODMesh } from '@/lib/cad/mesh-decimator';
import { OcclusalClearanceCalculator, OCCLUSAL_CLEARANCE_PRESETS } from '@/lib/cad/occlusal-shader';
import { MarginGeometry, Point3D } from '@/lib/cad/margin-geometry';

interface ProgressiveScanViewerProps {
  scanUrl?: string;
  patientName?: string;
  toothNumber?: number;
}

export function ProgressiveScanViewer({
  scanUrl,
  patientName = 'Rahul Sharma',
  toothNumber = 16,
}: ProgressiveScanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // LOD & Mesh State
  const [selectedLOD, setSelectedLOD] = useState<'COARSE' | 'MEDIUM' | 'HIGH' | 'FULL'>('MEDIUM');
  const [showClearanceHeatmap, setShowClearanceHeatmap] = useState(true);
  const [showPrepMargin, setShowPrepMargin] = useState(true);
  const [antagonistDistanceMm, setAntagonistDistanceMm] = useState(1.8);

  // Performance Telemetry
  const [vertexCount, setVertexCount] = useState(120000);
  const [triangleCount, setTriangleCount] = useState(40000);
  const [memoryMb, setMemoryMb] = useState(2.8);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Prep Margin Spline Points
  const marginPoints: Point3D[] = [
    { x: -5, y: -5, z: 0 },
    { x: 5, y: -5, z: -0.5 },
    { x: 6, y: 4, z: 0.2 },
    { x: -4, y: 5, z: -0.3 },
  ];
  const perimeterMm = MarginGeometry.calculatePerimeterMm(marginPoints);

  useEffect(() => {
    // Recompute telemetry when LOD changes
    const ratios: Record<string, number> = {
      COARSE: 0.05,
      MEDIUM: 0.25,
      HIGH: 0.60,
      FULL: 1.0,
    };
    const ratio = ratios[selectedLOD] || 0.25;
    const baseVerts = 480000;
    const currentVerts = Math.round(baseVerts * ratio);
    setVertexCount(currentVerts);
    setTriangleCount(Math.round(currentVerts / 3));
    setMemoryMb(Number(((currentVerts * 12 + currentVerts * 4) / (1024 * 1024)).toFixed(2)));
  }, [selectedLOD]);

  // Render 3D Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = 90;

      // Draw 3D Crown Contour Mock Mesh
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotationAngle * Math.PI) / 180);

      // 1. Base Mesh Gradient
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
      if (showClearanceHeatmap) {
        const { color } = OcclusalClearanceCalculator.getClearanceColor(antagonistDistanceMm);
        grad.addColorStop(0, color);
        grad.addColorStop(0.7, '#0ea5e9');
        grad.addColorStop(1, '#0284c7');
      } else {
        grad.addColorStop(0, '#f8fafc');
        grad.addColorStop(0.7, '#cbd5e1');
        grad.addColorStop(1, '#64748b');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      // Draw Anatomical Molar Crown Contour
      ctx.ellipse(0, 0, radius, radius * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Anatomical Fissures / Grooves
      ctx.beginPath();
      ctx.moveTo(-radius * 0.6, 0);
      ctx.quadraticCurveTo(0, -radius * 0.2, radius * 0.6, 0);
      ctx.moveTo(0, -radius * 0.5);
      ctx.quadraticCurveTo(radius * 0.2, 0, 0, radius * 0.5);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 3. Subgingival Prep Margin Line (Spline)
      if (showPrepMargin) {
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.95, radius * 0.8, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#ec4899'; // Vibrant pink finish line
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedLOD, showClearanceHeatmap, showPrepMargin, antagonistDistanceMm, rotationAngle]);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Top Cockpit Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Progressive WebGL 3D Intraoral Mesh Viewer
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                LOD Engine
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Tooth {toothNumber} Preparation • Patient: <span className="text-foreground font-semibold">{patientName}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="flex items-center gap-4 bg-background/80 border border-border px-3 py-1.5 rounded-xl text-[11px] font-mono">
          <div>
            <span className="text-muted-foreground">Verts: </span>
            <span className="font-bold text-foreground">{vertexCount.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div>
            <span className="text-muted-foreground">RAM: </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{memoryMb} MB</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div>
            <span className="text-muted-foreground">FPS: </span>
            <span className="font-bold text-primary">60</span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="relative bg-neutral-950 flex items-center justify-center p-6 min-h-[380px] overflow-hidden">
        <canvas ref={canvasRef} width={400} height={320} className="rounded-xl shadow-2xl cursor-grab active:cursor-grabbing" />

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {/* Clearance Heatmap Legend */}
          {showClearanceHeatmap && (
            <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-3 rounded-xl shadow-lg space-y-2 text-[10px] text-white">
              <span className="font-bold uppercase tracking-wider text-neutral-400">Occlusal Clearance</span>
              <div className="space-y-1">
                {OCCLUSAL_CLEARANCE_PRESETS.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.colorHex }} />
                    <span className="font-mono text-neutral-300">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prep Margin Badge */}
          {showPrepMargin && (
            <div className="bg-neutral-900/90 backdrop-blur-md border border-pink-500/30 p-2.5 rounded-xl shadow-lg text-[10px] text-pink-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              Margin Perimeter: {perimeterMm} mm
            </div>
          )}
        </div>

        {/* Rotation Slider */}
        <div className="absolute bottom-4 left-4 right-4 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-3 rounded-xl flex items-center justify-between gap-4 text-white text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-neutral-300">Antagonist Clearance:</span>
            <span className="font-mono text-emerald-400 font-bold">{antagonistDistanceMm.toFixed(1)} mm</span>
          </div>

          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.1}
            value={antagonistDistanceMm}
            onChange={(e) => setAntagonistDistanceMm(parseFloat(e.target.value))}
            aria-label="Antagonist Clearance Distance"
            className="w-full accent-primary h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
          />

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRotationAngle((prev) => (prev + 45) % 360)}
              className="text-[11px] h-7 px-2.5 text-neutral-300 hover:text-white"
            >
              Rotate 45°
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Configuration Toolbar */}
      <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
        {/* LOD Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">LOD Stream:</span>
          {(['COARSE', 'MEDIUM', 'HIGH', 'FULL'] as const).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={selectedLOD === level ? 'default' : 'outline'}
              onClick={() => setSelectedLOD(level)}
              className="text-xs h-7 px-3 font-mono font-semibold"
            >
              {level}
            </Button>
          ))}
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showClearanceHeatmap ? 'default' : 'outline'}
            onClick={() => setShowClearanceHeatmap(!showClearanceHeatmap)}
            className="text-xs h-7 gap-1.5 font-semibold"
          >
            <Activity className="w-3.5 h-3.5" /> Clearance Heatmap
          </Button>

          <Button
            size="sm"
            variant={showPrepMargin ? 'default' : 'outline'}
            onClick={() => setShowPrepMargin(!showPrepMargin)}
            className="text-xs h-7 gap-1.5 font-semibold"
          >
            <Eye className="w-3.5 h-3.5" /> Prep Margin Line
          </Button>
        </div>
      </div>
    </div>
  );
}
