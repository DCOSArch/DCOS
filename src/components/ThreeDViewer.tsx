'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ThreeDViewerProps {
  stlUrl?: string;
  isReadOnly?: boolean;
}

/**
 * ThreeDViewer — lazy-loads three.js entirely client-side.
 * All imports of @react-three/fiber, @react-three/drei, and three are done
 * inside useEffect so they never run in the Node.js SSR environment.
 */
export default function ThreeDViewer({ stlUrl, isReadOnly = false }: ThreeDViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [ViewerComponent, setViewerComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    setMounted(true);
    // Dynamically import the heavy three.js viewer only in the browser
    import('./ThreeDViewerInner')
      .then((mod) => setViewerComponent(() => mod.default))
      .catch((err) => console.error('Failed to load 3D engine:', err));
  }, []);

  if (!mounted || !ViewerComponent) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 bg-slate-900 rounded-lg">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400">No 3D scan uploaded</p>
        <p className="text-xs text-slate-600">Upload an STL or PLY file to enable the 3D viewer.</p>
      </div>
    );
  }

  return <ViewerComponent stlUrl={stlUrl} isReadOnly={isReadOnly} />;
}
