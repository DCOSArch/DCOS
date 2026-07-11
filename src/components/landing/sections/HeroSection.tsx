'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Link from 'next/link';

/* ---- Procedural Molar Model ---- */
function MolarModel() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <group ref={groupRef} scale={1.3}>
      {/* Crown base */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.65, 0.7, 32, 1, false]} />
        <meshStandardMaterial
          color="#f6f4ed"
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>

      {/* Molar Cusps */}
      <mesh position={[0.35, 0.45, 0.35]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f6f4ed" roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[-0.35, 0.45, 0.35]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f6f4ed" roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[0.35, 0.45, -0.35]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f6f4ed" roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh position={[-0.35, 0.45, -0.35]}>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#f6f4ed" roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Root left */}
      <mesh position={[-0.25, -0.4, 0]} rotation={[0, 0, 0.18]}>
        <coneGeometry args={[0.28, 0.7, 16]} />
        <meshStandardMaterial color="#f2eff5" roughness={0.35} metalness={0.02} />
      </mesh>
      {/* Root right */}
      <mesh position={[0.25, -0.4, 0]} rotation={[0, 0, -0.18]}>
        <coneGeometry args={[0.28, 0.7, 16]} />
        <meshStandardMaterial color="#f2eff5" roughness={0.35} metalness={0.02} />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 8, 5]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-4, 4, -4]} intensity={0.5} color="#66D9EF" />
      <pointLight position={[0, -2, 3]} intensity={0.4} color="#FD971F" />
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

  const headline = 'The Operating System for Modern Dentistry: DCOS';
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
            <h1 ref={headlineRef} className="landing-display">
              {words.map((word, i) => (
                <span key={i} className="hero-word" style={{ marginRight: '0.25em' }}>
                  {word.includes('DCOS') ? (
                    <span className="gradient-text">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              ))}
            </h1>

            <p ref={subtitleRef} className="landing-subheading" style={{ opacity: 0, margin: 0 }}>
              DentalConnect OS is a B2B SaaS platform that unifies dental clinics and fabrication laboratories on a single real-time channel. Streamline prescriptions, 3D model annotations, and inventory tracking without friction.
            </p>

            <div ref={ctaRef} className="hero-ctas" style={{ opacity: 0 }}>
              <Link href="/login" className="landing-btn landing-btn-primary">
                Start Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <button onClick={onRequestDemo} className="landing-btn landing-btn-outline">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Request Demo
              </button>
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
