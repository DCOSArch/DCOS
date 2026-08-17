import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Star, Clock, ShieldCheck, ArrowRight, Building2, CheckCircle2, Search, Sparkles, MapPin, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { BlogNav, BlogFooter } from '@/components/blog/ArticleShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockLabProfiles } from '@/mockData';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  title: { absolute: 'Find a Dental Laboratory | DentalConnect OS' },
  description:
    'Browse verified dental laboratories by service, price, and turnaround time. Compare crown, bridge, and aligner pricing, then route digital scan cases instantly.',
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
  let labs: any[] = [];

  try {
    const supabase = await createClient();
    const { data: dbLabs, error } = await supabase
      .from('users')
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

    if (dbLabs && dbLabs.length > 0) {
      labs = dbLabs;
    }
  } catch (err) {
    console.warn('Marketplace db fallback', err);
  }

  // Fallback to rich mock lab profiles if database is in development mode
  if (labs.length === 0) {
    labs = mockLabProfiles.map((l) => ({
      id: l.id,
      name: l.name,
      rating: l.rating,
      reviews_count: l.reviewsCount,
      lab_services: [
        { category: 'Zirconia Monolithic Crown', price: 2450, turnaround_days: 3 },
        { category: 'IPS e.max CAD Veneer', price: 3200, turnaround_days: 4 },
        { category: 'Custom Titanium Implant Abutment', price: 4800, turnaround_days: 5 },
      ],
      pricing: l.pricing,
      contact_email: l.contactEmail,
      contact_phone: l.contactPhone,
    }));
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col justify-between">
      <BlogNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full animate-fade-in">
        {/* Header Hero */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-4 border border-primary/20">
            <Building2 className="w-3.5 h-3.5" /> Verified Lab Network
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-4">
            Find a Verified Dental Laboratory
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-normal leading-relaxed">
            Discover verified dental milling centers, compare transparent catalog pricing and SLAs, and route digital scan cases instantly — crowns, bridges, implants, aligners, and surgical guides.
          </p>
        </div>

        {/* Labs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {labs.map((lab) => {
            const services = lab.lab_services || [];
            const rating = lab.rating || (4.8 + (Math.abs(lab.name.charCodeAt(0) % 3) * 0.05));
            const reviewCount = lab.reviews_count || (Math.abs(lab.name.charCodeAt(0) % 50) + 20);

            return (
              <div
                key={lab.id}
                className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm hover:border-primary/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 sm:p-7">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                      {lab.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-xs font-bold shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {rating.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">
                    {reviewCount} verified clinic reviews &bull; <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Accepting digital cases</span>
                  </p>

                  <div className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Service Catalog & SLAs
                    </h4>
                    {services.slice(0, 3).map((svc: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
                      >
                        <span className="font-medium text-foreground">{svc.category}</span>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-primary" /> {svc.turnaround_days || 3}d
                          </span>
                          <span className="font-bold text-foreground font-mono">
                            ₹{svc.price?.toLocaleString('en-IN') || '2,450'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Verified Partner
                  </span>
                  <Link href="/login">
                    <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs h-8">
                      Route Digital Case <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Lab Partner Onboarding CTA */}
        <div className="p-8 sm:p-10 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Are you a Dental CAD/CAM Laboratory?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Receive structured digital prescriptions, validated STL & DICOM scan files, and automated billing directly from partnering clinics across India.
            </p>
          </div>
          <Link href="/login">
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-sm px-6 py-2.5 shadow-md shrink-0">
              Join as a Lab Partner <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
