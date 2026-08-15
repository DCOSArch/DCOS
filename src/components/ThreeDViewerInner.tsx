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
  selectedTeeth?: number[];
  material?: string;
  shade?: string;
  activeViewportMode?: 'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME';
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
 * ProceduralDentalArchModel — Anatomical 3D Maxillary Dental Arch
 * Configures 16 distinct tooth models with FDI numbering, restorative materials,
 * subgingival margins, and occlusal clearance heatmaps.
 */
const ARCH_TEETH = [
  { fdi: 18, type: 'molar', x: -24, z: -16, rotY: 0.35, scale: [3.8, 4.2, 3.8] },
  { fdi: 17, type: 'molar', x: -21, z: -7, rotY: 0.25, scale: [4.0, 4.4, 4.0] },
  { fdi: 16, type: 'molar', x: -18, z: 2, rotY: 0.15, scale: [4.2, 4.6, 4.2] },
  { fdi: 15, type: 'premolar', x: -14.5, z: 10, rotY: 0.05, scale: [3.2, 4.0, 3.2] },
  { fdi: 14, type: 'premolar', x: -11, z: 17, rotY: -0.1, scale: [3.2, 4.0, 3.2] },
  { fdi: 13, type: 'canine', x: -7, z: 22.5, rotY: -0.3, scale: [3.0, 4.8, 3.0] },
  { fdi: 12, type: 'incisor', x: -3.2, z: 25.5, rotY: -0.45, scale: [2.8, 4.5, 2.2] },
  { fdi: 11, type: 'incisor', x: 0, z: 26.5, rotY: 0, scale: [3.4, 5.0, 2.4] },
  { fdi: 21, type: 'incisor', x: 3.2, z: 25.5, rotY: 0.45, scale: [3.4, 5.0, 2.4] },
  { fdi: 22, type: 'incisor', x: 7, z: 22.5, rotY: 0.3, scale: [2.8, 4.5, 2.2] },
  { fdi: 23, type: 'canine', x: 11, z: 17, rotY: 0.1, scale: [3.0, 4.8, 3.0] },
  { fdi: 24, type: 'premolar', x: 14.5, z: 10, rotY: -0.05, scale: [3.2, 4.0, 3.2] },
  { fdi: 25, type: 'premolar', x: 18, z: 2, rotY: -0.15, scale: [3.2, 4.0, 3.2] },
  { fdi: 26, type: 'molar', x: 21, z: -7, rotY: -0.25, scale: [4.2, 4.6, 4.2] },
  { fdi: 27, type: 'molar', x: 24, z: -16, rotY: -0.35, scale: [4.0, 4.4, 4.0] },
  { fdi: 28, type: 'molar', x: 26.5, z: -25, rotY: -0.45, scale: [3.8, 4.2, 3.8] },
];

export const ProceduralDentalArchModel = React.memo(({ 
  selectedTeeth = [], 
  material = 'Zirconia HT', 
  activeViewportMode = 'ANATOMY',
  onMeshClick 
}: { 
  selectedTeeth?: number[]; 
  material?: string; 
  activeViewportMode?: 'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME';
  onMeshClick?: (e: any) => void;
}) => {
  const isTitanium = material.toLowerCase().includes('titanium') || material.toLowerCase().includes('abutment');
  const isWireframe = activeViewportMode === 'WIREFRAME';
  const isHeatmap = activeViewportMode === 'OCCLUSION_HEATMAP';

  return (
    <group position={[0, -2, 0]} rotation={[-0.4, 0, 0]}>
      {/* 1. Realistic Gingival Base Arch Tissue */}
      <mesh position={[0, -3.5, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[14, 32, 48, 8, 0, Math.PI]} />
        <meshStandardMaterial
          color="#c2636f"
          roughness={0.65}
          metalness={0.05}
          side={THREE.DoubleSide}
          wireframe={isWireframe}
        />
      </mesh>

      {/* 2. 16 Anatomical Dental Units */}
      {ARCH_TEETH.map((tooth) => {
        // Check if this tooth is part of the case prescription
        const isSelected = selectedTeeth.includes(tooth.fdi) || selectedTeeth.includes(tooth.fdi + 20);

        // Restoration vs Natural Shade Colors
        let toothColor = '#fcf8ee'; // Natural ivory enamel
        let metalness = 0.08;
        let roughness = 0.22;

        if (isSelected) {
          if (isHeatmap) {
            toothColor = tooth.type === 'molar' ? '#eab308' : tooth.type === 'canine' ? '#ef4444' : '#22c55e';
          } else if (isTitanium) {
            toothColor = '#cbd5e1'; // Titanium gray
            metalness = 0.85;
            roughness = 0.18;
          } else {
            toothColor = '#fef3c7'; // Translucent Zirconia
            metalness = 0.12;
            roughness = 0.15;
          }
        } else if (isHeatmap) {
          toothColor = '#22c55e'; // Safe green clearance
        }

        return (
          <group key={tooth.fdi} position={[tooth.x, 0, tooth.z]} rotation={[0, tooth.rotY, 0]}>
            {/* Tooth Crown Geometry */}
            <mesh onClick={onMeshClick}>
              {tooth.type === 'molar' ? (
                <cylinderGeometry args={[tooth.scale[0] * 1.1, tooth.scale[0] * 0.9, tooth.scale[1], 24]} />
              ) : tooth.type === 'premolar' ? (
                <cylinderGeometry args={[tooth.scale[0], tooth.scale[0] * 0.85, tooth.scale[1], 20]} />
              ) : tooth.type === 'canine' ? (
                <coneGeometry args={[tooth.scale[0] * 1.05, tooth.scale[1] * 1.2, 20]} />
              ) : (
                <boxGeometry args={[tooth.scale[0] * 1.2, tooth.scale[1] * 1.1, tooth.scale[2] * 0.7]} />
              )}

              <meshStandardMaterial
                color={toothColor}
                metalness={metalness}
                roughness={roughness}
                wireframe={isWireframe}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* If Selected: Render Subgingival Finish Line Ring / Scanbody */}
            {isSelected && (
              <>
                <mesh position={[0, -tooth.scale[1] / 2 - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[tooth.scale[0] * 1.05, 0.2, 16, 32]} />
                  <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.9} />
                </mesh>

                {/* Floating 3D FDI Badge */}
                <Billboard position={[0, tooth.scale[1] / 2 + 3.5, 0]}>
                  <Text
                    fontSize={1.8}
                    color="#38bdf8"
                    anchorX="center"
                    anchorY="middle"
                  >
                    #{tooth.fdi}
                  </Text>
                </Billboard>
              </>
            )}
          </group>
        );
      })}
    </group>
  );
});
ProceduralDentalArchModel.displayName = 'ProceduralDentalArchModel';

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
  selectedTeeth = [],
  material = 'Zirconia HT',
  shade = 'A2',
  activeViewportMode = 'ANATOMY',
  initialAnnotations = [],
  onAddAnnotation,
  onResolveAnnotation,
  isReadOnly = false
}: ThreeDViewerInnerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempPin, setTempPin] = useState<{ position: [number, number, number]; normal: [number, number, number] | null } | null>(null);
  const [pinText, setPinText] = useState('');
  const [activeUrl, setActiveUrl] = useState<string | undefined>(
    stlUrl && (stlUrl.startsWith('http') || stlUrl.startsWith('blob:')) ? stlUrl : undefined
  );
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  useEffect(() => {
    if (stlUrl && (stlUrl.startsWith('http') || stlUrl.startsWith('blob:'))) {
      setActiveUrl(stlUrl);
    } else {
      setActiveUrl(undefined);
    }
  }, [stlUrl]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveUrl(URL.createObjectURL(file));
    }
  }, []);

  const handlePointerDown = useCallback((e: any) => {
    if (!isAddingMode) return;
    e.stopPropagation();
    if (e.point) {
      const pos: [number, number, number] = [e.point.x, e.point.y, e.point.z];
      const norm: [number, number, number] | null = e.face?.normal
        ? [e.face.normal.x, e.face.normal.y, e.face.normal.z]
        : null;
      setTempPin({ position: pos, normal: norm });
    }
  }, [isAddingMode]);

  const submitAnnotation = async () => {
    if (!tempPin || !pinText.trim()) return;
    const newAnno: Annotation = {
      id: Date.now().toString(),
      position: tempPin.position,
      normal: tempPin.normal,
      text: pinText.trim(),
      isResolved: false,
    };
    if (onAddAnnotation) {
      try {
        const saved = await onAddAnnotation({
          position: newAnno.position,
          normal: newAnno.normal,
          text: newAnno.text,
          isResolved: false,
        });
        setAnnotations((prev) => [...prev, saved]);
      } catch (err) {
        console.error('Failed to save annotation:', err);
        setAnnotations((prev) => [...prev, newAnno]);
      }
    } else {
      setAnnotations((prev) => [...prev, newAnno]);
    }
    setTempPin(null);
    setPinText('');
    setIsAddingMode(false);
  };

  const resolveAnnotation = async (id: string) => {
    if (onResolveAnnotation) {
      try {
        await onResolveAnnotation(id);
      } catch (err) {
        console.error('Failed to resolve annotation:', err);
      }
    }
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnoId === id) setSelectedAnnoId(null);
  };

  const activeAnnotations = useMemo(() => annotations.filter((a) => !a.isResolved), [annotations]);

  return (
    <div className="w-full h-full relative bg-slate-950 select-none">
      {/* Upload STL & Add pin buttons */}
      {!isReadOnly && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md cursor-pointer text-xs font-semibold shadow-md transition-colors">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Load STL</span>
            <input type="file" accept=".stl" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button
            variant={isAddingMode ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => { setIsAddingMode(!isAddingMode); setTempPin(null); }}
            className="shadow-md transition-colors text-xs h-8"
          >
            {isAddingMode ? 'Cancel Pin' : 'Drop Annotation Pin'}
          </Button>
        </div>
      )}

      {/* Annotation list overlay */}
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
            <Canvas camera={{ position: [0, 18, 55], fov: 45 }}>
              <ambientLight intensity={0.85} />
              <directionalLight position={[15, 25, 15]} intensity={1.1} />
              <directionalLight position={[-15, -10, -15]} intensity={0.4} />
              <Center>
                <ProceduralDentalArchModel
                  selectedTeeth={selectedTeeth}
                  material={material}
                  activeViewportMode={activeViewportMode}
                />
              </Center>
              <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
            </Canvas>
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

              {activeAnnotations.map((anno) => (
                <AnnotationPin
                  key={anno.id}
                  position={offsetPosition(anno.position, anno.normal, 2.5)}
                  text={anno.text}
                  color={selectedAnnoId === anno.id ? '#3b82f6' : '#ef4444'}
                />
              ))}

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
        <Canvas camera={{ position: [0, 20, 60], fov: 45 }}>
          <ambientLight intensity={0.85} />
          <directionalLight position={[15, 25, 15]} intensity={1.1} />
          <directionalLight position={[-15, -10, -15]} intensity={0.4} />
          <Center>
            <ProceduralDentalArchModel
              selectedTeeth={selectedTeeth}
              material={material}
              activeViewportMode={activeViewportMode}
            />
          </Center>
          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.08} 
            rotateSpeed={0.8}
            minDistance={20}
            maxDistance={120}
          />
        </Canvas>
      )}
    </div>
  );
}
