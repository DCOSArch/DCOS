'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToothChartData, ToothCondition, ToothData } from '@/types';
import {
  Check, X, Edit3, RotateCcw, Layers, Hand,
  Maximize2, Minimize2, Plus, Minus, Undo, Redo, Trash2,
} from 'lucide-react';

// ---------------------- Clinical palette (DentOS) ----------------------
export const CLINICAL_CONDITIONS: Record<
  ToothCondition,
  { label: string; hex: string; txt: string; description: string; hasScrew?: boolean; isVeneer?: boolean }
> = {
  healthy:   { label: 'Healthy / Intact',        hex: '#ffffff', txt: '#0f172a', description: 'No pathology detected' },
  cavity:    { label: 'Carious Cavity',          hex: '#ef4444', txt: '#ffffff', description: 'Active dental caries' },
  filling:   { label: 'Restoration / Filling',   hex: '#3b82f6', txt: '#ffffff', description: 'Composite or amalgam' },
  rct:       { label: 'Root Canal (RCT)',        hex: '#a855f7', txt: '#ffffff', description: 'Endodontically treated' },
  crown:     { label: 'Prosthetic Crown',        hex: '#f59e0b', txt: '#0f172a', description: 'Full-coverage crown' },
  missing:   { label: 'Missing / Extracted',     hex: '#9ca3af', txt: '#0f172a', description: 'Tooth is absent' },
  implant:   { label: 'Dental Implant',          hex: '#475569', txt: '#ffffff', description: 'Osseointegrated fixture', hasScrew: true },
  bridge:    { label: 'Bridge Pontic/Abutment',  hex: '#f97316', txt: '#ffffff', description: 'Fixed partial denture' },
  fracture:  { label: 'Fractured Tooth',         hex: '#dc2626', txt: '#ffffff', description: 'Cusp / enamel fracture' },
  sealant:   { label: 'Pit & Fissure Sealant',   hex: '#10b981', txt: '#ffffff', description: 'Preventive sealant' },
  watch:     { label: 'Watch / Monitor',         hex: '#eab308', txt: '#0f172a', description: 'Incipient lesion' },
  unerupted: { label: 'Unerupted / Impacted',    hex: '#94a3b8', txt: '#0f172a', description: 'Not yet erupted' },
};

// ---------------------- Geometry ----------------------
const TEETH_DATA = [
  // Upper Arch
  { id: 18, q: 1, idx: 8, type: 'molar' },    { id: 17, q: 1, idx: 7, type: 'molar' },
  { id: 16, q: 1, idx: 6, type: 'molar' },    { id: 15, q: 1, idx: 5, type: 'premolar' },
  { id: 14, q: 1, idx: 4, type: 'premolar' }, { id: 13, q: 1, idx: 3, type: 'canine' },
  { id: 12, q: 1, idx: 2, type: 'incisor' },  { id: 11, q: 1, idx: 1, type: 'incisor' },
  { id: 21, q: 2, idx: 1, type: 'incisor' },  { id: 22, q: 2, idx: 2, type: 'incisor' },
  { id: 23, q: 2, idx: 3, type: 'canine' },   { id: 24, q: 2, idx: 4, type: 'premolar' },
  { id: 25, q: 2, idx: 5, type: 'premolar' }, { id: 26, q: 2, idx: 6, type: 'molar' },
  { id: 27, q: 2, idx: 7, type: 'molar' },    { id: 28, q: 2, idx: 8, type: 'molar' },
  // Lower Arch
  { id: 48, q: 4, idx: 8, type: 'molar' },    { id: 47, q: 4, idx: 7, type: 'molar' },
  { id: 46, q: 4, idx: 6, type: 'molar' },    { id: 45, q: 4, idx: 5, type: 'premolar' },
  { id: 44, q: 4, idx: 4, type: 'premolar' }, { id: 43, q: 4, idx: 3, type: 'canine' },
  { id: 42, q: 4, idx: 2, type: 'incisor' },  { id: 41, q: 4, idx: 1, type: 'incisor' },
  { id: 31, q: 3, idx: 1, type: 'incisor' },  { id: 32, q: 3, idx: 2, type: 'incisor' },
  { id: 33, q: 3, idx: 3, type: 'canine' },   { id: 34, q: 3, idx: 4, type: 'premolar' },
  { id: 35, q: 3, idx: 5, type: 'premolar' }, { id: 36, q: 3, idx: 6, type: 'molar' },
  { id: 37, q: 3, idx: 7, type: 'molar' },    { id: 38, q: 3, idx: 8, type: 'molar' },
];

const T_ANGLES: Record<number, number> = { 1: 7, 2: 20, 3: 33, 4: 46, 5: 58, 6: 69, 7: 80, 8: 90 };
const A_RAD = 130;
const B_RAD = 220;
const CENTER_X = 400;
const UPPER_VERTEX_Y = 120;
const LOWER_VERTEX_Y = 680;

const getToothPosition = (id: number) => {
  const tooth = TEETH_DATA.find(t => t.id === id);
  if (!tooth) return { x: 0, y: 0, rot: 0 };
  const { q, idx } = tooth;
  const t_deg = T_ANGLES[idx];
  const t_rad = t_deg * (Math.PI / 180);
  const dx = A_RAD * Math.sin(t_rad);
  const dy = B_RAD * (1 - Math.cos(t_rad));

  if (q === 1) return { x: CENTER_X - dx, y: UPPER_VERTEX_Y + dy, rot: -t_deg };
  if (q === 2) return { x: CENTER_X + dx, y: UPPER_VERTEX_Y + dy, rot: t_deg };
  if (q === 3) return { x: CENTER_X + dx, y: LOWER_VERTEX_Y - dy, rot: 180 - t_deg };
  return { x: CENTER_X - dx, y: LOWER_VERTEX_Y - dy, rot: 180 + t_deg };
};

const getBridgeButtonPosition = (idA: number, idB: number) => {
  const toothA = TEETH_DATA.find(t => t.id === idA);
  const toothB = TEETH_DATA.find(t => t.id === idB);
  if (!toothA || !toothB) return { x: 0, y: 0 };
  const degA = T_ANGLES[toothA.idx];
  const degB = T_ANGLES[toothB.idx];
  const midDeg = toothA.q === toothB.q ? (degA + degB) / 2 : 0;
  const q = toothA.q;
  const t_rad = midDeg * (Math.PI / 180);
  const A_DOT = 165;
  const B_DOT = 265;
  const dx = A_DOT * Math.sin(t_rad);
  const dy = B_DOT * (1 - Math.cos(t_rad));
  if (q === 1) return { x: CENTER_X - dx, y: UPPER_VERTEX_Y - 45 + dy };
  if (q === 2) return { x: CENTER_X + dx, y: UPPER_VERTEX_Y - 45 + dy };
  if (q === 3) return { x: CENTER_X + dx, y: LOWER_VERTEX_Y + 45 - dy };
  return { x: CENTER_X - dx, y: LOWER_VERTEX_Y + 45 - dy };
};

const getPath = (t: string) => {
  if (t === 'molar')    return 'M -17 -17 C -6 -20, 6 -20, 17 -17 C 23 -8, 23 8, 17 17 C 6 20, -6 20, -17 17 C -23 8, -23 -8, -17 -17 Z';
  if (t === 'premolar') return 'M -14 -14 C -5 -16, 5 -16, 14 -14 C 19 -7, 19 7, 14 14 C 5 16, -5 16, -14 14 C -19 7, -19 -7, -14 -14 Z';
  if (t === 'canine')   return 'M 0 -18 L 12 -8 C 15 2, 12 13, 0 18 C -12 13, -15 2, -12 -8 Z';
  return 'M -13 -12 L 13 -12 C 15 -4, 13 9, 0 16 C -13 9, -15 -4, -13 -12 Z';
};

const getVeneerArc = (type: string) => {
  if (type === 'molar')    return 'M -17 -17 C -6 -20, 6 -20, 17 -17';
  if (type === 'premolar') return 'M -14 -14 C -5 -16, 5 -16, 14 -14';
  if (type === 'canine')   return 'M -11 -7 L 0 -18 L 11 -7';
  return 'M -13 -12 C -6 -14, 6 -14, 13 -12';
};

const ADJACENT_PAIRS: [number, number][] = [
  [18,17],[17,16],[16,15],[15,14],[14,13],[13,12],[12,11],[11,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27],[27,28],
  [48,47],[47,46],[46,45],[45,44],[44,43],[43,42],[42,41],[41,31],[31,32],[32,33],[33,34],[34,35],[35,36],[36,37],[37,38],
];

// FDI ↔ Universal
const FDI_TO_UNIVERSAL: Record<number, number> = {
  18:1, 17:2, 16:3, 15:4, 14:5, 13:6, 12:7, 11:8,
  21:9, 22:10, 23:11, 24:12, 25:13, 26:14, 27:15, 28:16,
  38:17, 37:18, 36:19, 35:20, 34:21, 33:22, 32:23, 31:24,
  41:25, 42:26, 43:27, 44:28, 45:29, 46:30, 47:31, 48:32,
};

const getToothAnatomicalName = (id: number) => {
  const tooth = TEETH_DATA.find(t => t.id === id);
  if (!tooth) return '';
  const { q, idx } = tooth;
  const names: Record<number, string> = {
    1: 'Central Incisor', 2: 'Lateral Incisor', 3: 'Canine',
    4: 'First Premolar', 5: 'Second Premolar',
    6: 'First Molar', 7: 'Second Molar', 8: 'Third Molar',
  };
  const jaw = q === 1 || q === 2 ? 'Maxillary' : 'Mandibular';
  const side = q === 1 || q === 4 ? 'Right' : 'Left';
  return `${jaw} ${side} ${names[idx]}`;
};

const getToothQuadrantName = (id: number) => {
  const t = TEETH_DATA.find(x => x.id === id);
  if (!t) return '';
  return { 1: 'Q1 — Upper Right', 2: 'Q2 — Upper Left', 3: 'Q3 — Lower Left', 4: 'Q4 — Lower Right' }[t.q]!;
};

// ---------------------- Component ----------------------

export interface ArchToothChartProps {
  initialData?: ToothChartData;
  onChange?: (data: ToothChartData) => void;
  readOnly?: boolean;
  selectedTeeth?: number[];
  onToothSelect?: (toothNumber: number) => void;
  title?: string;
  description?: string;
  compact?: boolean;
}

type Snapshot = { data: ToothChartData; connections: string[] };

export function ArchToothChart({
  initialData = {},
  onChange,
  readOnly = false,
  selectedTeeth = [],
  onToothSelect,
  title = 'Interactive Odontogram & Dental Chart',
  description = 'Click a tooth to diagnose. Drag between adjacent teeth to link a bridge.',
  compact = false,
}: ArchToothChartProps) {
  const [chartData, setChartData] = useState<ToothChartData>(initialData);
  const [connections, setConnections] = useState<string[]>([]);
  const [system, setSystem] = useState<'FDI' | 'UNIVERSAL'>('FDI');
  const [activeIndication, setActiveIndication] = useState<ToothCondition>('cavity');
  const [activeTooth, setActiveTooth] = useState<number | null>(null);
  const [toothNote, setToothNote] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPaintDragging, setIsPaintDragging] = useState(false);
  const [paintMode, setPaintMode] = useState<'ADD' | 'REMOVE' | null>(null);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const [history, setHistory] = useState<Snapshot[]>([{ data: initialData, connections: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    setChartData(initialData);
    setHistory([{ data: initialData, connections: [] }]);
    setHistoryIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushHistory = (data: ToothChartData, conns: string[]) => {
    const next = history.slice(0, historyIndex + 1);
    next.push({ data: JSON.parse(JSON.stringify(data)), connections: [...conns] });
    if (next.length > 40) next.shift();
    setHistory(next);
    setHistoryIndex(next.length - 1);
  };

  const commit = (nextData: ToothChartData, nextConns: string[] = connections) => {
    setChartData(nextData);
    setConnections(nextConns);
    pushHistory(nextData, nextConns);
    onChange?.(nextData);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const i = historyIndex - 1;
    setHistoryIndex(i);
    setChartData(history[i].data);
    setConnections(history[i].connections);
    onChange?.(history[i].data);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const i = historyIndex + 1;
    setHistoryIndex(i);
    setChartData(history[i].data);
    setConnections(history[i].connections);
    onChange?.(history[i].data);
  };

  const handleClearAll = () => commit({}, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, history]);

  const addRipple = (x: number, y: number, color: string) => {
    const r = { id: Math.random().toString(36).slice(2, 9), x, y, color };
    setRipples(prev => [...prev, r]);
    setTimeout(() => setRipples(prev => prev.filter(p => p.id !== r.id)), 500);
  };

  const applyPaint = (toothId: number, mode: 'ADD' | 'REMOVE') => {
    const current: ToothData | undefined = chartData[toothId];
    const currentCond = current?.condition ?? 'healthy';
    if (mode === 'REMOVE') {
      if (currentCond !== activeIndication) return;
      const next = { ...chartData };
      delete next[toothId];
      const p = getToothPosition(toothId);
      addRipple(p.x, p.y, '#ef4444');
      commit(next);
      return;
    }
    if (currentCond === activeIndication) return;
    const next: ToothChartData = {
      ...chartData,
      [toothId]: {
        condition: activeIndication,
        surfaces: current?.surfaces ?? { B: activeIndication, M: activeIndication, O: activeIndication, D: activeIndication, L: activeIndication },
        note: current?.note,
      },
    };
    const p = getToothPosition(toothId);
    addRipple(p.x, p.y, CLINICAL_CONDITIONS[activeIndication].hex);
    commit(next);
  };

  const handleToothMouseDown = (toothId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPanMode || readOnly) return;
    onToothSelect?.(toothId);
    const currentCond = chartData[toothId]?.condition ?? 'healthy';
    const targetMode = currentCond === activeIndication ? 'REMOVE' : 'ADD';
    setPaintMode(targetMode);
    setIsPaintDragging(true);
    applyPaint(toothId, targetMode);
  };

  const handleToothMouseEnter = (toothId: number) => {
    if (isPaintDragging && paintMode && !isPanMode && !readOnly) applyPaint(toothId, paintMode);
  };

  useEffect(() => {
    const up = () => { setIsPaintDragging(false); setPaintMode(null); };
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const handleToothOpenModal = (toothId: number) => {
    if (readOnly) return;
    setActiveTooth(toothId);
    setToothNote(chartData[toothId]?.note ?? '');
  };

  const applyConditionFromModal = (condition: ToothCondition) => {
    if (activeTooth == null) return;
    const current = chartData[activeTooth];
    const next: ToothChartData = {
      ...chartData,
      [activeTooth]: {
        condition,
        surfaces: current?.surfaces ?? { B: condition, M: condition, O: condition, D: condition, L: condition },
        note: toothNote,
      },
    };
    commit(next);
    setActiveTooth(null);
  };

  const clearActiveTooth = () => {
    if (activeTooth == null) return;
    const next = { ...chartData };
    delete next[activeTooth];
    commit(next);
    setActiveTooth(null);
  };

  // Pan / zoom handlers
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = 1.1;
    setZoom(z => e.deltaY < 0 ? Math.min(z * factor, 3) : Math.max(z / factor, 0.8));
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const isBackground =
      e.target === e.currentTarget ||
      (e.target as SVGElement).id === 'arch-svg-background' ||
      (e.target as SVGElement).tagName === 'svg' ||
      (e.target as SVGElement).id === 'arch-midline';
    if (isBackground || isPanMode) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      if (svgContainerRef.current) svgContainerRef.current.style.transition = 'none';
    }
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return;
    const nx = e.clientX - panStartRef.current.x;
    const ny = e.clientY - panStartRef.current.y;
    panRef.current = { x: nx, y: ny };
    if (svgContainerRef.current) svgContainerRef.current.style.transform = `translate(${nx}px, ${ny}px) scale(${zoom})`;
  };
  const handleMouseUp = () => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setPan({ ...panRef.current });
    if (svgContainerRef.current) svgContainerRef.current.style.transition = '';
  };

  const configuredTeeth = useMemo(
    () => Object.keys(chartData).map(Number).filter(id => chartData[id]?.condition && chartData[id].condition !== 'healthy').sort((a, b) => a - b),
    [chartData],
  );

  const displayNum = (id: number) => (system === 'FDI' ? id : (FDI_TO_UNIVERSAL[id] ?? id));

  const canvasHeightClass = compact
    ? 'min-h-[360px] md:min-h-[420px]'
    : 'min-h-[480px] md:min-h-[640px]';

  const chart = (
    <div
      className={`chart-container w-full h-full relative flex items-center justify-center bg-slate-950 select-none overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : `${canvasHeightClass} rounded-xl border border-slate-800`}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes archDrawBridge { from { stroke-dashoffset: 120; } to { stroke-dashoffset: 0; } }
        .arch-bridge-anim { stroke-dasharray: 120; stroke-dashoffset: 120; animation: archDrawBridge 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes archRipple { 0% { transform: scale(0.6); opacity: 0.8; } 100% { transform: scale(1.8); opacity: 0; } }
        .arch-ripple { animation: archRipple 0.5s cubic-bezier(0.1,0.8,0.3,1) forwards; }
      `}} />

      {/* Top-left legend */}
      {!compact && (
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 space-y-1.5 select-none max-w-[180px] pointer-events-none">
          <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Bridge controls</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#1e1f1c] border border-slate-500 shrink-0" />
            <span>Click + to add bridge</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-1.5 bg-[#a6e22e] rounded-full shrink-0" />
            <span>Active connection</span>
          </div>
        </div>
      )}

      {/* Top-right controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-1">
        <button type="button" onClick={() => setZoom(z => Math.min(z + 0.2, 3))} title="Zoom in"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"><Plus className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => setZoom(z => Math.max(z - 0.2, 0.8))} title="Zoom out"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"><Minus className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); panRef.current = { x: 0, y: 0 }; }} title="Reset view"
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"><RotateCcw className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-slate-800 mx-1" />
        <button type="button" onClick={() => setIsPanMode(v => !v)} title={isPanMode ? 'Switch to paint mode' : 'Switch to pan mode'}
          className={`p-1.5 rounded transition-colors ${isPanMode ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'}`}><Hand className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors">{isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}</button>
      </div>

      {/* Bottom-left undo/redo/clear */}
      {!readOnly && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-1">
          <button type="button" disabled={historyIndex <= 0} onClick={handleUndo} title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"><Undo className="w-3.5 h-3.5" /></button>
          <button type="button" disabled={historyIndex >= history.length - 1} onClick={handleRedo} title="Redo"
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"><Redo className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button type="button" onClick={handleClearAll} title="Clear all"
            className="p-1.5 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Mode indicator */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-400 bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded border border-slate-800/60 font-medium">
        {isPanMode ? 'Pan mode' : isPaintDragging ? `Painting (${paintMode})` : readOnly ? 'Read-only' : `Paint: ${CLINICAL_CONDITIONS[activeIndication].label}`}
      </div>

      {/* SVG Workspace */}
      <div
        ref={svgContainerRef}
        className="w-full max-w-[680px] aspect-square transition-transform duration-100"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          cursor: isPanMode ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 800 800" className="w-full h-full overflow-visible" id="arch-svg">
          <rect id="arch-svg-background" width="800" height="800" fill="transparent" />
          <line id="arch-midline" x1="400" y1="40" x2="400" y2="760" stroke="#3e3d32" strokeDasharray="4 4" strokeWidth="2" className="opacity-50" />

          {/* Teeth */}
          {TEETH_DATA.map(tooth => {
            const pos = getToothPosition(tooth.id);
            const cond = chartData[tooth.id]?.condition ?? 'healthy';
            const info = CLINICAL_CONDITIONS[cond];
            const isMissing = cond === 'missing';
            const isSelected = selectedTeeth.includes(tooth.id);
            return (
              <g
                key={tooth.id}
                className="cursor-pointer group/tooth"
                onMouseDown={(e) => handleToothMouseDown(tooth.id, e)}
                onMouseEnter={() => handleToothMouseEnter(tooth.id)}
                onDoubleClick={() => handleToothOpenModal(tooth.id)}
                onMouseMove={(e) => {
                  const container = (e.currentTarget as SVGGElement).closest('.chart-container');
                  if (container) {
                    const r = container.getBoundingClientRect();
                    setTooltipPos({ x: e.clientX - r.left, y: e.clientY - r.top });
                  }
                  setHoveredTooth(tooth.id);
                }}
                onMouseLeave={() => setHoveredTooth(null)}
                transform={`translate(${pos.x}, ${pos.y})`}
              >
                <g
                  transform={`rotate(${pos.rot})`}
                  className="transition-transform duration-200 ease-out origin-center group-hover/tooth:scale-[1.12]"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  <rect x="-26" y="-26" width="52" height="52" fill="transparent" />
                  {info.hasScrew && !isMissing && (
                    <g transform="rotate(180)" className="transition-opacity duration-200">
                      <path d="M-5,-12 L5,-12 L4,-16 L-4,-16 Z" fill="#66d9ef" />
                      <path d="M-4,-16 L4,-16 L2.5,-35 L0,-40 L-2.5,-35 Z" fill="#3e3d32" />
                      <path d="M-4.5,-18 L4.5,-20 M-4.5,-22 L4.5,-24 M-4,-26 L4,-28 M-3.5,-30 L3.5,-32 M-3,-34 L3,-36" stroke="#f8f8f2" strokeWidth="1.5" fill="none" />
                    </g>
                  )}
                  <path
                    d={getPath(tooth.type)}
                    className={`transition-all duration-200 stroke-[2px] ${
                      isSelected ? 'stroke-primary'
                      : cond !== 'healthy' ? 'stroke-blue-400'
                      : 'stroke-slate-500 group-hover/tooth:stroke-cyan-400'
                    }`}
                    style={{ fill: isMissing ? 'transparent' : info.hex, strokeDasharray: isMissing ? '4 2' : undefined }}
                  />
                  {cond === 'missing' && (
                    <g>
                      <line x1="-12" y1="-12" x2="12" y2="12" stroke="#94a3b8" strokeWidth="2.5" />
                      <line x1="12" y1="-12" x2="-12" y2="12" stroke="#94a3b8" strokeWidth="2.5" />
                    </g>
                  )}
                  {cond === 'rct' && (
                    <text textAnchor="middle" dominantBaseline="middle" x="0" y="1" className="text-[9px] font-bold fill-white pointer-events-none">⚡</text>
                  )}
                </g>
                <text
                  textAnchor="middle" dominantBaseline="middle" x="0" y="1"
                  className="text-[10px] font-extrabold pointer-events-none select-none"
                  style={{ fill: cond === 'missing' || cond === 'healthy' ? '#94a3b8' : info.txt }}
                >
                  {displayNum(tooth.id)}
                </text>
              </g>
            );
          })}

          {/* Bridge connectors */}
          {ADJACENT_PAIRS.map(([a, b]) => {
            const cA = chartData[a]?.condition;
            const cB = chartData[b]?.condition;
            if (!cA || cA === 'healthy' || !cB || cB === 'healthy') return null;
            const posA = getToothPosition(a);
            const posB = getToothPosition(b);
            const dot = getBridgeButtonPosition(a, b);
            const key = `${a}-${b}`;
            const isConnected = connections.includes(key);
            return (
              <g key={key}>
                {isConnected && (
                  <path
                    d={`M ${posA.x} ${posA.y} L ${dot.x} ${dot.y} L ${posB.x} ${posB.y}`}
                    fill="none" stroke="#a6e22e" strokeWidth="2.5" className="arch-bridge-anim"
                  />
                )}
                <g
                  className={readOnly ? '' : 'cursor-pointer'}
                  onClick={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    setConnections(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
                    pushHistory(chartData, connections.includes(key) ? connections.filter(x => x !== key) : [...connections, key]);
                  }}
                >
                  <circle cx={dot.x} cy={dot.y} r="16" fill="transparent" />
                  <circle cx={dot.x} cy={dot.y} r="7.5" fill={isConnected ? '#a6e22e' : '#1e1f1c'} stroke={isConnected ? '#a6e22e' : '#475569'} strokeWidth={isConnected ? 1 : 1.5} className="transition-all duration-200" />
                  {!isConnected && (
                    <g stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                      <line x1={dot.x} y1={dot.y - 2.5} x2={dot.x} y2={dot.y + 2.5} />
                      <line x1={dot.x - 2.5} y1={dot.y} x2={dot.x + 2.5} y2={dot.y} />
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* Ripples */}
          {ripples.map(r => (
            <circle
              key={r.id} cx={r.x} cy={r.y} r="30" fill="none" stroke={r.color} strokeWidth="3"
              className="arch-ripple pointer-events-none"
              style={{ transformOrigin: `${r.x}px ${r.y}px` }}
            />
          ))}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredTooth !== null && (
        <div
          className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-800 text-white shadow-xl rounded-lg px-3 py-2 text-xs transition-all duration-75 flex flex-col gap-0.5"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 50 }}
        >
          <div className="font-bold flex items-center gap-1.5 text-slate-100">
            <span>Tooth {displayNum(hoveredTooth)}</span>
            <span className="text-[10px] text-slate-400 font-normal">({getToothQuadrantName(hoveredTooth)})</span>
          </div>
          <div className="text-[10px] text-slate-400">{getToothAnatomicalName(hoveredTooth)}</div>
          <div className="mt-1 font-semibold text-blue-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CLINICAL_CONDITIONS[chartData[hoveredTooth]?.condition ?? 'healthy'].hex }} />
            <span>{CLINICAL_CONDITIONS[chartData[hoveredTooth]?.condition ?? 'healthy'].label}</span>
          </div>
        </div>
      )}
    </div>
  );

  const paletteSidebar = readOnly ? null : (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-primary" /> Diagnosis & Restorative Condition Palette:
        </p>
        {configuredTeeth.length > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <span>Configured teeth ({configuredTeeth.length}):</span>
            <div className="flex flex-wrap gap-1">
              {configuredTeeth.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]">#{displayNum(t)}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {(Object.keys(CLINICAL_CONDITIONS) as ToothCondition[])
          .filter(k => k !== 'healthy')
          .map(key => {
            const info = CLINICAL_CONDITIONS[key];
            const isSelected = activeIndication === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveIndication(key)}
                className={`text-left px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/15 text-foreground shadow-xs ring-1 ring-primary'
                    : 'border-border bg-muted/40 hover:bg-muted text-foreground'
                }`}
                title={info.description}
              >
                <span className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-xs" style={{ backgroundColor: info.hex }} />
                <span className="truncate">{info.label}</span>
              </button>
            );
          })}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5">
          💡 <strong>Pro Tips:</strong> Click any tooth to paint &bull; Double-click for SOAP clinical notes &bull; Drag between teeth for bridges
        </span>
      </div>
    </div>
  );

  return (
    <Card className="w-full border-border bg-card text-card-foreground shadow-xs overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border gap-3 bg-muted/20">
        <div className="min-w-0">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Layers className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">{description}</CardDescription>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex rounded-lg border border-border bg-muted/60 p-0.5 text-xs">
            <button type="button" onClick={() => setSystem('FDI')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${system === 'FDI' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>FDI</button>
            <button type="button" onClick={() => setSystem('UNIVERSAL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${system === 'UNIVERSAL' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}>Universal</button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="w-full flex justify-center">
          {chart}
        </div>
        {paletteSidebar}
      </CardContent>

      {/* Tooth details modal */}
      {activeTooth != null && !readOnly && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-card-foreground">
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Tooth #{displayNum(activeTooth)}
                </h3>
                <p className="text-xs text-primary font-medium mt-0.5">{getToothAnatomicalName(activeTooth)}</p>
                <Badge variant="secondary" className="mt-1 text-[10px]">{getToothQuadrantName(activeTooth)}</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveTooth(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Diagnosis / condition</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {(Object.keys(CLINICAL_CONDITIONS) as ToothCondition[]).map(key => {
                  const info = CLINICAL_CONDITIONS[key];
                  return (
                    <button
                      key={key} type="button" onClick={() => applyConditionFromModal(key)}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-border hover:border-primary text-left transition-all hover:scale-[1.02] active:scale-95 bg-muted/30"
                    >
                      <span className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.hex }} />
                        {info.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{info.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clinical notes</label>
              <input
                type="text" value={toothNote} onChange={(e) => setToothNote(e.target.value)}
                placeholder="e.g. Deep mesial pocket, cold sensitivity, shade A2"
                className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button variant="destructive" size="sm" onClick={clearActiveTooth} className="text-xs">
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTooth(null)} className="text-xs">Cancel</Button>
                <Button
                  size="sm"
                  onClick={() => applyConditionFromModal(chartData[activeTooth]?.condition ?? 'healthy')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Save note
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
