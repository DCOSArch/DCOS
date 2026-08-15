'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ThreeDViewerProps {
  stlUrl?: string;
  selectedTeeth?: number[];
  material?: string;
  shade?: string;
  activeViewportMode?: 'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME';
  isReadOnly?: boolean;
}

/**
 * ThreeDViewer — lazy-loads three.js entirely client-side.
 * All imports of @react-three/fiber, @react-three/drei, and three are done
 * inside useEffect so they never run in the Node.js SSR environment.
 */
export default function ThreeDViewer({ 
  stlUrl, 
  selectedTeeth = [], 
  material = 'Zirconia HT', 
  shade = 'A2',
  activeViewportMode = 'ANATOMY',
  isReadOnly = false 
}: ThreeDViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [ViewerComponent, setViewerComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
    import('./ThreeDViewerInner')
      .then((mod) => setViewerComponent(() => mod.default))
      .catch((err) => console.error('Failed to load 3D engine:', err));
  }, []);

  if (!mounted || !ViewerComponent) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 bg-slate-950">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Initializing 3D WebGL Engine...</p>
      </div>
    );
  }

  return (
    <ViewerComponent 
      stlUrl={stlUrl} 
      selectedTeeth={selectedTeeth}
      material={material}
      shade={shade}
      activeViewportMode={activeViewportMode}
      isReadOnly={isReadOnly} 
    />
  );
}
