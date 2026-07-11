import type { Metadata } from 'next';
import './landing.css';

export const metadata: Metadata = {
  title: 'DentalConnect OS — The Operating System for Modern Dentistry',
  description:
    'From digital scan to final delivery. One platform connecting dentists and labs with real-time tracking, 3D collaboration, and zero friction.',
  openGraph: {
    title: 'DentalConnect OS — The Operating System for Modern Dentistry',
    description:
      'One platform connecting dentists and labs with real-time tracking, 3D collaboration, and zero friction.',
    type: 'website',
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
