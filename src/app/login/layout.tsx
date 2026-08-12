import type { Metadata } from 'next';

export const metadata: Metadata = {
  // `absolute` prevents the root layout's "%s | DentalConnect OS" template from
  // appending the brand a second time.
  title: { absolute: 'Sign In | DentalConnect OS' },
  description: 'Sign in to your DentalConnect OS dashboard.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  alternates: {
    canonical: 'https://www.dcos.in/landing',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
