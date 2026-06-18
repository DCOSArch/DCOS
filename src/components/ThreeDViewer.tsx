import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { Upload, Maximize2, Minimize2, MousePointer2, X } from 'lucide-react';

function DentalModel({ url }: { url: string | null }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    if (url) {
      const loader = new STLLoader();
      loader.load(url, (geo) => {
        geo.computeVertexNormals();
        setGeometry(geo);
      });
    }
  }, [url]);

  if (!url) {
    // A more realistic default procedural placeholder if they haven't uploaded an STL yet
    return (
      <group>
         <mesh position={[0, -0.5, 0]}>
           <cylinderGeometry args={[1, 0.8, 1.2, 32]} />
           <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.1} />
         </mesh>
         <mesh position={[0, 0.3, 0]}>
           <sphereGeometry args={[1.05, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
           <meshStandardMaterial color="#e5e7eb" roughness={0.3} metalness={0.1} />
         </mesh>
      </group>
    );
  }

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#f3f4f6" roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

export function ThreeDViewer() {
  const [stlUrl, setStlUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStlUrl(url);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={isFullscreen ? "fixed inset-0 z-[100] bg-[#111827] flex flex-col" : "w-full h-full relative"}>
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 text-sm font-medium rounded-md cursor-pointer transition-colors border border-zinc-700 shadow-sm backdrop-blur-sm">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Load STL</span>
          <input type="file" accept=".stl" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleFullscreen}
          className="flex items-center justify-center w-8 h-8 bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-100 rounded-md transition-colors border border-zinc-700 shadow-sm backdrop-blur-sm"
          title={isFullscreen ? "Close Fullscreen" : "Toggle Fullscreen"}
        >
          {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {isFullscreen && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 px-6 py-2.5 bg-zinc-900/60 backdrop-blur-md rounded-full border border-zinc-700/50 shadow-2xl flex flex-wrap justify-center items-center gap-4 sm:gap-6 pointer-events-none">
           <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
             <MousePointer2 className="w-3.5 h-3.5" />
             Left Click Rotate
           </div>
           <div className="w-px h-3.5 bg-zinc-700"></div>
           <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
             <span className="font-mono px-1.5 py-0.5 bg-zinc-800/80 rounded border border-zinc-700/50">Right Click</span> 
             Pan
           </div>
           <div className="w-px h-3.5 bg-zinc-700"></div>
           <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-medium">
             <span className="font-mono px-1.5 py-0.5 bg-zinc-800/80 rounded border border-zinc-700/50">Scroll</span> 
             Zoom
           </div>
        </div>
      )}

      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }} className="w-full h-full outline-none">
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        
        <Center>
          <DentalModel url={stlUrl} />
        </Center>
        
        <Environment preset="city" />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          enablePan={true} 
          enableRotate={true} 
          enableZoom={true}
          makeDefault
        />
      </Canvas>
    </div>
  );
}
