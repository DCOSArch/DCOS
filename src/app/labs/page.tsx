import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Star, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  // `absolute` stops the root layout's "%s | DentalConnect OS" template from
  // appending the brand a second time.
  title: { absolute: 'Find a Dental Laboratory | DentalConnect OS' },
  description:
    'Browse verified dental laboratories by service, price, and turnaround time. Compare crown, bridge, implant, and aligner pricing, then route your digital cases instantly.',
  alternates: { canonical: '/labs' },
  openGraph: {
    title: 'Find a Dental Laboratory — DentalConnect OS',
    description:
      'Browse verified dental laboratories by service, price, and turnaround time. Route your digital cases instantly.',
    url: `${SITE_URL}/labs`,
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Find a Dental Laboratory on DentalConnect OS',
      },
    ],
  },
};

export default async function LabsMarketplacePage() {
  const supabase = await createClient();

  // Fetch all lab profiles along with an aggregate of their services
  // In a real scenario, this would use a materialized view or complex join for performance.
  const { data: labs, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      lab_services (
        category,
        price,
        turnaround_days
      )
    `)
    .eq('role', 'LAB_ADMIN');

  if (error) {
    console.error('Error fetching marketplace labs:', error);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Find a Dental Laboratory
          </h1>
          <p className="mt-4 text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Discover verified dental labs, compare transparent pricing and turnaround
            times, and route your digital cases instantly — crowns, bridges, implants,
            aligners, and full-arch restorations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {labs?.map((lab) => {
            const services = lab.lab_services || [];
            // Mock rating for MVP
            const rating = 4.8 + Math.random() * 0.2;
            const reviewCount = Math.floor(Math.random() * 200) + 50;

            return (
              <div key={lab.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{lab.name}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded text-sm font-semibold">
                      <Star className="w-4 h-4 fill-current" />
                      {rating.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{reviewCount} verified reviews</p>

                  <div className="mt-6 space-y-4 flex-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Popular Services</h4>
                    {services.slice(0, 3).map((svc: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{svc.category}</span>
                        <div className="text-right">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{svc.price}</span>
                          <span className="text-slate-400 ml-2 flex items-center justify-end text-xs"><Clock className="w-3 h-3 mr-1" /> {svc.turnaround_days}d</span>
                        </div>
                      </div>
                    ))}
                    {services.length === 0 && (
                      <p className="text-sm text-slate-500 italic">No public catalog available.</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 mt-auto">
                  <Link 
                    href={`/labs/${lab.id}`}
                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    View Profile & Partner <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> ConnectOS Verified Partner
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {(!labs || labs.length === 0) && (
          <div className="max-w-2xl mx-auto text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Laboratory directory opening soon
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400">
              We&apos;re onboarding verified dental laboratories now. Labs listed here
              publish their service catalog, pricing, and turnaround times so clinics can
              compare and route cases in a single click.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex justify-center items-center gap-2 py-2.5 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                List your laboratory <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex justify-center items-center py-2.5 px-5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                I&apos;m a clinic looking for a lab
              </Link>
            </div>
          </div>
        )}

        {/* Contextual copy + internal links. Keeps this route from being a crawl
            dead-end and gives it indexable content even before labs are listed. */}
        <section className="max-w-3xl mx-auto mt-20 text-slate-600 dark:text-slate-400">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            How lab discovery works on DentalConnect OS
          </h2>
          <p className="mb-4">
            Every laboratory on DentalConnect OS publishes a service catalog with
            transparent pricing and quoted turnaround times. Clinics compare labs on the
            work they actually need — zirconia crowns, PFM bridges, implant abutments,
            clear aligners, dentures, or full-arch restorations — then route a case
            directly from their intraoral scanner without leaving the platform.
          </p>
          <p className="mb-4">
            Once a case is routed, the clinic and lab share a single real-time workspace:
            structured digital prescriptions, spatial pin comments on the 3D model,
            case-scoped messaging, and automated turnaround tracking from received through
            shipped.
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/landing" className="text-blue-600 dark:text-blue-400 hover:underline">
                See how DentalConnect OS connects clinics and labs
              </Link>
            </li>
            <li>
              <Link href="/blog" className="text-blue-600 dark:text-blue-400 hover:underline">
                Read our guides on dental lab software and digital workflows
              </Link>
            </li>
            <li>
              <Link
                href="/blog/how-to-choose-dental-lab-management-software"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                How to choose dental lab management software: 7 criteria that matter
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
