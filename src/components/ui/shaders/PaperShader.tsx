"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PaperMaterial = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const shaderArgs = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#272822') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        // Random function for noise
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          // Add some noise simulating paper texture grain
          float noise = random(vUv * 200.0 + fract(uTime * 0.1));
          
          // Slight vignette
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = smoothstep(0.8, 0.2, dist);
          
          vec3 finalColor = uColor + (noise * 0.05); // slight grain
          finalColor *= vignette;
          
          gl_FragColor = vec4(finalColor, 0.4); // slightly transparent to blend with aurora
        }
      `,
      transparent: true,
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <shaderMaterial ref={materialRef} args={[shaderArgs]} />;
};

const PaperScene = () => {
  const { viewport } = useThree();
  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <PaperMaterial />
    </mesh>
  );
};

export const PaperShaderBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ width: '100%', height: '100%' }}
      >
        <PaperScene />
      </Canvas>
    </div>
  );
};
