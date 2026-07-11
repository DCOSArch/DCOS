'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/* ---- Procedural Anatomical Molar Model ---- */
function MolarModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  // Sculpt a realistic organic molar tooth from a Sphere
  const toothGeometry = useMemo(() => {
    const geom = new THREE.SphereGeometry(0.55, 64, 64);
    const pos = geom.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      let x = v.x;
      let y = v.y;
      let z = v.z;

      const theta = Math.atan2(z, x);
      const rXZ = Math.sqrt(x * x + z * z);

      if (y > -0.15) {
        // --- CROWN REGION ---
        // Make the crown slightly rounded-square in the X-Z plane
        const squareFactor = 1.0 + 0.08 * Math.cos(4 * theta);
        x *= squareFactor;
        z *= squareFactor;

        // Flare the crown outwards slightly
        const flare = 1.0 + 0.1 * (y + 0.15);
        x *= flare;
        z *= flare;

        // Sculpt 4 anatomical cusps
        if (y > 0.05) {
          const heightFactor = (y - 0.05) / 0.5;
          // Four distinct cusps with a bit of organic asymmetry
          const cuspWave = (Math.cos(theta * 4) * 0.065 + Math.sin(theta * 2) * 0.015) * heightFactor;
          y += cuspWave;

          // Central pit/fossa (depression in the center of the occlusal surface)
          if (rXZ < 0.4) {
            const fossaDepression = (0.4 - rXZ) * 0.16 * heightFactor;
            y -= fossaDepression;
          }
        }
      } else {
        // --- ROOT REGION (Bifurcated Molar Roots) ---
        // Cervical constriction (neck of the tooth)
        const neckFactor = 0.86;
        x *= neckFactor;
        z *= neckFactor;

        // Progress down the roots (t ranges from 0 to 1)
        const t = Math.min(1, Math.abs(y + 0.15) / 0.4);
        const shift = 0.22 * t;

        // Bifurcated split: separate left and right root centers
        if (x >= 0) {
          x = (x - shift * 0.2) + shift;
        } else {
          x = (x + shift * 0.2) - shift;
        }

        // Taper roots towards the apex
        const taper = 1.0 - t * 0.72;
        if (x >= 0) {
          const rootCenterX = shift;
          x = rootCenterX + (x - rootCenterX) * taper;
        } else {
          const rootCenterX = -shift;
          x = rootCenterX + (x - rootCenterX) * taper;
        }
        z *= taper;

        // Anatomically curve the roots distally (slight curve on the X/Z axes)
        x += 0.08 * t * t;
        const bendZ = 0.04 * Math.sin(t * Math.PI);
        z += bendZ;

        // Furcation (the anatomical split crotch between the roots)
        if (Math.abs(x) < shift) {
          const distFromCenter = Math.abs(x);
          const furcationLift = (shift - distFromCenter) * 0.35 * (1.0 - t);
          y += furcationLift;
        }

        // Elongate roots
        y = y - 0.12 * t;
      }

      pos.setXYZ(i, x, y, z);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group ref={groupRef} scale={1.3} position={[0, -0.1, 0]}>
      <mesh geometry={toothGeometry}>
        <meshPhysicalMaterial
          color="#fbfaf6"
          roughness={0.16}
          metalness={0.02}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
          transmission={0.14}
          thickness={0.6}
        />
      </mesh>
    </group>
  );
}

function ViewerScene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 5]} intensity={1.3} />
      <directionalLight position={[-3, 2, -3]} intensity={0.5} color="#66D9EF" />
      <MolarModel />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
}

const annotations = [
  {
    marker: '1',
    color: '#F92672',
    text: '"Margin unclear here — please verify preparation boundary"',
    author: 'Dr. Mehta · Dentist',
    resolved: false,
  },
  {
    marker: '2',
    color: '#FD971F',
    text: '"Occlusal adjustment needed — 0.3mm reduction on distal cusp"',
    author: 'Dr. Mehta · Dentist',
    resolved: false,
  },
  {
    marker: '✓',
    color: '#A6E22E',
    text: '"Margin verified and adjusted. Scan geometry looks correct."',
    author: 'Advance Dental Lab · Resolved',
    resolved: true,
  },
];

export default function ThreeDShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visiblePins, setVisiblePins] = useState<boolean[]>([false, false, false]);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Title entrance
        const title = sectionRef.current?.querySelector('.viewer-title');
        if (title) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 65%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Stagger pins
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 50%',
          onEnter: () => {
            annotations.forEach((_, i) => {
              setTimeout(() => {
                setVisiblePins((prev) => {
                  const next = [...prev];
                  next[i] = true;
                  return next;
                });
              }, i * 500);
            });
          },
          onLeaveBack: () => {
            setVisiblePins([false, false, false]);
          },
        });
      } catch {
        setVisiblePins([true, true, true]);
      }
    };

    animate();
  }, []);

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="viewer" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="grid-bg" />

      <div className="glow-orb glow-orb-pink" style={{ width: 350, height: 350, top: '10%', left: '5%', opacity: 0.1 }} />

      <div className="section-inner">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <span className="landing-label" style={{ color: 'var(--landing-pink)', marginBottom: 16, display: 'block' }}>
            3D Collaboration
          </span>

          <h2 className="landing-heading viewer-title" style={{ opacity: 0, maxWidth: 700, margin: '0 auto 16px' }}>
            Annotate directly on the{' '}
            <span className="gradient-text">3D model</span>
          </h2>

          <p className="landing-subheading mx-auto">
            No more vague text descriptions. Drop pins, leave notes, resolve issues — all spatially on clinical restorations.
          </p>
        </div>

        <div className="viewer-showcase">
          {/* 3D Canvas */}
          <div className="viewer-canvas-wrapper">
            <Canvas camera={{ position: [0, 0.2, 3.2], fov: 45 }}>
              <ViewerScene />
            </Canvas>

            {/* Overlay annotation badge */}
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                borderRadius: 8,
                fontSize: '0.75rem',
                color: 'var(--landing-cyan)',
                border: '1px solid rgba(102,217,239,0.2)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4M12 8h.01"/>
              </svg>
              Interactive — Drag to Orbit
            </div>
          </div>

          {/* Annotation List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4, marginBottom: 16 }}>
              Spatial Annotations
            </div>

            {annotations.map((ann, i) => (
              <div
                key={i}
                className={`annotation-pin ${visiblePins[i] ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div
                  className="annotation-marker"
                  style={{
                    background: ann.resolved ? `${ann.color}20` : `${ann.color}30`,
                    color: ann.color,
                    border: `2px solid ${ann.color}`,
                  }}
                >
                  {ann.marker}
                </div>
                <div>
                  <div className="annotation-text">{ann.text}</div>
                  <div className="annotation-author">{ann.author}</div>
                </div>
              </div>
            ))}

            <div
              style={{
                marginTop: 20,
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(102,217,239,0.06)',
                border: '1px solid rgba(102,217,239,0.12)',
                fontSize: '0.8rem',
                color: 'var(--landing-cyan)',
                lineHeight: 1.5,
              }}
            >
              💡 In the real product, annotations are pinned to exact 3D coordinates with face normals — resolvable by the lab team.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
