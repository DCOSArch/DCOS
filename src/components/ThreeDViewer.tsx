'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, Html } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as THREE from 'three';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Annotation {
  id: string;
  position: [number, number, number];
  normal: [number, number, number] | null;
  text: string;
  isResolved: boolean;
}

interface ThreeDViewerProps {
  stlUrl?: string; // Expects a signed URL from Cloudflare R2
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
      {/* Standard dental model material - slightly glossy, off-white/bone color */}
      <meshStandardMaterial 
        color="#e6e1d6" 
        roughness={0.4} 
        metalness={0.1} 
        side={THREE.DoubleSide} 
      />
    </mesh>
  );
};

export default function ThreeDViewer({ 
  stlUrl, 
  initialAnnotations = [], 
  onAddAnnotation,
  onResolveAnnotation,
  isReadOnly = false 
}: ThreeDViewerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [tempPin, setTempPin] = useState<{ position: [number, number, number], normal: [number, number, number] } | null>(null);
  const [pinText, setPinText] = useState('');

  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  const handlePointerDown = (e: any) => {
    if (!isAddingMode || isReadOnly) return;
    
    // Stop event propagation to avoid OrbitControls interference during click
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
      console.error("Failed to add annotation", error);
    }
  };

  const resolveAnnotation = async (id: string) => {
    if (!onResolveAnnotation || isReadOnly) return;
    try {
      await onResolveAnnotation(id);
      setAnnotations(annotations.map(a => a.id === id ? { ...a, isResolved: true } : a));
    } catch (error) {
      console.error("Failed to resolve annotation", error);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-lg overflow-hidden group">
      
      {!isReadOnly && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            variant={isAddingMode ? "destructive" : "secondary"} 
            size="sm" 
            onClick={() => {
              setIsAddingMode(!isAddingMode);
              setTempPin(null);
            }}
            className="shadow-md transition-colors"
          >
            {isAddingMode ? "Cancel Pin" : "Drop Annotation Pin"}
          </Button>
        </div>
      )}

      {stlUrl ? (
        <Canvas shadows camera={{ position: [0, 0, 100], fov: 50 }}>
          <Stage environment="city" intensity={0.5} adjustCamera>
            <STLModel url={stlUrl} onMeshClick={handlePointerDown} />
          </Stage>
          
          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.1} 
            // Disable rotation if we are about to click to add a pin to prevent drag-sliding
            enabled={!isAddingMode || tempPin !== null} 
          />

          {/* Render Saved Annotations */}
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

          {/* Render Temporary Pin Input Box */}
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
                    e.stopPropagation(); // Prevent orbit controls from jumping
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitAnnotation();
                    }
                  }}
                  onPointerDown={(e) => e.stopPropagation()} // Keep textarea clickable
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setTempPin(null)} className="h-7 text-xs">Cancel</Button>
                  <Button size="sm" onClick={submitAnnotation} disabled={!pinText.trim()} className="h-7 text-xs">Save Pin</Button>
                </div>
              </div>
            </Html>
          )}

        </Canvas>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mb-4"></div>
          <p>Loading 3D Engine...</p>
        </div>
      )}
    </div>
  );
}
