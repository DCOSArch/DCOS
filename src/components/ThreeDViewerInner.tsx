'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useLoader, useThree, useFrame, invalidate } from '@react-three/fiber';
import { OrbitControls, Center, Html, Loader, AdaptiveDpr, AdaptiveEvents, Billboard, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { CheckCircle2, Upload } from 'lucide-react';
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

// Compute the offset position along the face normal
const offsetPosition = (
  position: [number, number, number],
  normal: [number, number, number] | null,
  offsetValue = 2.5
): [number, number, number] => {
  if (!normal) return position;
  return [
    position[0] + normal[0] * offsetValue,
    position[1] + normal[1] * offsetValue,
    position[2] + normal[2] * offsetValue
  ];
};

/**
 * STLModel — memoized to prevent re-renders.
 * Uses meshPhongMaterial (cheaper than meshStandard) with flatShading.
 */
const STLModel = React.memo(({ url, onMeshClick }: { url: string; onMeshClick: (e: any) => void }) => {
  const geometry = useLoader(STLLoader, url);

  const optimizedGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeVertexNormals();
    return geo;
  }, [geometry]);

  return (
    <mesh
      geometry={optimizedGeometry}
      onClick={onMeshClick}
      // CRITICAL: No onPointerMove, onPointerOver, onPointerOut on the mesh.
      // These cause R3F to raycast against every triangle on every mouse move.
    >
      <meshPhongMaterial
        color="#e6e1d6"
        shininess={30}
        specular={new THREE.Color('#444444')}
        side={THREE.DoubleSide}
        flatShading
      />
    </mesh>
  );
});
STLModel.displayName = 'STLModel';

/**
 * SceneInvalidator — listens to OrbitControls changes and manually
 * invalidates the R3F frame loop. This lets us use frameloop="demand"
 * so R3F does zero GPU work when the camera is idle.
 */
function SceneInvalidator() {
  const { invalidate: inv } = useThree();
  // Invalidate once on mount so the initial frame renders
  useEffect(() => { inv(); }, [inv]);
  return null;
}

/**
 * AnnotationPin — pure 3D sphere + text, no Html overlay, no pointer events.
 * Renders at a fixed position with zero per-frame cost.
 */
const AnnotationPin = React.memo(({ position, text, color }: {
  position: [number, number, number];
  text: string;
  color: string;
}) => {
  return (
    <group position={position}>
      <Billboard>
        <mesh>
          <sphereGeometry args={[1.2, 12, 12]} />
          <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.92} />
        </mesh>
        <Text
          fontSize={0.9}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.15]}
        >
          {text.substring(0, 4)}
          <meshBasicMaterial depthTest={false} color="white" />
        </Text>
      </Billboard>
    </group>
  );
});
AnnotationPin.displayName = 'AnnotationPin';

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
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  useEffect(() => {
    setActiveUrl(stlUrl);
  }, [stlUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveUrl(URL.createObjectURL(file));
    }
  }, []);

  const handlePointerDown = useCallback((e: any) => {
    if (!isAddingMode || isReadOnly) return;
    e.stopPropagation();
    const { point, face } = e;
    setTempPin({
      position: [point.x, point.y, point.z],
      normal: face ? [face.normal.x, face.normal.y, face.normal.z] : null
    });
  }, [isAddingMode, isReadOnly]);

  const submitAnnotation = useCallback(async () => {
    if (!tempPin || !pinText.trim() || !onAddAnnotation) return;
    try {
      const newAnno = await onAddAnnotation({
        position: tempPin.position,
        normal: tempPin.normal,
        text: pinText,
        isResolved: false
      });
      setAnnotations(prev => [...prev, newAnno]);
      setTempPin(null);
      setPinText('');
      setIsAddingMode(false);
    } catch (error) {
      console.error('Failed to add annotation', error);
    }
  }, [tempPin, pinText, onAddAnnotation]);

  const resolveAnnotation = useCallback(async (id: string) => {
    if (!onResolveAnnotation || isReadOnly) return;
    try {
      await onResolveAnnotation(id);
      setAnnotations(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a));
      setSelectedAnnoId(null);
    } catch (error) {
      console.error('Failed to resolve annotation', error);
    }
  }, [onResolveAnnotation, isReadOnly]);

  const activeAnnotations = useMemo(
    () => annotations.filter(a => !a.isResolved),
    [annotations]
  );

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

      {/* Annotation list overlay — shows clickable list to select/resolve annotations without hovering 3D objects */}
      {activeAnnotations.length > 0 && (
        <div className="absolute bottom-4 left-4 z-10 max-h-[200px] overflow-y-auto">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 space-y-1 min-w-[180px]">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Annotations</p>
            {activeAnnotations.map(anno => (
              <div
                key={anno.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                  selectedAnnoId === anno.id
                    ? 'bg-blue-600/20 text-blue-300'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                onClick={() => setSelectedAnnoId(selectedAnnoId === anno.id ? null : anno.id)}
              >
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="truncate flex-1">{anno.text}</span>
                {!isReadOnly && selectedAnnoId === anno.id && (
                  <button
                    className="text-emerald-400 hover:text-emerald-300 shrink-0"
                    onClick={(e) => { e.stopPropagation(); resolveAnnotation(anno.id); }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeUrl ? (
        <>
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
        <Canvas
          camera={{ position: [0, 0, 100], fov: 50 }}
          frameloop="demand"
          dpr={[1, 1.5]}
          performance={{ min: 0.3 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false,
          }}
          // CRITICAL: Disable R3F's built-in raycaster pointer events on the canvas.
          // This prevents R3F from raycasting against the mesh on every single mouse move,
          // which is the #1 cause of lag on high-poly STL meshes.
          events={undefined as any}
        >
          <AdaptiveDpr pixelated />

          <SceneInvalidator />

          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 15, 10]} intensity={0.8} />
          <directionalLight position={[-10, -15, -10]} intensity={0.4} />

          <Center>
            <STLModel url={activeUrl} onMeshClick={handlePointerDown} />
          </Center>

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.8}
            panSpeed={0.8}
            zoomSpeed={1.0}
            enabled={!isAddingMode || tempPin !== null}
            onChange={() => invalidate()}
          />

          {/* Pure 3D annotation pins — no Html, no pointer events, zero per-frame cost */}
          {activeAnnotations.map((anno) => (
            <AnnotationPin
              key={anno.id}
              position={offsetPosition(anno.position, anno.normal, 2.5)}
              text={anno.text}
              color={selectedAnnoId === anno.id ? '#3b82f6' : '#ef4444'}
            />
          ))}

          {/* Temp pin for new annotation */}
          {tempPin && (
            <>
              <AnnotationPin
                position={offsetPosition(tempPin.position, tempPin.normal, 2.5)}
                text="New"
                color="#3b82f6"
              />
              <group position={offsetPosition(tempPin.position, tempPin.normal, 2.5)}>
                <Html center distanceFactor={18} style={{ pointerEvents: 'auto' }}>
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl w-64 border border-slate-200 dark:border-slate-700 pointer-events-auto">
                    <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">New Label / Pin</p>
                    <textarea
                      autoFocus
                      className="w-full text-sm p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                      placeholder="E.g., Tooth 14 margin correction..."
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
              </group>
            </>
          )}
        </Canvas>
      </ErrorBoundary>
      <Loader />
        </>
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
