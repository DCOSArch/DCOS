'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useLoader, useThree, useFrame, invalidate } from '@react-three/fiber';
import { OrbitControls, Center, Html, Loader, AdaptiveDpr, AdaptiveEvents, Billboard, Text } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { CheckCircle2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
 * SculptedAnatomicalCrown — High-fidelity procedural 3D crown restoration
 * sculpted with anatomical cusps, developmental grooves, subgingival chamfer margin,
 * and preparation die core.
 */
const SculptedAnatomicalCrown = React.memo(({
  material = 'Titanium Abutment',
  activeViewportMode = 'ANATOMY',
  onMeshClick
}: {
  material?: string;
  activeViewportMode?: 'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME';
  onMeshClick?: (e: any) => void;
}) => {
  const isTitanium = material.toLowerCase().includes('titanium') || material.toLowerCase().includes('abutment');
  const isWireframe = activeViewportMode === 'WIREFRAME';
  const isHeatmap = activeViewportMode === 'OCCLUSION_HEATMAP';

  // 1. Generate smooth anatomical crown geometry with sculpted cusps & grooves
  const crownGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(13.5, 12.0, 16.0, 48, 32, false);
    const pos = geo.attributes.position;
    const colors: number[] = [];

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      // Anatomical occlusal surface sculpting (top cap & upper crown)
      if (y > 2.0) {
        const radius = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);

        // 4 Anatomical cusps: MB, DB, ML, DL
        const cuspWave = Math.sin(angle * 2.0) * 2.8 + Math.cos(angle * 4.0) * 0.8;
        // Central fossa depression
        const fossaDepth = radius < 6.5 ? -2.2 * (1.0 - radius / 6.5) : 0;
        // Marginal ridge crest
        const ridgeElevation = (radius > 7.0 && radius < 11.5) ? 1.2 : 0;

        const deltaY = (cuspWave + fossaDepth + ridgeElevation) * ((y - 2.0) / 6.0);
        y += deltaY;
        pos.setY(i, y);

        // Heatmap vertex coloring
        if (isHeatmap) {
          if (deltaY > 1.2) {
            colors.push(0.95, 0.2, 0.2); // Red: High occlusal contact / <0.5mm clearance
          } else if (deltaY > 0.3) {
            colors.push(0.95, 0.7, 0.1); // Amber: 1.0mm clearance
          } else {
            colors.push(0.15, 0.8, 0.35); // Green: >1.5mm safe clearance
          }
        }
      } else {
        // Lateral axial walls with natural buccal/lingual contour belly
        const bellyFactor = Math.sin(((y + 8.0) / 10.0) * Math.PI) * 1.2;
        const norm = Math.sqrt(x * x + z * z);
        if (norm > 0.001) {
          x += (x / norm) * bellyFactor;
          z += (z / norm) * bellyFactor;
          pos.setX(i, x);
          pos.setZ(i, z);
        }

        if (isHeatmap) {
          colors.push(0.15, 0.8, 0.35); // Green on axial walls
        }
      }
    }

    geo.computeVertexNormals();

    if (isHeatmap && colors.length === pos.count * 3) {
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    return geo;
  }, [isHeatmap]);

  // 2. Anatomical Subgingival Chamfer Margin Curve
  const marginRingGeo = useMemo(() => {
    return new THREE.TorusGeometry(12.3, 0.35, 16, 64);
  }, []);

  // 3. Internal Preparation Die Stump
  const dieGeo = useMemo(() => {
    return new THREE.CylinderGeometry(8.5, 11.2, 12.0, 32, 16);
  }, []);

  return (
    <group position={[0, -1, 0]} rotation={[0.25, 0.4, 0]}>
      {/* Primary Restorative Crown Body */}
      <mesh geometry={crownGeometry} onClick={onMeshClick}>
        {isHeatmap ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.3}
            metalness={0.1}
            wireframe={isWireframe}
            side={THREE.DoubleSide}
          />
        ) : isTitanium ? (
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.18}
            metalness={0.88}
            wireframe={isWireframe}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color="#faf5ea"
            roughness={0.15}
            metalness={0.06}
            wireframe={isWireframe}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Blue Subgingival Chamfer Finish Line Margin Ring */}
      <mesh position={[0, -8.0, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={marginRingGeo}>
        <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Titanium Abutment Collar / Implant Interface */}
      <mesh position={[0, -11.0, 0]}>
        <cylinderGeometry args={[7.2, 7.2, 5.0, 6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.15} metalness={0.92} />
      </mesh>

      {/* Internal Preparation Stump Core */}
      <mesh position={[0, -5.0, 0]} geometry={dieGeo}>
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} metalness={0.1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
});
SculptedAnatomicalCrown.displayName = 'SculptedAnatomicalCrown';

const STLModel = React.memo(({ 
  url, 
  activeViewportMode = 'ANATOMY',
  onMeshClick 
}: { 
  url: string; 
  activeViewportMode?: 'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME';
  onMeshClick: (e: any) => void;
}) => {
  const geometry = useLoader(STLLoader, url);

  const optimizedGeometry = useMemo(() => {
    const geo = geometry.clone();
    geo.computeVertexNormals();
    geo.center();
    return geo;
  }, [geometry]);

  const isWireframe = activeViewportMode === 'WIREFRAME';

  return (
    <mesh
      geometry={optimizedGeometry}
      onClick={onMeshClick}
    >
      <meshStandardMaterial
        color={activeViewportMode === 'OCCLUSION_HEATMAP' ? '#22c55e' : '#f4eedb'}
        roughness={0.25}
        metalness={0.08}
        wireframe={isWireframe}
        side={THREE.DoubleSide}
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
          {text}
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
    stlUrl && (stlUrl.startsWith('http') || stlUrl.startsWith('blob:') || stlUrl.startsWith('/')) ? stlUrl : undefined
  );
  const [selectedAnnoId, setSelectedAnnoId] = useState<string | null>(null);

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  useEffect(() => {
    if (stlUrl && (stlUrl.startsWith('http') || stlUrl.startsWith('blob:') || stlUrl.startsWith('/'))) {
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
    <div 
      className="w-full h-full relative bg-slate-950 select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.stl') || file.name.endsWith('.ply'))) {
          setActiveUrl(URL.createObjectURL(file));
          toast.success(`Loaded scan: ${file.name}`);
        }
      }}
    >
      {/* Sleek Floating Action Tools (Bottom-Right to avoid header HUD collision) */}
      {!isReadOnly && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl cursor-pointer text-xs font-semibold shadow-lg backdrop-blur-md transition-all hover:scale-[1.02]">
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>Load STL / PLY</span>
            <input type="file" accept=".stl,.ply" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button
            variant={isAddingMode ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => { setIsAddingMode(!isAddingMode); setTempPin(null); }}
            className="shadow-lg backdrop-blur-md transition-all hover:scale-[1.02] text-xs h-8 rounded-xl px-3 font-semibold"
          >
            {isAddingMode ? 'Cancel Pin' : 'Drop Pin'}
          </Button>
        </div>
      )}

      {/* Annotation list overlay */}
      {activeAnnotations.length > 0 && (
        <div className="absolute bottom-16 left-4 z-10 max-h-[200px] overflow-y-auto">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-2 space-y-1 min-w-[180px] shadow-xl">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Annotations</p>
            {activeAnnotations.map(anno => (
              <div
                key={anno.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
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
            <Canvas camera={{ position: [0, 8, 38], fov: 42 }}>
              <ambientLight intensity={0.9} />
              <directionalLight position={[15, 25, 15]} intensity={1.2} />
              <directionalLight position={[-15, -10, -15]} intensity={0.5} />
              <Center>
                <SculptedAnatomicalCrown
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
        <Canvas camera={{ position: [0, 8, 38], fov: 42 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[15, 25, 15]} intensity={1.2} />
          <directionalLight position={[-15, -10, -15]} intensity={0.5} />
          <Center>
            <SculptedAnatomicalCrown
              material={material}
              activeViewportMode={activeViewportMode}
            />
          </Center>
          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.08} 
            rotateSpeed={0.8}
            minDistance={15}
            maxDistance={80}
          />
        </Canvas>
      )}
    </div>
  );
}
