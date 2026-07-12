'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import SummaryChart from '@/components/SummaryChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Plus, Activity, CheckCircle2, UploadCloud, FileBox, Filter, FileText, Box, Building2, ChevronRight, ChevronLeft, Camera, Minus, RotateCcw, Hand, Maximize2, Minimize2, Undo, Redo, Trash2, ChevronDown } from 'lucide-react';
import { Case, User, DoctorInventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { validateSTLFile } from '@/lib/utils/stlValidator';

const VITA_SHADES: { code: string; hex: string; group: string }[] = [
  { code: 'A1', hex: '#f4ebe1', group: 'A' },
  { code: 'A2', hex: '#ebdccb', group: 'A' },
  { code: 'A3', hex: '#e3ceb5', group: 'A' },
  { code: 'A3.5', hex: '#d8bf9f', group: 'A' },
  { code: 'A4', hex: '#cca782', group: 'A' },
  { code: 'B1', hex: '#f4ecd8', group: 'B' },
  { code: 'B2', hex: '#eadbb9', group: 'B' },
  { code: 'B3', hex: '#e1ca9e', group: 'B' },
  { code: 'B4', hex: '#d4b882', group: 'B' },
  { code: 'C1', hex: '#ebdcd4', group: 'C' },
  { code: 'C2', hex: '#dfc7bd', group: 'C' },
  { code: 'C3', hex: '#d4b8aa', group: 'C' },
  { code: 'C4', hex: '#c09e8f', group: 'C' },
  { code: 'D2', hex: '#e2cfbd', group: 'D' },
  { code: 'D3', hex: '#d4b79f', group: 'D' },
  { code: 'D4', hex: '#cca487', group: 'D' },
];

const SHADE_HEX_MAP: Record<string, string> = VITA_SHADES.reduce((acc, s) => {
  acc[s.code] = s.hex;
  return acc;
}, {} as Record<string, string>);

const MATERIALS = [
  { value: 'Zirconia HT', label: 'Zirconia HT (High Translucency)' },
  { value: 'BruxZir Solid Zirconia', label: 'BruxZir Solid Zirconia' },
  { value: 'IPS e.max CAD', label: 'IPS e.max CAD (Lithium Disilicate)' },
  { value: 'PMMA Temporary', label: 'PMMA Temporary' },
  { value: 'Titanium Abutment', label: 'Titanium Custom Abutment' },
];

const getIndications = () => {
  const base: Record<string, { hex: string; txt: string; label: string; hasScrew?: boolean; isVeneer?: boolean }> = {
    none: { hex: '#ffffff', txt: '#64748b', label: 'Healthy / Clear' },
    coping: { hex: '#0d9488', txt: '#ffffff', label: 'Coping' },
    crown: { hex: '#3b82f6', txt: '#ffffff', label: 'Crown' },
    implant: { hex: '#475569', txt: '#ffffff', label: 'Implant Placement', hasScrew: true },
    abutment: { hex: '#eab308', txt: '#ffffff', label: 'Custom Abutment', hasScrew: true },
    fpd: { hex: '#059669', txt: '#ffffff', label: 'Fixed Partial Denture' },
    pontic: { hex: '#b91c1c', txt: '#ffffff', label: 'Pontic' },
    veneer: { hex: '#f1f5f9', txt: '#475569', label: 'Porcelain Veneer', isVeneer: true }
  };
  return base;
};

const TEETH_DATA = [
  // Upper Arch
  { id: 18, q: 1, idx: 8, type: 'molar' }, { id: 17, q: 1, idx: 7, type: 'molar' }, { id: 16, q: 1, idx: 6, type: 'molar' }, { id: 15, q: 1, idx: 5, type: 'premolar' }, { id: 14, q: 1, idx: 4, type: 'premolar' }, { id: 13, q: 1, idx: 3, type: 'canine' }, { id: 12, q: 1, idx: 2, type: 'incisor' }, { id: 11, q: 1, idx: 1, type: 'incisor' },
  { id: 21, q: 2, idx: 1, type: 'incisor' }, { id: 22, q: 2, idx: 2, type: 'incisor' }, { id: 23, q: 2, idx: 3, type: 'canine' }, { id: 24, q: 2, idx: 4, type: 'premolar' }, { id: 25, q: 2, idx: 5, type: 'premolar' }, { id: 26, q: 2, idx: 6, type: 'molar' }, { id: 27, q: 2, idx: 7, type: 'molar' }, { id: 28, q: 2, idx: 8, type: 'molar' },
  // Lower Arch
  { id: 48, q: 4, idx: 8, type: 'molar' }, { id: 47, q: 4, idx: 7, type: 'molar' }, { id: 46, q: 4, idx: 6, type: 'molar' }, { id: 45, q: 4, idx: 5, type: 'premolar' }, { id: 44, q: 4, idx: 4, type: 'premolar' }, { id: 43, q: 4, idx: 3, type: 'canine' }, { id: 42, q: 4, idx: 2, type: 'incisor' }, { id: 41, q: 4, idx: 1, type: 'incisor' },
  { id: 31, q: 3, idx: 1, type: 'incisor' }, { id: 32, q: 3, idx: 2, type: 'incisor' }, { id: 33, q: 3, idx: 3, type: 'canine' }, { id: 34, q: 3, idx: 4, type: 'premolar' }, { id: 35, q: 3, idx: 5, type: 'premolar' }, { id: 36, q: 3, idx: 6, type: 'molar' }, { id: 37, q: 3, idx: 7, type: 'molar' }, { id: 38, q: 3, idx: 8, type: 'molar' }
];

const UPPER_ARCH_ORDER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_ARCH_ORDER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const getArchMaxGroupSize = (orderedArch: number[], configs: Record<number, string>) => {
  let maxGroup = 0;
  let currentGroup = 0;
  for (const id of orderedArch) {
    if (configs[id] && configs[id] !== 'none') {
      currentGroup++;
    } else {
      if (currentGroup > maxGroup) {
        maxGroup = currentGroup;
      }
      currentGroup = 0;
    }
  }
  if (currentGroup > maxGroup) {
    maxGroup = currentGroup;
  }
  return maxGroup;
};

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

  let x = 0;
  let y = 0;
  let rot = 0;

  if (q === 1) { // Upper Right
    x = CENTER_X - dx;
    y = UPPER_VERTEX_Y + dy;
    rot = -t_deg;
  } else if (q === 2) { // Upper Left
    x = CENTER_X + dx;
    y = UPPER_VERTEX_Y + dy;
    rot = t_deg;
  } else if (q === 3) { // Lower Left
    x = CENTER_X + dx;
    y = LOWER_VERTEX_Y - dy;
    rot = 180 - t_deg;
  } else if (q === 4) { // Lower Right
    x = CENTER_X - dx;
    y = LOWER_VERTEX_Y - dy;
    rot = 180 + t_deg;
  }

  return { x, y, rot };
};

const getBridgeButtonPosition = (idA: number, idB: number) => {
  const toothA = TEETH_DATA.find(t => t.id === idA);
  const toothB = TEETH_DATA.find(t => t.id === idB);
  if (!toothA || !toothB) return { x: 0, y: 0 };

  const degA = T_ANGLES[toothA.idx];
  const degB = T_ANGLES[toothB.idx];

  let midDeg = 0;
  let q = toothA.q;

  if (toothA.q === toothB.q) {
    midDeg = (degA + degB) / 2;
  } else {
    midDeg = 0; // crossing midline
  }

  const t_rad = midDeg * (Math.PI / 180);
  const A_RAD_DOT = 165;
  const B_RAD_DOT = 265;

  const dx = A_RAD_DOT * Math.sin(t_rad);
  const dy = B_RAD_DOT * (1 - Math.cos(t_rad));

  let x = 0;
  let y = 0;

  if (q === 1) { // Upper Right
    x = CENTER_X - dx;
    y = UPPER_VERTEX_Y - 45 + dy;
  } else if (q === 2) { // Upper Left
    x = CENTER_X + dx;
    y = UPPER_VERTEX_Y - 45 + dy;
  } else if (q === 3) { // Lower Left
    x = CENTER_X + dx;
    y = LOWER_VERTEX_Y + 45 - dy;
  } else if (q === 4) { // Lower Right
    x = CENTER_X - dx;
    y = LOWER_VERTEX_Y + 45 - dy;
  }

  return { x, y };
};

const getVeneerArc = (type: string) => {
  if (type === 'molar') return "M -17 -17 C -6 -20, 6 -20, 17 -17";
  if (type === 'premolar') return "M -14 -14 C -5 -16, 5 -16, 14 -14";
  if (type === 'canine') return "M -11 -7 L 0 -18 L 11 -7";
  return "M -13 -12 C -6 -14, 6 -14, 13 -12"; // Incisor
};

const ADJACENT_PAIRS = [
  // Upper
  [18, 17], [17, 16], [16, 15], [15, 14], [14, 13], [13, 12], [12, 11], [11, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27], [27, 28],
  // Lower
  [48, 47], [47, 46], [46, 45], [45, 44], [44, 43], [43, 42], [42, 41], [41, 31], [31, 32], [32, 33], [33, 34], [34, 35], [35, 36], [36, 37], [37, 38]
];

const getPath = (t: string) => {
  if (t === 'molar') return "M -17 -17 C -6 -20, 6 -20, 17 -17 C 23 -8, 23 8, 17 17 C 6 20, -6 20, -17 17 C -23 8, -23 -8, -17 -17 Z";
  if (t === 'premolar') return "M -14 -14 C -5 -16, 5 -16, 14 -14 C 19 -7, 19 7, 14 14 C 5 16, -5 16, -14 14 C -19 7, -19 -7, -14 -14 Z";
  if (t === 'canine') return "M 0 -18 L 12 -8 C 15 2, 12 13, 0 18 C -12 13, -15 2, -12 -8 Z";
  return "M -13 -12 L 13 -12 C 15 -4, 13 9, 0 16 C -13 9, -15 -4, -13 -12 Z";
};

interface DentistDashboardProps {
  initialCases: Case[];
  currentUser: User;
  availableLabs: { id: string; name: string }[];
}

export default function DentistDashboard({ initialCases, currentUser, availableLabs }: DentistDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [cases, setCases] = useState<Case[]>(initialCases);

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'uploading' | 'warning'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [validationDimensions, setValidationDimensions] = useState<{ x: number; y: number; z: number } | null>(null);

  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<Case['urgency']>('NORMAL');
  const [selectedLabId, setSelectedLabId] = useState<string>(availableLabs.length > 0 ? availableLabs[0].id : '');
  const [dueDate, setDueDate] = useState<string>('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDicomFile, setSelectedDicomFile] = useState<File | null>(null);
  const dicomInputRef = useRef<HTMLInputElement>(null);
  const shadePhotoInputRef = useRef<HTMLInputElement>(null);

  const [inventory, setInventory] = useState<DoctorInventoryItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [implantBrand, setImplantBrand] = useState('');
  const [scanBodyModel, setScanBodyModel] = useState('');
  const [analogLogistics, setAnalogLogistics] = useState('');
  const [implantBarNeeded, setImplantBarNeeded] = useState('');
  const [dentureType, setDentureType] = useState('');

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [isTeethNotSpecified, setIsTeethNotSpecified] = useState(false);
  const [material, setMaterial] = useState('Zirconia HT');
  const [shade, setShade] = useState('A2');
  const [isDesignNotSpecified, setIsDesignNotSpecified] = useState(false);
  const [instructions, setInstructions] = useState('');

  const [customShadeEnabled, setCustomShadeEnabled] = useState(false);
  const [cervicalShade, setCervicalShade] = useState('A2');
  const [bodyShade, setBodyShade] = useState('A2');
  const [incisalShade, setIncisalShade] = useState('A2');
  const [characterizations, setCharacterizations] = useState<string[]>([]);
  const [shadePhotoFile, setShadePhotoFile] = useState<File | null>(null);
  const [activeZone, setActiveZone] = useState<'cervical' | 'body' | 'incisal' | null>(null);

  const [carouselPanel, setCarouselPanel] = useState<'material' | 'shade'>('material');

  const [toothConfigs, setToothConfigs] = useState<Record<number, string>>({});
  const [connections, setConnections] = useState<string[]>([]);
  const [activeIndication, setActiveIndication] = useState<string>('coping');
  const [showArchLimitPopup, setShowArchLimitPopup] = useState<boolean>(false);


  // Advanced Charting states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanModeActive, setIsPanModeActive] = useState(false);
  // Refs for zero-rerender panning — direct DOM manipulation during drag
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isPaintDragging, setIsPaintDragging] = useState(false);
  const [paintMode, setPaintMode] = useState<'ADD' | 'REMOVE' | null>(null);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  // History Stack (Undo/Redo)
  const [history, setHistory] = useState<{ toothConfigs: Record<number, string>; connections: string[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Sync initial history
  useEffect(() => {
    setHistory([{ toothConfigs: {}, connections: [] }]);
    setHistoryIndex(0);
  }, []);

  const pushHistory = (newConfigs: Record<number, string>, newConnections: string[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      toothConfigs: JSON.parse(JSON.stringify(newConfigs)),
      connections: [...newConnections]
    });
    if (nextHistory.length > 40) {
      nextHistory.shift();
    }
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const updateChartState = (newConfigs: Record<number, string>, newConnections: string[]) => {
    setToothConfigs(newConfigs);
    setConnections(newConnections);
    pushHistory(newConfigs, newConnections);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setToothConfigs(history[prevIndex].toothConfigs);
      setConnections(history[prevIndex].connections);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setToothConfigs(history[nextIndex].toothConfigs);
      setConnections(history[nextIndex].connections);
    }
  };

  const handleClearAll = () => {
    updateChartState({}, []);
  };

  const addRipple = (x: number, y: number, color: string) => {
    const newRipple = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      color
    };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 500);
  };

  // Keyboard shortcut Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [historyIndex, history]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 3);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.8);
    }
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const isBackground =
      e.target === e.currentTarget ||
      (e.target as SVGElement).id === 'svg-background' ||
      (e.target as SVGElement).tagName === 'svg' ||
      (e.target as SVGElement).id === 'midline-indicator';

    if (isBackground || isPanModeActive) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
      // Remove transition during drag for instant response
      if (svgContainerRef.current) {
        svgContainerRef.current.style.transition = 'none';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      // Direct DOM mutation — zero React re-renders
      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;
      panRef.current = { x: newX, y: newY };
      if (svgContainerRef.current) {
        svgContainerRef.current.style.transform = `translate(${newX}px, ${newY}px) scale(${zoom})`;
      }
    }
  };

  const handleMouseUp = () => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      // Sync final position back to React state (single re-render)
      setPan({ ...panRef.current });
      // Restore transition for zoom button animations
      if (svgContainerRef.current) {
        svgContainerRef.current.style.transition = '';
      }
    }
  };

  const handleToothMouseDown = (toothId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPanModeActive) return;

    const currentStatus = toothConfigs[toothId] || 'none';
    const targetMode = currentStatus === activeIndication ? 'REMOVE' : 'ADD';
    setPaintMode(targetMode);
    setIsPaintDragging(true);

    applyPaint(toothId, targetMode);
  };

  const handleToothMouseEnter = (toothId: number) => {
    if (isPaintDragging && paintMode && !isPanModeActive) {
      applyPaint(toothId, paintMode);
    }
  };

  const handleGlobalMouseUp = () => {
    setIsPaintDragging(false);
    setPaintMode(null);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPaintDragging]);

  const applyPaint = (toothId: number, mode: 'ADD' | 'REMOVE') => {
    const updated = { ...toothConfigs };
    if (mode === 'REMOVE') {
      if (updated[toothId] === activeIndication) {
        delete updated[toothId];
        const pos = getToothPosition(toothId);
        addRipple(pos.x, pos.y, '#ef4444');
        updateChartState(updated, connections);
      }
    } else {
      if (updated[toothId] === activeIndication) {
        return;
      }

      if (treatmentType.some(t => ['CNB', 'Denture', 'Veneer', 'Implant'].includes(t))) {
        const simulated = { ...updated, [toothId]: activeIndication };
        const upperMax = getArchMaxGroupSize(UPPER_ARCH_ORDER, simulated);
        const lowerMax = getArchMaxGroupSize(LOWER_ARCH_ORDER, simulated);

        if ((upperMax > 6 || lowerMax > 6) && (!updated[toothId] || updated[toothId] === 'none')) {
          toast.warning("Maximum Teeth Selected", {
            description: "A maximum of 6 teeth in a single contiguous group can be selected.",
            duration: 6000,
          });
          return;
        }
      }

      updated[toothId] = activeIndication;
      const pos = getToothPosition(toothId);
      const currentIndications = getIndications();
      const color = currentIndications[activeIndication]?.hex || '#3b82f6';
      addRipple(pos.x, pos.y, color);
      updateChartState(updated, connections);
    }
  };

  const getToothQuadrantName = (id: number) => {
    const tooth = TEETH_DATA.find(t => t.id === id);
    if (!tooth) return '';
    const { q } = tooth;
    const quadrantNames: Record<number, string> = {
      1: 'Upper Right - Q1',
      2: 'Upper Left - Q2',
      3: 'Lower Left - Q3',
      4: 'Lower Right - Q4'
    };
    return quadrantNames[q];
  };

  const getToothAnatomicalName = (id: number) => {
    const tooth = TEETH_DATA.find(t => t.id === id);
    if (!tooth) return '';
    const { q, idx } = tooth;
    const names: Record<number, string> = {
      1: 'Central Incisor',
      2: 'Lateral Incisor',
      3: 'Canine',
      4: 'First Premolar',
      5: 'Second Premolar',
      6: 'First Molar',
      7: 'Second Molar',
      8: 'Third Molar'
    };
    const jaw = (q === 1 || q === 2) ? 'Maxillary' : 'Mandibular';
    const side = (q === 1 || q === 4) ? 'Right' : 'Left';
    return `${jaw} ${side} ${names[idx]}`;
  };

  const renderToolsSidebar = () => {
    const currentIndications = getIndications();
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Restoration Tools</p>
          <div className="grid gap-1.5">
            {Object.entries(currentIndications).filter(([k]) => k !== 'none').map(([key, info]) => {
              const isSelected = activeIndication === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveIndication(key)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-2 transition-all ${isSelected
                    ? 'border-blue-600 bg-blue-600/10 text-foreground'
                    : 'border-border bg-background hover:bg-muted text-foreground'
                    }`}
                >
                  <span className="w-3.5 h-3.5 rounded border border-black/10 shrink-0" style={{ backgroundColor: info.hex }} />
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {selectedTeeth.length > 0 && (
          <div className="text-[10px] text-muted-foreground border-t border-border pt-2.5 flex flex-col gap-1.5">
            <span>Configured teeth:</span>
            <div className="flex flex-wrap gap-1">
              {selectedTeeth.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChartingCanvas = (isFullscreenMode: boolean) => {
    const currentIndications = getIndications();
    return (
      <div
        className={`chart-container w-full h-full relative flex items-center justify-center bg-slate-950 select-none overflow-hidden ${isFullscreenMode ? '' : 'min-h-[400px] md:min-h-[480px] rounded-lg border border-slate-800'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes drawBridge {
            from {
              stroke-dashoffset: 120;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .bridge-line-anim {
            stroke-dasharray: 120;
            stroke-dashoffset: 120;
            animation: drawBridge 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
          
          @keyframes ripple {
            0% {
              transform: scale(0.6);
              opacity: 0.8;
            }
            100% {
              transform: scale(1.8);
              opacity: 0;
            }
          }
          .ripple-effect {
            animation: ripple 0.5s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          }
        `}} />

        {/* Bridge & Charting Legend (Top Left) */}
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 space-y-1.5 select-none max-w-[170px] pointer-events-none">
          <p className="font-bold text-[8px] uppercase tracking-wider text-slate-400 mb-1">Bridge Controls</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#1e1f1c] border border-slate-500 flex items-center justify-center font-bold text-[8px] text-slate-400 rotate-45 shrink-0"><span className="-rotate-45">+</span></span>
            <span>Click to add bridge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-[#06b6d4] border border-[#06b6d4] flex items-center justify-center font-bold text-[8px] text-slate-900 rotate-45 shrink-0"><span className="-rotate-45">✓</span></span>
            <span>Active Bridge</span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <div className="w-5 h-1.5 bg-[#06b6d4] border border-[#0f172a] rounded-full shrink-0" />
            <span>Bridge Connection</span>
          </div>
        </div>

        {/* Floating Canvas Controls (Top Right) */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setZoom(z => Math.min(z + 0.2, 3));
            }}
            title="Zoom In"
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(z => Math.max(z - 0.2, 0.8));
            }}
            title="Zoom Out"
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              panRef.current = { x: 0, y: 0 };
            }}
            title="Reset View"
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={() => setIsPanModeActive(!isPanModeActive)}
            title={isPanModeActive ? "Switch to Paint Mode" : "Switch to Pan Mode"}
            className={`p-1.5 rounded transition-colors ${isPanModeActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-850 text-slate-300 hover:text-white'}`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreenMode)}
            title={isFullscreenMode ? "Exit Fullscreen" : "Fullscreen Mode"}
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors"
          >
            {isFullscreenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Undo/Redo & Clear controls (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-1">
          <button
            type="button"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            title="Redo"
            className="p-1.5 hover:bg-slate-850 text-slate-300 hover:text-white rounded transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={handleClearAll}
            title="Clear All Charting"
            className="p-1.5 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Paint mode indicator (Bottom Right) */}
        <div className="absolute bottom-3 right-3 z-10 text-[10px] text-slate-500 bg-slate-900/55 backdrop-blur px-2.5 py-1 rounded border border-slate-800/60 font-medium">
          {isPanModeActive ? 'Pan Mode' : isPaintDragging ? `Painting (${paintMode})` : 'Paint Mode (Click & Drag)'}
        </div>

        {/* Main SVG workspace */}
        <div
          ref={svgContainerRef}
          className="w-full max-w-[520px] aspect-square transition-transform duration-100"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            cursor: isPanModeActive ? (isPanningRef.current ? 'grabbing' : 'grab') : 'default',
            willChange: 'transform'
          }}
        >
          <svg
            viewBox="0 0 800 800"
            className="w-full h-full overflow-visible"
            id="svg-chart"
          >
            {/* Background rect to capture events */}
            <rect id="svg-background" width="800" height="800" fill="transparent" />

            {/* Midline indicator */}
            <line id="midline-indicator" x1="400" y1="40" x2="400" y2="760" stroke="#3e3d32" strokeDasharray="4 4" strokeWidth="2" className="opacity-50" />

            {/* Individual Teeth Nodes */}
            {TEETH_DATA.map(tooth => {
              const pos = getToothPosition(tooth.id);
              const x = pos.x;
              const y = pos.y;
              const rot = pos.rot;
              const status = toothConfigs[tooth.id] || 'none';
              const info = currentIndications[status] || currentIndications.none;

              // Calculate radial offset coordinates for upright text labels (Center of ellipse is 400, 400)
              const vx = x - 400;
              const vy = y - 400;
              const len = Math.sqrt(vx * vx + vy * vy) || 1;
              const textOffsetX = (vx / len) * 44;
              const textOffsetY = (vy / len) * 44;

              return (
                <g
                  key={tooth.id}
                  className="cursor-pointer group/tooth"
                  onMouseDown={(e) => handleToothMouseDown(tooth.id, e)}
                  onMouseEnter={() => handleToothMouseEnter(tooth.id)}
                  onMouseMove={(e) => {
                    const container = e.currentTarget.closest('.chart-container');
                    if (container) {
                      const containerRect = container.getBoundingClientRect();
                      setTooltipPos({
                        x: e.clientX - containerRect.left,
                        y: e.clientY - containerRect.top
                      });
                    }
                    setHoveredTooth(tooth.id);
                  }}
                  onMouseLeave={() => setHoveredTooth(null)}
                  transform={`translate(${x}, ${y})`}
                >
                  <g
                    transform={`rotate(${rot})`}
                    className="transition-transform duration-250 ease-out origin-center group-hover/tooth:scale-[1.12]"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  >
                    {/* Interaction Hitbox */}
                    <rect x="-26" y="-26" width="52" height="52" fill="transparent" />

                    {/* Implant Screw */}
                    {info.hasScrew && (
                      <g transform="rotate(180)" className="transition-opacity duration-200">
                        <path d="M-5,-12 L5,-12 L4,-16 L-4,-16 Z" fill="#66d9ef" />
                        <path d="M-4,-16 L4,-16 L2.5,-35 L0,-40 L-2.5,-35 Z" fill="#3e3d32" />
                        <path d="M-4.5,-18 L4.5,-20 M-4.5,-22 L4.5,-24 M-4,-26 L4,-28 M-3.5,-30 L3.5,-32 M-3,-34 L3,-36" stroke="#f8f8f2" strokeWidth="1.5" fill="none" />
                      </g>
                    )}

                    {/* Standard Tooth Shape */}
                    <path
                      d={getPath(tooth.type)}
                      className={`transition-all duration-200 stroke-[2px] ${status !== 'none' ? 'stroke-blue-400' : 'stroke-slate-500 group-hover/tooth:stroke-cyan-400'
                        }`}
                      style={{ fill: info.hex }}
                    />

                    {/* Veneer */}
                    {info.isVeneer && (
                      <path
                        d={getVeneerArc(tooth.type)}
                        fill="none"
                        stroke="#f92672"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="pointer-events-none transition-all duration-200"
                      />
                    )}
                  </g>

                  {/* Tooth Identifier Text (Centered inside the tooth shape in high-contrast dark navy blue) */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    x="0"
                    y="1"
                    className="text-[10px] font-extrabold fill-[#091e3a] pointer-events-none select-none"
                  >
                    {tooth.id}
                  </text>
                </g>
              );
            })}

            {/* Bridge Connections (Rendered AFTER teeth so they capture clicks cleanly) */}
            {ADJACENT_PAIRS.map(([idA, idB]) => {
              const statusA = toothConfigs[idA];
              const statusB = toothConfigs[idB];
              if (!statusA || statusA === 'none' || !statusB || statusB === 'none') return null;

              const posA = getToothPosition(idA);
              const posB = getToothPosition(idB);
              const xA = posA.x;
              const yA = posA.y;
              const xB = posB.x;
              const yB = posB.y;

              // Use original orbital positioning logic for bridge dots
              const posDot = getBridgeButtonPosition(idA, idB);
              const dotX = posDot.x;
              const dotY = posDot.y;

              const connectionKey = `${idA}-${idB}`;
              const isConnected = connections.includes(connectionKey);

              return (
                <g key={connectionKey}>
                  {/* Routed line from tooth center through dot and back to adjacent tooth center */}
                  {isConnected && (
                    <path
                      d={`M ${xA} ${yA} L ${dotX} ${dotY} L ${xB} ${yB}`}
                      fill="none"
                      stroke="#a6e22e"
                      strokeWidth="2.5"
                      className="bridge-line-anim"
                    />
                  )}
                  {/* Circular button trigger */}
                  <g
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextConnections = connections.includes(connectionKey)
                        ? connections.filter(c => c !== connectionKey)
                        : [...connections, connectionKey];
                      updateChartState(toothConfigs, nextConnections);
                    }}
                  >
                    {/* Invisible larger hit area for easy clicking */}
                    <circle cx={dotX} cy={dotY} r="16" fill="transparent" />
                    {/* Visible circle */}
                    <circle
                      cx={dotX}
                      cy={dotY}
                      r="7.5"
                      fill={isConnected ? "#a6e22e" : "#1e1f1c"}
                      stroke={isConnected ? "#a6e22e" : "#475569"}
                      strokeWidth={isConnected ? "1" : "1.5"}
                      className="transition-all duration-200"
                    />
                    {/* Tiny plus icon when not connected */}
                    {!isConnected && (
                      <g stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round">
                        <line x1={dotX} y1={dotY - 2.5} x2={dotX} y2={dotY + 2.5} />
                        <line x1={dotX - 2.5} y1={dotY} x2={dotX + 2.5} y2={dotY} />
                      </g>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Ripples */}
            {ripples.map(r => (
              <circle
                key={r.id}
                cx={r.x}
                cy={r.y}
                r="30"
                fill="none"
                stroke={r.color}
                strokeWidth="3"
                className="ripple-effect pointer-events-none"
                style={{ transformOrigin: `${r.x}px ${r.y}px` }}
              />
            ))}
          </svg>
        </div>

        {/* Custom Tooltip */}
        {hoveredTooth !== null && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-800 text-white shadow-xl rounded-lg px-3 py-2 text-xs transition-all duration-75 flex flex-col gap-0.5"
            style={{ left: tooltipPos.x + 12, top: tooltipPos.y - 50 }}
          >
            <div className="font-bold flex items-center gap-1.5 text-slate-100">
              <span>Tooth {hoveredTooth}</span>
              <span className="text-[10px] text-slate-400 font-normal">({getToothQuadrantName(hoveredTooth)})</span>
            </div>
            <div className="text-[10px] text-slate-400 capitalize">{getToothAnatomicalName(hoveredTooth)}</div>
            <div className="mt-1 font-semibold text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentIndications[toothConfigs[hoveredTooth] || 'none']?.hex || '#ffffff' }} />
              <span>{currentIndications[toothConfigs[hoveredTooth] || 'none']?.label || 'Healthy / Clear'}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [occlusalClearance, setOcclusalClearance] = useState('Medium');
  const [contactDesign, setContactDesign] = useState('Normal');
  const [connectorDesign, setConnectorDesign] = useState('Anatomical');
  const [ponticDesign, setPonticDesign] = useState('Ovate');

  const steps = [
    { label: 'Admin', desc: 'Patient Info' },
    { label: 'Scan', desc: '3D Files' },
    { label: 'Model', desc: 'Teeth Chart' },
    { label: 'CAD', desc: 'Materials' },
    { label: 'CAM', desc: 'Due Date' }
  ];

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0:
        const isBasicComplete =
          patientName.trim().length > 0 &&
          selectedLabId !== '' &&
          treatmentType.length > 0 &&
          patientAge.trim().length > 0 &&
          !isNaN(Number(patientAge)) &&
          Number(patientAge) > 0 &&
          patientGender !== '';

        if (treatmentType.includes('Implant')) {
          if (implantBrand === '' || scanBodyModel === '' || analogLogistics === '' || implantBarNeeded === '') return false;
        }
        if (treatmentType.includes('Denture')) {
          if (dentureType === '') return false;
        }
        return isBasicComplete;
      case 1:
        if (treatmentType.includes('Surgical Guide')) {
          return selectedFile !== null && selectedDicomFile !== null && uploadState !== 'analyzing';
        }
        return selectedFile !== null && uploadState !== 'analyzing';
      case 2:
        const hasSelection = Object.values(toothConfigs).some(v => v !== 'none') || isTeethNotSpecified;
        if (!hasSelection) return false;

        if (treatmentType.some(t => ['CNB', 'Denture', 'Veneer', 'Implant'].includes(t))) {
          const upperMax = getArchMaxGroupSize(UPPER_ARCH_ORDER, toothConfigs);
          const lowerMax = getArchMaxGroupSize(LOWER_ARCH_ORDER, toothConfigs);
          if (upperMax > 6 || lowerMax > 6) {
            return false;
          }
        }
        return true;
      case 3:
        return isDesignNotSpecified || (material !== '' && shade !== '');
      case 4:
        return dueDate !== '';
      default:
        return false;
    }
  };

  useEffect(() => {
    setSelectedTeeth(
      Object.keys(toothConfigs)
        .map(Number)
        .filter(id => toothConfigs[id] !== 'none')
        .sort((a, b) => a - b)
    );
  }, [toothConfigs]);

  const renderShadeGrid = (onSelect: (shade: string) => void, selectedShade?: string) => {
    const groups = ['A', 'B', 'C', 'D'];
    return (
      <div className="space-y-2">
        {groups.map(group => (
          <div key={group} className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground w-4">{group}</span>
            <div className="flex gap-1.5">
              {VITA_SHADES.filter(s => s.group === group).map(shadeItem => (
                <button
                  key={shadeItem.code}
                  type="button"
                  onClick={() => onSelect(shadeItem.code)}
                  className={`w-8 h-8 rounded text-[8px] font-bold flex items-center justify-center border transition-all ${selectedShade === shadeItem.code
                    ? 'border-2 border-primary shadow-md scale-105'
                    : 'border border-border hover:scale-105'
                    }`}
                  style={{ backgroundColor: shadeItem.hex }}
                  title={shadeItem.code}
                >
                  <span className="text-zinc-700">{shadeItem.code}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: invData } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id);

      if (invData) {
        setInventory(invData.map((item: any) => ({
          id: item.id,
          dentistId: item.dentist_id,
          labId: item.lab_id,
          materialName: item.material_name,
          totalUnits: item.total_units,
          remainingUnits: item.remaining_units,
          lockedPrice: item.locked_price
        })));
      }
    };

    const fetchNotifications = async () => {
      const { data: timelineData, error } = await supabase
        .from('timeline_events')
        .select(`
          id,
          status_update,
          notes,
          timestamp,
          case_id,
          cases!inner(patient_name, dentist_id)
        `)
        .eq('cases.dentist_id', currentUser.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (timelineData) {
        setNotifications(timelineData.map((n: any) => ({
          id: n.id,
          statusUpdate: n.status_update,
          notes: n.notes,
          timestamp: n.timestamp,
          caseId: n.case_id,
          patientName: n.cases.patient_name
        })));
      }
    };

    fetchData();
    fetchNotifications();

    const channel = supabase.channel('dentist_cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        const eventType = payload.eventType;
        const newCase = payload.new as any;

        if (eventType === 'UPDATE') {
          toast.info(`Case updated: ${newCase.patient_name}'s status is now ${newCase.status}`);
          setCases(prev => prev.map(c => c.id === newCase.id ? {
            ...c,
            status: newCase.status,
            urgency: newCase.urgency,
            requestedTreatment: newCase.requested_treatment,
            material: newCase.material,
            scanUrl: newCase.scan_url,
            deliveryTrackingId: newCase.delivery_tracking_id
          } : c));
          fetchData();
          fetchNotifications();
        }
        router.refresh();
      })
      .subscribe();

    const timelineChannel = supabase.channel('dentist_timeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_events', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(timelineChannel);
    };
  }, [currentUser.id, router, supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const baseName = file.name.replace(/\.(stl|ply)$/i, '');
      let nameGuess = baseName
        .replace(/(upper|lower|bite|arch|scan|prep|mesh)/gi, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (nameGuess) {
        nameGuess = nameGuess.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!patientName) {
          setPatientName(nameGuess);
          toast.success(`Auto-filled Patient Name: "${nameGuess}"`);
        }
      }

      setUploadState('analyzing');
      try {
        const result = await validateSTLFile(file);
        if (!result.isValid) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else if (result.warnings.length > 0) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else {
          setUploadState('idle');
          setValidationWarnings([]);
        }
        if (result.dimensions) {
          setValidationDimensions(result.dimensions);
        }
      } catch (err) {
        console.error('STL validation error:', err);
        setUploadState('idle');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDicomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedDicomFile(e.target.files[0]);
      toast.success(`DICOM Scan attached: "${e.target.files[0].name}"`);
    }
  };

  const handleDicomUploadClick = () => {
    dicomInputRef.current?.click();
  };

  const handleShadePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setShadePhotoFile(e.target.files[0]);
      toast.success(`Shade reference photo attached: "${e.target.files[0].name}"`);
    }
  };

  const handleShadePhotoClick = () => {
    shadePhotoInputRef.current?.click();
  };

  const handleSubmitCase = async (isDraft: boolean = false) => {
    if (!patientName.trim() || !selectedFile || !selectedLabId) {
      alert('Please fill out patient name, select a lab, and select a scan file.');
      return;
    }

    if (treatmentType.includes('Surgical Guide') && !selectedDicomFile) {
      alert('Please upload DICOM file for surgical guide.');
      return;
    }

    if (treatmentType.some(t => ['CNB', 'Denture', 'Veneer', 'Implant'].includes(t))) {
      const upperMax = getArchMaxGroupSize(UPPER_ARCH_ORDER, toothConfigs);
      const lowerMax = getArchMaxGroupSize(LOWER_ARCH_ORDER, toothConfigs);
      if (upperMax > 6 || lowerMax > 6) {
        alert('A maximum of 6 teeth in a single contiguous group can be selected.');
        return;
      }
    }

    setUploadState('uploading');
    setUploadProgress(0);

    try {
      // Collect all files to upload
      const filesToUpload: { file: File; contentType: string; label: string }[] = [];
      if (selectedFile) filesToUpload.push({ file: selectedFile, contentType: 'application/octet-stream', label: 'scan' });
      if (selectedDicomFile) filesToUpload.push({ file: selectedDicomFile, contentType: 'application/dicom', label: 'dicom' });
      if (shadePhotoFile) filesToUpload.push({ file: shadePhotoFile, contentType: shadePhotoFile.type || 'image/jpeg', label: 'shade' });

      // Upload all files with combined progress
      const totalSize = filesToUpload.reduce((sum, f) => sum + f.file.size, 0);
      let uploadedBytes = 0;
      const uploadResults: Record<string, string | null> = {};

      for (const { file, contentType, label } of filesToUpload) {
        const fileStartBytes = uploadedBytes;
        const fileProgress = (pct: number) => {
          const fileBytesUploaded = (pct / 100) * file.size;
          const overallPct = Math.round(((fileStartBytes + fileBytesUploaded) / totalSize) * 100);
          setUploadProgress(overallPct);
        };

        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType }),
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `Presign failed (${res.status})`);
          }
          const { url: signedUrl, key } = await res.json();

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signedUrl, true);
            xhr.setRequestHeader('Content-Type', contentType);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                fileProgress(Math.round((e.loaded / e.total) * 100));
              }
            };
            xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT failed: ${xhr.status}`)));
            xhr.onerror = () => reject(new Error('Network error during upload'));
            xhr.send(file);
          });

          uploadResults[label] = key;
        } catch (err: any) {
          console.error(`${label} upload error:`, err);
          uploadResults[label] = null;
        }
        uploadedBytes += file.size;
      }

      const scanUrl = uploadResults['scan'] ?? null;
      const dicomUrl = uploadResults['dicom'] ?? null;
      const shadePhotoUrl = uploadResults['shade'] ?? null;

      if (selectedFile && !scanUrl) {
        alert('Warning: Scan file upload failed. The case will be created without the file.');
      }
      if (selectedDicomFile && !dicomUrl) {
        alert('Warning: DICOM file upload failed.');
      }

      const designParams: Record<string, any> = {
        occlusalClearance,
        contactDesign,
        connectorDesign,
        ponticDesign,
      };
      const filteredConfigs = Object.fromEntries(
        Object.entries(toothConfigs).filter(([_, v]) => v !== 'none')
      );
      if (Object.keys(filteredConfigs).length > 0) {
        designParams.toothConfigs = filteredConfigs;
      }
      if (connections.length > 0) {
        designParams.connections = connections;
      }
      if (customShadeEnabled) {
        designParams.customShade = {
          enabled: true,
          cervical: cervicalShade,
          body: bodyShade,
          incisal: incisalShade,
        };
      }
      if (characterizations.length > 0) {
        designParams.characterizations = characterizations;
      }
      if (shadePhotoUrl) {
        designParams.shadePhotoUrl = shadePhotoUrl;
      }
      const designParamsJson = JSON.stringify(designParams, null, 2);
      const enhancedInstructions = instructions
        ? `${instructions}\n\n[Design Parameters]: ${designParamsJson}`
        : `[Design Parameters]: ${designParamsJson}`;

      const dbCase = {
        patient_name: patientName,
        dentist_id: currentUser.id,
        lab_id: selectedLabId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requested_treatment: treatmentType.map(t => t === 'Denture' && dentureType ? `Denture (${dentureType})` : t).join(', ') || 'Not Specified',
        material: isDesignNotSpecified ? 'Not Specified' : material,
        scan_url: scanUrl,
        dicom_url: dicomUrl,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shade: isDesignNotSpecified ? 'Not Specified' : shade,
        selected_teeth: isTeethNotSpecified ? null : selectedTeeth,
        instructions: enhancedInstructions || null,
        patient_age: patientAge ? parseInt(patientAge, 10) : null,
        patient_gender: patientGender || null,
        implant_brand: treatmentType.includes('Implant') ? (implantBarNeeded !== 'No bar needed' && implantBarNeeded !== '' ? `${implantBrand} (Bar: ${implantBarNeeded})` : implantBrand) : null,
        scan_body_model: treatmentType.includes('Implant') ? scanBodyModel : null,
        analog_logistics: treatmentType.includes('Implant') ? analogLogistics : null
      };

      const { data: insertedCase, error: insertError } = await supabase
        .from('cases')
        .insert([dbCase])
        .select()
        .single();

      if (insertError) {
        console.error('DB Insert Error:', insertError);
        alert('Error inserting case: ' + insertError.message);
      } else if (insertedCase) {
        await supabase.from('timeline_events').insert({
          case_id: insertedCase.id,
          status_update: isDraft ? 'Draft Saved' : 'Case Created',
          notes: isDraft ? 'Dentist saved case as draft.' : 'Dentist submitted new case.',
          visibility: 'BOTH'
        });

        if (!isDraft) {
          const { data: invData } = await supabase
            .from('doctor_inventory')
            .select('*')
            .eq('dentist_id', currentUser.id);

          if (invData) {
            setInventory(invData.map((item: any) => ({
              id: item.id,
              dentistId: item.dentist_id,
              labId: item.lab_id,
              materialName: item.material_name,
              totalUnits: item.total_units,
              remainingUnits: item.remaining_units,
              lockedPrice: item.locked_price
            })));
          }
        }
      }

      const newCase: Case = {
        id: insertedCase ? insertedCase.id : `case-${Date.now().toString().slice(-4)}`,
        patientName,
        dentistId: currentUser.id,
        labId: selectedLabId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requestedTreatment: dbCase.requested_treatment,
        material: dbCase.material,
        createdAt: new Date().toISOString(),
        dueDate: dbCase.due_date,
        shade: dbCase.shade,
        selectedTeeth: isTeethNotSpecified ? undefined : selectedTeeth,
        instructions: enhancedInstructions || undefined,
        dicomUrl: dicomUrl || undefined,
        patientAge: dbCase.patient_age || undefined,
        patientGender: (dbCase.patient_gender as any) || undefined,
        implantBrand: dbCase.implant_brand || undefined,
        scanBodyModel: dbCase.scan_body_model || undefined,
        analogLogistics: dbCase.analog_logistics || undefined
      };

      setCases(prev => [newCase, ...prev]);
      router.refresh();
      setIsCreateModalOpen(false);

      setPatientName('');
      setTreatmentType([]);
      setDentureType('');
      setUrgency('NORMAL');
      setDueDate('');
      setSelectedFile(null);
      setSelectedDicomFile(null);
      setUploadState('idle');
      setValidationWarnings([]);
      setValidationDimensions(null);
      setSelectedTeeth([]);
      setIsTeethNotSpecified(false);
      setMaterial('Zirconia HT');
      setShade('A2');
      setIsDesignNotSpecified(false);
      setInstructions('');
      setCurrentStep(0);
      setCustomShadeEnabled(false);
      setCervicalShade('A2');
      setBodyShade('A2');
      setIncisalShade('A2');
      setCharacterizations([]);
      setShadePhotoFile(null);
      setActiveZone(null);
      setCarouselPanel('material');
      setToothConfigs({});
      setOcclusalClearance('Medium');
      setContactDesign('Normal');
      setConnectorDesign('Anatomical');
      setPonticDesign('Ovate');
      setActiveIndication('coping');
      setConnections([]);

      toast.success(isDraft ? 'Case saved as draft!' : 'Case successfully submitted!');

    } catch (err) {
      console.error('Submission error:', err);
      setUploadState('idle');
    }
  };

  const activeCasesCount = cases.filter(c => c.status !== 'DELIVERED').length;
  const completedCasesCount = cases.filter(c => c.status === 'DELIVERED').length;
  const pendingCasesCount = cases.filter(c => c.status === 'PENDING').length;
  const inProgressCasesCount = cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'QUALITY_CHECK' || c.status === 'DISPATCHED').length;

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  const currentIndications = getIndications();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dentist Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your patients' lab cases and track progress.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch mb-6">
        <SummaryChart cases={cases} />
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Case Breakdown</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
              <span className="font-semibold">{pendingCasesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <span className="font-semibold">{inProgressCasesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-muted-foreground">Completed</span>
              </div>
              <span className="font-semibold">{completedCasesCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered this month</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300">You have no cases requiring immediate attention. Great job!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Box className="w-5 h-5 text-primary" /> Virtual Inventory (Bulk Orders)</CardTitle>
              <CardDescription>Track your pre-purchased materials with partner labs.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/inventory')}>
              Purchase More
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.length === 0 ? (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <p>No active bulk inventory found.</p>
                  <p className="text-sm mt-1">Purchase materials from a lab partner to lock in pricing.</p>
                </div>
              ) : inventory.map(item => {
                const lab = availableLabs.find(l => l.id === item.labId);
                const percentage = (item.remainingUnits / item.totalUnits) * 100;
                return (
                  <div key={item.id} className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.materialName}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {lab?.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">{item.lockedPrice.replace('$', '₹')}/unit</Badge>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.remainingUnits} units left</span>
                        <span className="text-muted-foreground">of {item.totalUnits}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border flex flex-col h-full min-h-[220px]">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Production Tracking
            </CardTitle>
            <CardDescription className="text-xs">Real-time laboratory updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-8">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
                <p>No recent status updates.</p>
                <p className="text-[10px] mt-0.5">Updates appear here when the lab advances your cases.</p>
              </div>
            ) : (
              <div className="space-y-4 pl-4 border-l border-border relative">
                {notifications.map((n) => (
                  <div key={n.id} className="relative group text-xs text-left">
                    <div className="absolute -left-[21px] top-1 bg-background rounded-full p-0.5 border border-background">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-foreground text-xs truncate max-w-[120px]">{n.patientName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">{n.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Case Submissions</CardTitle>
            <CardDescription>View and track your patients' restorations.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'ALL')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="QUALITY_CHECK">QC Hold</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Case ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{caseItem.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {caseItem.patientName}
                        {caseItem.patientGender === 'MALE' && (
                          <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted text-[9px] px-1 py-0 h-4">M</Badge>
                        )}
                        {caseItem.patientGender === 'FEMALE' && (
                          <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted text-[9px] px-1 py-0 h-4">F</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.requestedTreatment}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(caseItem.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <StatusBadge status={caseItem.status} />
                        {caseItem.urgency === 'URGENT' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <FileBox className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setTimeout(() => {
            setUploadState('idle');
            setSelectedFile(null);
            setPatientName('');
            setTreatmentType([]);
            setDentureType('');
            setUrgency('NORMAL');
            setDueDate('');
            setValidationWarnings([]);
            setValidationDimensions(null);
            setSelectedTeeth([]);
            setIsTeethNotSpecified(false);
            setMaterial('Zirconia HT');
            setShade('A2');
            setIsDesignNotSpecified(false);
            setInstructions('');
            setPatientAge('');
            setPatientGender('');
            setImplantBrand('');
            setScanBodyModel('');
            setAnalogLogistics('');
            setImplantBarNeeded('');
            setCurrentStep(0);
            setCustomShadeEnabled(false);
            setCervicalShade('A2');
            setBodyShade('A2');
            setIncisalShade('A2');
            setCharacterizations([]);
            setShadePhotoFile(null);
            setActiveZone(null);
            setCarouselPanel('material');
            setToothConfigs({});
            setOcclusalClearance('Medium');
            setContactDesign('Normal');
            setConnectorDesign('Anatomical');
            setPonticDesign('Ovate');
            setActiveIndication('coping');
            setConnections([]);
          }, 300);
        }
      }}>
        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary-hover p-0 z-50 focus:outline-none" />}>
          <Plus className="h-6 w-6 text-primary-foreground" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[950px] w-[95vw] h-[90vh] md:h-[80vh] flex flex-col bg-background border-border p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b border-border">
            <DialogTitle className="text-foreground">Create New Lab Case</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a new prescription to the dental laboratory using Sirona-style 5-Tab Pipeline.
            </DialogDescription>
          </DialogHeader>



          <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
            {/* Left sidebar - Vertical Timeline */}
            <div className="w-full md:w-[220px] bg-muted/20 border-b md:border-b-0 md:border-r border-border p-4 md:p-6 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible shrink-0">
              {steps.map((step, idx) => {
                const isCurrent = idx === currentStep;
                const isDone = idx < currentStep || isStepComplete(idx);
                const isSelectable = idx === 0 || Array.from({ length: idx }).every((_, i) => isStepComplete(i));
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!isSelectable}
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg transition-all focus:outline-none relative group ${isCurrent
                      ? 'bg-primary/10 text-primary font-semibold'
                      : isDone
                        ? 'text-emerald-600 hover:bg-muted dark:text-emerald-400'
                        : 'text-muted-foreground hover:bg-muted'
                      } ${!isSelectable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Step indicator circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold shrink-0 transition-colors ${isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isDone
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-muted-foreground/30'
                      }`}>
                      {idx + 1}
                    </div>

                    {/* Step labels */}
                    <div className="hidden md:flex flex-col">
                      <span className="text-xs font-semibold leading-tight">{step.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{step.desc}</span>
                    </div>

                    {/* Mobile label */}
                    <span className="text-[10px] font-medium md:hidden">{step.label}</span>

                    {/* Pulsating active indicator */}
                    {isCurrent && (
                      <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right step content with sliding carousel */}
            <div className="flex-1 p-6 overflow-y-auto min-w-0">
              <div className="relative w-full overflow-hidden">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentStep * 100}%)` }}
                >
                  {/* Step 0: Admin */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid gap-2">
                        <Label htmlFor="patientName" className="text-foreground">Patient Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="patientName"
                          placeholder="e.g. John Doe"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="border-border text-foreground bg-background"
                        />
                        <p className="text-xs text-muted-foreground">Or upload a scan file in the next step to auto-extract the name.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="patientAge" className="text-foreground">Patient Age <span className="text-red-500">*</span></Label>
                          <Input
                            id="patientAge"
                            type="number"
                            placeholder="Age"
                            value={patientAge}
                            onChange={(e) => setPatientAge(e.target.value)}
                            className="border-border text-foreground bg-background"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="patientGender" className="text-foreground">Patient Gender <span className="text-red-500">*</span></Label>
                          <Select value={patientGender} onValueChange={(val) => setPatientGender((val as any) || '')}>
                            <SelectTrigger className="border-border text-foreground bg-background">
                              <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="treatmentType" className="text-foreground">Treatment Type <span className="text-red-500">*</span></Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between border-border text-foreground bg-background font-normal" />}>
                            <span className="truncate">
                              {treatmentType.length > 0 ? treatmentType.join(', ') : "Select treatment types"}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[300px]">
                            {[
                              { id: 'CNB', label: 'CNB (Crown and Bridge)' },
                              { id: 'Denture', label: 'Denture' },
                              { id: 'Veneer', label: 'Veneer' },
                              { id: 'Implant', label: 'Implant' },
                              { id: 'Surgical Guide', label: 'Surgical Guide' }
                            ].map(type => (
                              <DropdownMenuCheckboxItem
                                key={type.id}
                                checked={treatmentType.includes(type.id)}
                                onCheckedChange={(checked) => {
                                  let newTypes = [...treatmentType];
                                  if (checked) {
                                    newTypes.push(type.id);
                                  } else {
                                    newTypes = newTypes.filter(t => t !== type.id);
                                  }
                                  setTreatmentType(newTypes);

                                  if (!newTypes.includes('Implant')) {
                                    setImplantBrand('');
                                    setScanBodyModel('');
                                    setAnalogLogistics('');
                                    setImplantBarNeeded('');
                                  }
                                  if (!newTypes.includes('Denture')) {
                                    setDentureType('');
                                  }

                                  if (newTypes.some(t => ['CNB', 'Denture', 'Veneer', 'Implant'].includes(t))) {
                                    const upperMax = getArchMaxGroupSize(UPPER_ARCH_ORDER, toothConfigs);
                                    const lowerMax = getArchMaxGroupSize(LOWER_ARCH_ORDER, toothConfigs);
                                    if (upperMax > 6 || lowerMax > 6) {
                                      setShowArchLimitPopup(true);
                                    }
                                  }
                                }}
                              >
                                {type.label}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {treatmentType.includes('Implant') && (
                        <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Implant Workflow Configurations</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <Label htmlFor="implantBrand" className="text-xs">Implant Brand <span className="text-red-500">*</span></Label>
                              <Select value={implantBrand} onValueChange={(val) => setImplantBrand(val || '')}>
                                <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                                  <SelectValue placeholder="Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Osstem">Osstem</SelectItem>
                                  <SelectItem value="Dentium">Dentium</SelectItem>
                                  <SelectItem value="Nobel Biocare">Nobel Biocare</SelectItem>
                                  <SelectItem value="Straumann">Straumann</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1.5">
                              <Label htmlFor="scanBodyModel" className="text-xs">Scan Body Type <span className="text-red-500">*</span></Label>
                              <Select value={scanBodyModel} onValueChange={(val) => setScanBodyModel(val || '')}>
                                <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                                  <SelectValue placeholder="Scan Body" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Short">Short</SelectItem>
                                  <SelectItem value="Long">Long</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <Label htmlFor="analogLogistics" className="text-xs">Prosthetic Components Logistics <span className="text-red-500">*</span></Label>
                              <Select value={analogLogistics} onValueChange={(val) => setAnalogLogistics(val || '')}>
                                <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select who provides analogs/parts" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Doctor Provided">Doctor Provided (Component sent to lab)</SelectItem>
                                  <SelectItem value="Lab Provided">Lab Provided (Lab supplies component)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1.5">
                              <Label htmlFor="implantBarNeeded" className="text-xs">Bar Needed <span className="text-red-500">*</span></Label>
                              <Select value={implantBarNeeded} onValueChange={(val) => setImplantBarNeeded(val || '')}>
                                <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select bar option" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="I-bar">I-bar</SelectItem>
                                  <SelectItem value="Full Mouth bar">Full Mouth bar</SelectItem>
                                  <SelectItem value="No bar needed">No bar needed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      {treatmentType.includes('Denture') && (
                        <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Denture Workflow Configurations</p>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="grid gap-1.5">
                              <Label htmlFor="dentureType" className="text-xs">Type of Denture <span className="text-red-500">*</span></Label>
                              <Select value={dentureType} onValueChange={(val) => setDentureType(val || '')}>
                                <SelectTrigger className="border-border text-foreground h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Fixed Partial Denture">Fixed Partial Denture</SelectItem>
                                  <SelectItem value="Removable Partial Denture">Removable Partial Denture</SelectItem>
                                  <SelectItem value="Complete Denture">Complete Denture</SelectItem>
                                  <SelectItem value="Full Mouth Denture">Full Mouth Denture</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-2">
                        <Label htmlFor="lab" className="text-foreground">Assign to Laboratory <span className="text-red-500">*</span></Label>
                        <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')} disabled>
                          <SelectTrigger className="border-border text-foreground">
                            <SelectValue placeholder="Select a laboratory" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableLabs.map(lab => (
                              <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="urgency" className="text-foreground">Urgency <span className="text-red-500">*</span></Label>
                        <Select value={urgency} onValueChange={(val) => setUrgency((val as Case['urgency']) || 'NORMAL')}>
                          <SelectTrigger className="border-border text-foreground">
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="NORMAL">Normal</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Scan */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <Label className="text-foreground mb-2 block">Upload 3D Scan (STL/PLY) <span className="text-red-500">*</span></Label>
                        <input
                          type="file"
                          accept=".stl,.ply"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />

                        {uploadState === 'idle' && !selectedFile && (
                          <div
                            onClick={handleUploadClick}
                            className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                          >
                            <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium text-foreground">Drag & Drop STL/PLY Files Here</p>
                            <p className="text-xs text-muted-foreground mt-1">or click to browse from your computer</p>
                          </div>
                        )}

                        {selectedFile && (
                          <div className="space-y-4">
                            <div
                              onClick={handleUploadClick}
                              className="border-2 border-blue-600/40 rounded-lg p-4 flex items-center gap-4 bg-blue-600/5 cursor-pointer hover:bg-blue-600/10 transition-colors"
                            >
                              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                                </p>
                              </div>
                            </div>

                            {uploadState === 'analyzing' && (
                              <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                                <Activity className="h-8 w-8 text-blue-600 mb-2 animate-pulse" />
                                <p className="text-sm font-medium text-foreground">Analyzing STL geometry bounds...</p>
                                <div className="w-full max-w-xs bg-muted rounded-full h-1 mt-3 overflow-hidden">
                                  <div className="bg-blue-600 h-1 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                                </div>
                              </div>
                            )}

                            {uploadState === 'warning' && (
                              <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                  <Activity className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                                  Pre-Flight Analysis Alerts
                                </h4>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                  {validationWarnings.map((warn, i) => (
                                    <li key={i} className="text-xs text-amber-700 dark:text-amber-400">{warn}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {validationDimensions && (
                              <div className="border border-border rounded-lg p-3 bg-muted/20 text-xs flex justify-around text-foreground">
                                <div><span className="font-semibold">Width (X):</span> {validationDimensions.x.toFixed(1)} mm</div>
                                <div><span className="font-semibold">Length (Y):</span> {validationDimensions.y.toFixed(1)} mm</div>
                                <div><span className="font-semibold">Height (Z):</span> {validationDimensions.z.toFixed(1)} mm</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {treatmentType.includes('Surgical Guide') && (
                        <div className="border-t border-border pt-4 mt-4">
                          <Label className="text-foreground mb-2 block">Upload DICOM / CBCT Scan (DCM/ZIP) <span className="text-red-500">*</span></Label>
                          <input
                            type="file"
                            accept=".dcm,.zip,.rar"
                            className="hidden"
                            ref={dicomInputRef}
                            onChange={handleDicomFileChange}
                          />

                          {!selectedDicomFile ? (
                            <div
                              onClick={handleDicomUploadClick}
                              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                            >
                              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm font-medium text-foreground">Drag & Drop DICOM Files Here</p>
                              <p className="text-xs text-muted-foreground mt-0.5">or click to browse (.dcm, .zip)</p>
                            </div>
                          ) : (
                            <div
                              onClick={handleDicomUploadClick}
                              className="border border-emerald-500/30 rounded-lg p-4 flex items-center gap-4 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4 text-emerald-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{selectedDicomFile.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {(selectedDicomFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Model */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {false ? null : (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <Label className="text-foreground font-semibold text-sm">Tooth Charting & Restoration Properties</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="teethNotSpecified"
                                checked={isTeethNotSpecified}
                                onChange={(e) => {
                                  setIsTeethNotSpecified(e.target.checked);
                                  if (e.target.checked) {
                                    setSelectedTeeth([]);
                                    setToothConfigs({});
                                    setConnections([]);
                                  }
                                }}
                                className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                              />
                              <Label htmlFor="teethNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                            </div>
                          </div>

                          {!isTeethNotSpecified ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-border rounded-lg p-3 bg-muted/10">
                              <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-3">
                                {renderToolsSidebar()}
                              </div>

                              <div className="md:col-span-2">
                                {renderChartingCanvas(false)}
                              </div>
                            </div>
                          ) : (
                            <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                              No teeth configured (Case parameters general)
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border">
                            <div className="grid gap-1">
                              <Label htmlFor="occlusalClearance" className="text-[11px] text-foreground">Occlusal Clearance</Label>
                              <Select value={occlusalClearance} onValueChange={(val) => setOcclusalClearance(val || 'Medium')}>
                                <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="High">High</SelectItem>
                                  <SelectItem value="Medium">Medium</SelectItem>
                                  <SelectItem value="Light">Light</SelectItem>
                                  <SelectItem value="Out of Occlusion">Out of Occlusion</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor="contactDesign" className="text-[11px] text-foreground">Contact Design</Label>
                              <Select value={contactDesign} onValueChange={(val) => setContactDesign(val || 'Normal')}>
                                <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Tight">Tight</SelectItem>
                                  <SelectItem value="Normal">Normal</SelectItem>
                                  <SelectItem value="Light">Light</SelectItem>
                                  <SelectItem value="Open">Open</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor="connectorDesign" className="text-[11px] text-foreground">Connector Design</Label>
                              <Select value={connectorDesign} onValueChange={(val) => setConnectorDesign(val || 'Anatomical')}>
                                <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Anatomical">Anatomical</SelectItem>
                                  <SelectItem value="Reduced">Reduced</SelectItem>
                                  <SelectItem value="Knife Edge">Knife Edge</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor="ponticDesign" className="text-[11px] text-foreground">Pontic Design</Label>
                              <Select value={ponticDesign} onValueChange={(val) => setPonticDesign(val || 'Ovate')}>
                                <SelectTrigger className="h-8 text-xs border-border text-foreground bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Sanitary">Sanitary</SelectItem>
                                  <SelectItem value="Saddle">Saddle</SelectItem>
                                  <SelectItem value="Ovate">Ovate</SelectItem>
                                  <SelectItem value="Modified Ridge Lap">Modified Ridge Lap</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Step 3: CAD */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-foreground">Restoration Materials & Shade</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="designNotSpecified"
                            checked={isDesignNotSpecified}
                            onChange={(e) => {
                              setIsDesignNotSpecified(e.target.checked);
                            }}
                            className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                          />
                          <Label htmlFor="designNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                        </div>
                      </div>

                      {!isDesignNotSpecified ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                            <span className={carouselPanel === 'material' ? 'font-bold text-blue-600' : ''}>1. Material</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className={carouselPanel === 'shade' ? 'font-bold text-blue-600' : ''}>2. Shade</span>
                          </div>

                          <div className="overflow-hidden">
                            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${carouselPanel === 'shade' ? 100 : 0}%)` }}>
                              <div className="w-full shrink-0 pr-1">
                                <div className="grid gap-2">
                                  {MATERIALS.map(mat => (
                                    <button
                                      key={mat.value}
                                      type="button"
                                      onClick={() => {
                                        setMaterial(mat.value);
                                        setCarouselPanel('shade');
                                      }}
                                      className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${material === mat.value
                                        ? 'border-blue-600 bg-blue-600/10 shadow-sm'
                                        : 'border-border bg-background hover:bg-muted/50'
                                        }`}
                                    >
                                      <span className="text-sm font-medium text-foreground">{mat.label}</span>
                                      {material === mat.value && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="w-full shrink-0 pl-1 space-y-4">
                                <button
                                  type="button"
                                  onClick={() => setCarouselPanel('material')}
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  Back to Material
                                </button>

                                <div className="text-xs text-muted-foreground">
                                  Material: <span className="font-semibold text-foreground">{MATERIALS.find(m => m.value === material)?.label}</span>
                                </div>

                                <div>
                                  <Label className="text-foreground mb-2 block text-sm">Shade-Code <span className="text-red-500">*</span></Label>
                                  {renderShadeGrid((s) => setShade(s), shade)}
                                </div>

                                <div className="border-t border-border pt-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <input
                                      type="checkbox"
                                      id="customShadeEnabled"
                                      checked={customShadeEnabled}
                                      onChange={(e) => {
                                        setCustomShadeEnabled(e.target.checked);
                                        if (!e.target.checked) setActiveZone(null);
                                      }}
                                      className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                                    />
                                    <Label htmlFor="customShadeEnabled" className="text-sm text-foreground cursor-pointer">Enable Custom Shading (3-Zone)</Label>
                                  </div>

                                  {customShadeEnabled && (
                                    <div className="space-y-3">
                                      <div className="flex gap-3 items-start">
                                        <div className="flex flex-col justify-between text-[8px] text-muted-foreground py-1" style={{ height: '120px' }}>
                                          <span>Cervical</span>
                                          <span>Body</span>
                                          <span>Incisal</span>
                                        </div>
                                        <svg viewBox="0 0 80 120" className="w-20 shrink-0" style={{ height: '120px' }}>
                                          <defs>
                                            <clipPath id="toothClip">
                                              <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 L 40 118 L 25 105 L 20 80 L 17 45 Z" />
                                            </clipPath>
                                          </defs>
                                          <rect x="0" y="0" width="80" height="40"
                                            fill={SHADE_HEX_MAP[cervicalShade] || '#ebdccb'}
                                            clipPath="url(#toothClip)"
                                            onClick={() => setActiveZone(activeZone === 'cervical' ? null : 'cervical')}
                                            className="cursor-pointer transition-opacity hover:opacity-80" />
                                          <rect x="0" y="40" width="80" height="40"
                                            fill={SHADE_HEX_MAP[bodyShade] || '#ebdccb'}
                                            clipPath="url(#toothClip)"
                                            onClick={() => setActiveZone(activeZone === 'body' ? null : 'body')}
                                            className="cursor-pointer transition-opacity hover:opacity-80" />
                                          <rect x="0" y="80" width="80" height="40"
                                            fill={SHADE_HEX_MAP[incisalShade] || '#ebdccb'}
                                            clipPath="url(#toothClip)"
                                            onClick={() => setActiveZone(activeZone === 'incisal' ? null : 'incisal')}
                                            className="cursor-pointer transition-opacity hover:opacity-80" />
                                          <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 L 40 118 L 25 105 L 20 80 L 17 45 Z"
                                            fill="none" stroke="#999" strokeWidth="1.5" />
                                          <line x1="15" y1="40" x2="65" y2="40" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                                          <line x1="18" y1="80" x2="62" y2="80" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                                          {activeZone === 'cervical' && <rect x="0" y="0" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                          {activeZone === 'body' && <rect x="0" y="40" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                          {activeZone === 'incisal' && <rect x="0" y="80" width="80" height="40" fill="none" stroke="#3b82f6" strokeWidth="2" clipPath="url(#toothClip)" />}
                                        </svg>

                                        {/* Floating shade picker for active zone */}
                                        <div className="flex-1 min-w-0">
                                          {activeZone ? (
                                            <div className="border border-blue-600/30 rounded-lg p-3 bg-blue-600/5">
                                              <p className="text-xs font-semibold text-foreground mb-2">
                                                Select shade for {activeZone === 'cervical' ? 'Cervical' : activeZone === 'body' ? 'Body' : 'Incisal'} zone:
                                              </p>
                                              {renderShadeGrid(
                                                (s) => {
                                                  if (activeZone === 'cervical') setCervicalShade(s);
                                                  else if (activeZone === 'body') setBodyShade(s);
                                                  else setIncisalShade(s);
                                                },
                                                activeZone === 'cervical' ? cervicalShade : activeZone === 'body' ? bodyShade : incisalShade
                                              )}
                                            </div>
                                          ) : (
                                            <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                                              Click a zone on the tooth to select its shade.
                                              <div className="mt-2 space-y-1 text-left inline-block">
                                                <div>Cervical: <span className="font-semibold">{cervicalShade}</span></div>
                                                <div>Body: <span className="font-semibold">{bodyShade}</span></div>
                                                <div>Incisal: <span className="font-semibold">{incisalShade}</span></div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Characterizations */}
                                      <div>
                                        <Label className="text-foreground mb-2 block text-xs">Characterizations</Label>
                                        <div className="flex flex-wrap gap-2">
                                          {['White Spots', 'Crack Lines', 'Incisal Translucency', 'Hypoplasia Marks'].map(char => (
                                            <label key={char} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={characterizations.includes(char)}
                                                onChange={(e) => {
                                                  if (e.target.checked) {
                                                    setCharacterizations(prev => [...prev, char]);
                                                  } else {
                                                    setCharacterizations(prev => prev.filter(c => c !== char));
                                                  }
                                                }}
                                                className="rounded border-border text-blue-600 focus:ring-blue-600 h-3.5 w-3.5 bg-background"
                                              />
                                              <span className="text-foreground">{char}</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Shade Reference Photo Upload */}
                                      <div>
                                        <Label className="text-foreground mb-2 block text-xs">Shade Reference Photograph</Label>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          ref={shadePhotoInputRef}
                                          onChange={handleShadePhotoChange}
                                        />
                                        {!shadePhotoFile ? (
                                          <div
                                            onClick={handleShadePhotoClick}
                                            className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                          >
                                            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                                            <p className="text-xs text-muted-foreground">Upload shade reference photo</p>
                                          </div>
                                        ) : (
                                          <div
                                            onClick={handleShadePhotoClick}
                                            className="border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 bg-emerald-500/5 cursor-pointer hover:bg-emerald-500/10 transition-colors"
                                          >
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                              <Camera className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-foreground truncate">{shadePhotoFile.name}</p>
                                              <p className="text-[10px] text-muted-foreground">Click to replace</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                          Material and Shade parameters left unspecified. The lab technician will select appropriate aesthetic choices.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 4: CAM */}
                  <div className="w-full flex-shrink-0 px-1">
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="grid gap-2">
                        <Label htmlFor="dueDate" className="text-foreground">Requested Due Date <span className="text-red-500">*</span></Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min 1 day ahead
                          className="border-border text-foreground bg-background"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="instructions" className="text-foreground">Custom Lab Instructions</Label>
                        <textarea
                          id="instructions"
                          placeholder="Provide specific notes regarding occlusal clearances, contacts, prep margins, or custom glazing instructions..."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          className="w-full min-h-[100px] p-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0 p-6 border-t border-border bg-card shrink-0">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="border-border text-foreground hover:bg-muted bg-background">
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Show Save as Draft if file is uploaded */}
              {selectedFile && (
                <Button
                  variant="secondary"
                  type="button"
                  disabled={uploadState === 'analyzing'}
                  onClick={() => handleSubmitCase(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700"
                >
                  Save as Draft
                </Button>
              )}
              {currentStep < 4 ? (
                <Button
                  type="button"
                  disabled={!isStepComplete(currentStep)}
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={uploadState === 'analyzing' || !isStepComplete(4)}
                  className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium"
                  onClick={() => handleSubmitCase(false)}
                >
                  Submit Case
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Jaw Limit Popup */}
      <Dialog open={showArchLimitPopup} onOpenChange={setShowArchLimitPopup}>
        <DialogContent className="sm:max-w-md border-border bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Maximum Teeth Selected
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              A maximum of 6 teeth in a single contiguous group can be selected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={() => setShowArchLimitPopup(false)} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Charting View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-white">Interactive Tooth Charting Workspace</h2>
              <p className="text-xs text-slate-400">Click & Drag to paint. Scroll/Pinch to zoom. Drag background to pan. Undo changes with Ctrl+Z.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFullscreen(false)}
              className="border-slate-800 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850"
            >
              Exit Fullscreen
            </Button>
          </div>
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Sidebar inside fullscreen */}
            <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
              {renderToolsSidebar()}
            </div>
            {/* Interactive Canvas inside fullscreen */}
            <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden relative">
              {renderChartingCanvas(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
