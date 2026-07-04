'use client';

import React, { useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { MapPin, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component<{ fallback: React.ReactNode; children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Annotation {
  id: string;
  position: [number, number, number];
  normal: [number, number, number] | null;
  text: string;
  isResolved: boolean;
}

interface ThreeDViewerInnerProps {
  stlUrl: string;
  initialAnnotations?: Annotation[];
  onAddAnnotation?: (anno: Omit<Annotation, 'id'>) => Promise<Annotation>;
  onResolveAnnotation?: (id: string) => Promise<void>;
  isReadOnly?: boolean;
}

const STLModel = ({ url, onMeshClick }: { url: string; onMeshClick: (e: any) => void }) => {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh
      geometry={geometry}
      onClick={onMeshClick}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        color="#e6e1d6"
        roughness={0.4}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export default function ThreeDViewerInner({
  stlUrl,
  initialAnnotations = [],
  onAddAnnotation,
  onResolveAnnotation,
  isReadOnly = false
}: ThreeDViewerInnerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempPin, setTempPin] = useState<{ position: [number, number, number]; normal: [number, number, number] | null } | null>(null);
  const [pinText, setPinText] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | undefined>(stlUrl);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  useEffect(() => {
    setActiveUrl(stlUrl);
  }, [stlUrl]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveUrl(URL.createObjectURL(file));
    }
  };

  const handlePointerDown = (e: any) => {
    if (!isAddingMode || isReadOnly) return;
    e.stopPropagation();
    const { point, face } = e;
    setTempPin({
      position: [point.x, point.y, point.z],
      normal: face ? [face.normal.x, face.normal.y, face.normal.z] : null
    });
  };

  const submitAnnotation = async () => {
    if (!tempPin || !pinText.trim() || !onAddAnnotation) return;
    try {
      const newAnno = await onAddAnnotation({
        position: tempPin.position,
        normal: tempPin.normal,
        text: pinText,
        isResolved: false
      });
      setAnnotations([...annotations, newAnno]);
      setTempPin(null);
      setPinText('');
      setIsAddingMode(false);
    } catch (error) {
      console.error('Failed to add annotation', error);
    }
  };

  const resolveAnnotation = async (id: string) => {
    if (!onResolveAnnotation || isReadOnly) return;
    try {
      await onResolveAnnotation(id);
      setAnnotations(annotations.map(a => a.id === id ? { ...a, isResolved: true } : a));
    } catch (error) {
      console.error('Failed to resolve annotation', error);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden group">
      {!isReadOnly && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 text-sm font-medium rounded-md cursor-pointer transition-colors border border-zinc-700 shadow-sm backdrop-blur-sm">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load STL</span>
            <input type="file" accept=".stl" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button
            variant={isAddingMode ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => { setIsAddingMode(!isAddingMode); setTempPin(null); }}
            className="shadow-md transition-colors"
          >
            {isAddingMode ? 'Cancel Pin' : 'Drop Annotation Pin'}
          </Button>
        </div>
      )}

      {activeUrl ? (
      <ErrorBoundary fallback={
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400">Failed to load 3D scan</p>
          <p className="text-xs text-slate-600">The scan file is missing or invalid. Use the Load STL button to preview a local file.</p>
        </div>
      }>
        <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <STLModel url={activeUrl} onMeshClick={handlePointerDown} />
          </Stage>

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.1}
          enabled={!isAddingMode || tempPin !== null}
        />

        {annotations.filter(a => !a.isResolved).map((anno) => (
          <Html key={anno.id} position={anno.position} center distanceFactor={15}>
            <div className="flex flex-col items-center">
              <MapPin className="text-red-500 w-6 h-6 -mb-1 animate-bounce shadow-sm" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }} />
              <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 rounded shadow-lg text-sm min-w-[150px] border border-slate-200 dark:border-slate-700">
                <p className="font-medium mb-2">{anno.text}</p>
                {!isReadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs flex items-center justify-center gap-1 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200"
                    onClick={(e) => { e.stopPropagation(); resolveAnnotation(anno.id); }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          </Html>
        ))}

        {tempPin && (
          <Html position={tempPin.position} center distanceFactor={15}>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl w-64 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">New Annotation</p>
              <textarea
                autoFocus
                className="w-full text-sm p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                placeholder="E.g., Margin unclear here..."
                rows={3}
                value={pinText}
                onChange={(e) => setPinText(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnnotation(); }
                }}
                onPointerDown={(e) => e.stopPropagation()}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm" onClick={() => setTempPin(null)} className="h-7 text-xs">Cancel</Button>
                <Button size="sm" onClick={submitAnnotation} disabled={!pinText.trim()} className="h-7 text-xs">Save Pin</Button>
              </div>
            </div>
          </Html>
        )}
      </Canvas>
      </ErrorBoundary>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-400">No 3D scan uploaded</p>
          <p className="text-xs text-slate-600">Upload an STL file to preview the scan locally.</p>
        </div>
      )}
    </div>
  );
}
