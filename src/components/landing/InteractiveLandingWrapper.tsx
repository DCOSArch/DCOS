'use client';

import dynamic from 'next/dynamic';

const InteractiveLanding = dynamic(
  () => import('@/components/landing/LandingPage'),
  { ssr: false }
);

export default function InteractiveLandingWrapper() {
  return <InteractiveLanding />;
}
