'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

/* ---- Procedural Anatomical Molar Model ---- */
function MolarModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
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
        // Rounded-square base in X-Z
        const squareFactor = 1.0 + 0.08 * Math.cos(4 * theta);
        x *= squareFactor;
        z *= squareFactor;

        // Flare crown
        const flare = 1.0 + 0.1 * (y + 0.15);
        x *= flare;
        z *= flare;

        // 4 Anatomical cusps
        if (y > 0.05) {
          const heightFactor = (y - 0.05) / 0.5;
          const cuspWave = (Math.cos(theta * 4) * 0.065 + Math.sin(theta * 2) * 0.015) * heightFactor;
          y += cuspWave;

          // Central Pit / Fossa
          if (rXZ < 0.4) {
            const fossaDepression = (0.4 - rXZ) * 0.16 * heightFactor;
            y -= fossaDepression;
          }
        }
      } else {
        // --- ROOT REGION ---
        // Constriction
        const neckFactor = 0.86;
        x *= neckFactor;
        z *= neckFactor;

        const t = Math.min(1, Math.abs(y + 0.15) / 0.4);
        const shift = 0.22 * t;

        // Bifurcated split
        if (x >= 0) {
          x = (x - shift * 0.2) + shift;
        } else {
          x = (x + shift * 0.2) - shift;
        }

        // Taper roots
        const taper = 1.0 - t * 0.72;
        if (x >= 0) {
          const rootCenterX = shift;
          x = rootCenterX + (x - rootCenterX) * taper;
        } else {
          const rootCenterX = -shift;
          x = rootCenterX + (x - rootCenterX) * taper;
        }
        z *= taper;

        // Bends & Distal curve
        x += 0.08 * t * t;
        const bendZ = 0.04 * Math.sin(t * Math.PI);
        z += bendZ;

        // Furcation crotch lift
        if (Math.abs(x) < shift) {
          const distFromCenter = Math.abs(x);
          const furcationLift = (shift - distFromCenter) * 0.35 * (1.0 - t);
          y += furcationLift;
        }

        y = y - 0.12 * t;
      }

      pos.setXYZ(i, x, y, z);
    }

    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group ref={groupRef} scale={1.3}>
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

function Scene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, 4, -4]} intensity={0.6} color="#66D9EF" />
      <pointLight position={[0, -2, 3]} intensity={0.5} color="#FD971F" />
      <MolarModel />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
}

/* ---- Particle Field ---- */
function ParticleField() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 1 + Math.random() * 2,
    duration: 10 + Math.random() * 12,
    delay: Math.random() * 8,
    opacity: 0.1 + Math.random() * 0.25,
  }));

  return (
    <div className="particle-field">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

interface HeroSectionProps {
  onRequestDemo: () => void;
}

export default function HeroSection({ onRequestDemo }: HeroSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsapModule: typeof import('gsap') | null = null;

    const animate = async () => {
      try {
        gsapModule = await import('gsap');
        const gsap = gsapModule.gsap;

        // Animate hero words
        const words = headlineRef.current?.querySelectorAll('.hero-word');
        if (words) {
          gsap.to(words, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: 0.08,
            ease: 'power3.out',
            delay: 0.3,
          });
        }

        // Subtitle
        if (subtitleRef.current) {
          gsap.fromTo(
            subtitleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 0.75, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 }
          );
        }

        // CTAs
        if (ctaRef.current) {
          gsap.fromTo(
            ctaRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 1.0 }
          );
        }
      } catch {
        // Fallback: make everything visible
        const words = headlineRef.current?.querySelectorAll('.hero-word');
        words?.forEach((w) => {
          (w as HTMLElement).style.opacity = '1';
          (w as HTMLElement).style.transform = 'none';
        });
      }
    };

    animate();
  }, []);

  const headline = 'Send a complete lab case. Know exactly what happens next.';
  const words = headline.split(' ');

  return (
    <section
      ref={sectionRef}
      className="landing-section dark-section"
      id="hero"
      style={{ minHeight: '100vh', paddingTop: 100 }}
    >
      {/* Glow orbs */}
      <div className="glow-orb glow-orb-cyan" style={{ width: 400, height: 400, top: '-5%', right: '10%' }} />
      <div className="glow-orb glow-orb-teal" style={{ width: 400, height: 400, bottom: '5%', left: '5%' }} />

      <ParticleField />
      <div className="grid-bg" />

      <div className="section-inner">
        <div className="hero-grid-container">
          {/* Left Text Column */}
          <div className="hero-text-side">
            {/* Refined Minimalist Clinical Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl text-neutral-300 text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              The Digital Handoff, Made Clinical
            </div>

            <h1 ref={headlineRef} className="landing-display">
              {words.map((word, i) => (
                <span key={i} className="hero-word" style={{ marginRight: '0.25em' }}>
                  {word.includes('complete') || word.includes('next.') ? (
                    <span className="gradient-text">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h1>

            <p ref={subtitleRef} className="landing-subheading text-neutral-300" style={{ opacity: 0, margin: 0, lineHeight: 1.6 }}>
              DentalConnect brings scans, prescriptions, shade details, lab communication, and live production updates into one calm clinical workspace.
            </p>

            <div ref={ctaRef} className="hero-ctas" style={{ opacity: 0 }}>
              <Link href="/login" className="landing-btn landing-btn-primary shadow-lg shadow-cyan-500/20">
                Start your dentist workspace
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <button onClick={onRequestDemo} className="landing-btn landing-btn-outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                See a case journey
              </button>
            </div>

            {/* Clean, Understated Verified Capabilities Strip */}
            <div className="flex items-center gap-6 text-xs text-neutral-400 pt-3 border-t border-neutral-800/50">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                <span>Structured Prescriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                <span>Verified Scan Ingestion</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                <span>Live Production Telemetry</span>
              </div>
            </div>
          </div>

          {/* Right 3D Model Column */}
          <div className="hero-canvas-side">
            <Canvas camera={{ position: [0, 0.2, 3.2], fov: 45 }}>
              <Scene />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <span style={{ fontSize: '0.7rem', opacity: 0.4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
        <div className="scroll-indicator-line" />
      </div>
    </section>
  );
}
