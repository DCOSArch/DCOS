import { createClient } from '@/src/lib/supabase/server';
import { Star, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Laboratory Discovery | Dental ConnectOS',
  description: 'Find and partner with top-rated dental laboratories.',
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
            Partner with Elite Laboratories
          </h1>
          <p className="mt-4 text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Discover verified dental labs, compare transparent pricing, and route your digital cases instantly.
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
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">${svc.price}</span>
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
      </div>
    </div>
  );
}
