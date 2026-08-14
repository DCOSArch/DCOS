'use client';

import React, { useRef, useState, useEffect } from 'react';

interface AntigravityCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxTilt?: number; // Maximum tilt angle in degrees (default: 8)
  glareOpacity?: number; // Opacity of the specular highlight (default: 0.15)
  perspective?: number; // Perspective distance in px (default: 1000)
  className?: string;
}

/**
 * AntigravityCard — Spatial, Weightless 3D Interactive Card
 * Engineered based on the Antigravity UI & Motion Design Expert skill.
 * Implements buttery-smooth cursor-tracking 3D tilt, specular glare illumination, and soft diffused elevation.
 */
export function AntigravityCard({
  children,
  maxTilt = 8,
  glareOpacity = 0.15,
  perspective = 1000,
  className = '',
  style,
  ...props
}: AntigravityCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to card center (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // RotateX is driven by mouseY (inverted), RotateY by mouseX
    const targetRotateX = -mouseY * maxTilt * 2;
    const targetRotateY = mouseX * maxTilt * 2;

    setRotateX(targetRotateX);
    setRotateY(targetRotateY);

    // Glare position in percentages (0% to 100%)
    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;
    setGlarePosition({ x: glareX, y: glareY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      style={{
        perspective: `${perspective}px`,
      }}
      className="antigravity-perspective-wrapper h-full"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: reducedMotion
            ? 'none'
            : isHovered
            ? `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(12px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
          transition: isHovered
            ? 'transform 0.1s ease-out, box-shadow 0.3s ease-out'
            : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          willChange: 'transform',
          transformStyle: 'preserve-3d',
          ...style,
        }}
        className={`relative overflow-hidden ${className}`}
        {...props}
      >
        {/* Children content */}
        <div style={{ transform: 'translateZ(10px)' }} className="relative z-10 h-full flex flex-col justify-between">
          {children}
        </div>

        {/* Specular Glare Gradient Overlay */}
        {!reducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
            style={{
              opacity: isHovered ? glareOpacity : 0,
              background: `radial-gradient(circle 350px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.35), transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
