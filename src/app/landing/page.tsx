import type { Metadata } from 'next';
import Link from 'next/link';
import InteractiveLanding from '@/components/landing/InteractiveLandingWrapper';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  title: 'Dental Lab Management & Clinic Collaboration Software',
  description:
    'DentalConnect OS (DCOS) connects dental clinics and laboratories on one real-time platform — 3D case routing, digital prescriptions, instant messaging, inventory tracking, and automated turnaround. The operating system for modern dentistry.',
  alternates: { canonical: '/landing' },
  openGraph: {
    title: 'DentalConnect OS — Dental Lab Management & Clinic Collaboration Software',
    description:
      'Connect dental clinics and labs on one real-time platform. 3D case routing, digital prescriptions, and automated turnaround tracking.',
    url: `${SITE_URL}/landing`,
    type: 'website',
  },
};

const features = [
  {
    title: '3D Case Routing',
    body: 'Route digital scans (STL, PLY, OBJ) from any intraoral scanner — iTero, 3Shape TRIOS, Medit, Carestream — directly to your chosen lab. No emails, no lost files, no version confusion.',
  },
  {
    title: 'Digital Prescriptions',
    body: 'Paperless dental lab prescriptions with structured fields for material, shade, occlusion, and margin preferences. Every case ships with complete information the first time.',
  },
  {
    title: 'Real-Time Messaging',
    body: 'Chat directly with your lab technician on every case. Drop spatial pins on 3D models to comment on exact margins or occlusion points — with zero screenshot copy-paste.',
  },
  {
    title: 'Automated Turnaround Tracking',
    body: 'Every case moves through Received → In Design → In Production → Quality Check → Shipped. Clinics see live status. Labs measure and improve TAT with real data.',
  },
  {
    title: 'Inventory Management',
    body: 'Track zirconia blocks, PMMA discs, alloys, and consumables. Automatic deductions when a case moves to production. Low-stock alerts before you run out.',
  },
  {
    title: 'Lab Discovery Marketplace',
    body: 'Dentists find verified laboratories by service, price, and turnaround. Labs get a public profile with transparent pricing that wins new clinic partnerships.',
  },
];

const faqs = [
  {
    q: 'What is DentalConnect OS?',
    a: 'DentalConnect OS (DCOS) is a B2B dental lab management and clinic collaboration platform. It replaces phone calls, WhatsApp threads, courier delays, and paper prescriptions with a single real-time workspace where dental clinics and fabrication laboratories collaborate on every case from digital scan to final delivery.',
  },
  {
    q: 'Who is DCOS for?',
    a: 'DCOS is built for dental clinics (solo practices, group practices, DSOs) that send prosthetic cases to external labs, and for dental laboratories that receive digital cases and want to modernize their workflow, cut remake rates, and win more clinic partnerships.',
  },
  {
    q: 'Which intraoral scanners does DCOS support?',
    a: 'DCOS supports every major intraoral scanner ecosystem including iTero, 3Shape TRIOS, Medit, Carestream, and Planmeca. Digital scans (STL, PLY, OBJ, DCM) are routed automatically from your local scanner folder to the destination lab via our secure folder-watcher.',
  },
  {
    q: 'Is DCOS available in India?',
    a: 'Yes. DCOS is built and operated in India, GPDP-compliant, and priced in INR. Clinics and labs across metros and tier-2 cities are already collaborating on the platform.',
  },
  {
    q: 'How does DCOS keep patient data safe?',
    a: 'DCOS is Digital Personal Data Protection Act (DPDP) compliant and acts as a Data Processor for clinics and labs. Patient PHI is isolated behind row-level security, share links are masked and expire in 72 hours, and scan files are stored on private buckets accessed via signed URLs.',
  },
  {
    q: 'What does DCOS replace?',
    a: 'DCOS replaces a fragmented stack of WhatsApp messages, courier logs, spreadsheets, paper prescriptions, and shared drives. It also replaces or complements legacy dental lab management software with a modern, real-time, mobile-friendly experience.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'DentalConnect OS',
      alternateName: 'DCOS',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.ico`,
      description:
        'B2B collaboration platform connecting dental clinics and fabrication laboratories on a single real-time channel.',
      areaServed: 'IN',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'DentalConnect OS',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Dental Lab Management Software',
      operatingSystem: 'Web',
      url: SITE_URL,
      description:
        'Dental lab management and clinic collaboration software. Route 3D cases, send digital prescriptions, message labs in real-time, and track case turnaround automatically.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      },
      featureList: features.map((f) => f.title).join(', '),
      audience: {
        '@type': 'Audience',
        audienceType: 'Dental Clinics and Dental Laboratories',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'DentalConnect OS',
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/landing#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'DentalConnect OS', item: `${SITE_URL}/landing` },
      ],
    },
  ],
};

export default function LandingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* SEO-first semantic content — server-rendered so Google indexes it fully.
          Visually hidden from sighted users so it doesn't disrupt the interactive experience,
          but present in the DOM and crawlable. */}
      <article
        aria-hidden="false"
        className="sr-only-seo"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 0,
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      >
        <header>
          <h1>DentalConnect OS — Dental Lab Management &amp; Clinic Collaboration Software</h1>
          <p>
            DentalConnect OS (DCOS) is the operating system for modern dentistry. Connect
            dental clinics and fabrication laboratories on one real-time platform. Route 3D
            cases, send digital prescriptions, message labs instantly, track inventory, and
            measure turnaround — from any intraoral scanner to any lab, in India and beyond.
          </p>
          <p>
            <Link href="/login">Get started with DCOS</Link> ·{' '}
            <Link href="/labs">Browse verified dental laboratories</Link>
          </p>
        </header>

        <section aria-labelledby="features-heading">
          <h2 id="features-heading">Dental clinic-to-lab collaboration, reinvented</h2>
          <ul>
            {features.map((f) => (
              <li key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="benefits-heading">
          <h2 id="benefits-heading">Why dental clinics and labs choose DCOS</h2>
          <ul>
            <li>
              <strong>Cut remake rates.</strong> Structured digital prescriptions and 3D
              annotation reduce miscommunication that leads to costly remakes.
            </li>
            <li>
              <strong>Faster turnaround.</strong> Real-time status and automated production
              stages replace phone-tag between clinic and lab.
            </li>
            <li>
              <strong>Paperless workflow.</strong> Digital prescriptions replace paper
              slips, courier logs, and manual data entry.
            </li>
            <li>
              <strong>Scanner-agnostic.</strong> Works with iTero, 3Shape TRIOS, Medit,
              Carestream, Planmeca — and any intraoral scanner that exports STL/PLY/OBJ.
            </li>
            <li>
              <strong>Built for India, ready for the world.</strong> GPDP-compliant, INR
              pricing, and clinic-to-lab workflows tuned for the Indian dental ecosystem.
            </li>
          </ul>
        </section>

        <section aria-labelledby="use-cases-heading">
          <h2 id="use-cases-heading">Who uses DentalConnect OS?</h2>
          <p>
            Solo dentists sending crowns and bridges to a preferred lab. Group practices and
            DSOs coordinating hundreds of prosthetic cases per month across multiple
            locations. Dental laboratories running digital workflows for zirconia, PMMA,
            e.max, aligners, and full-arch restorations. Prosthodontists and implant
            specialists who need precise 3D communication with lab technicians.
          </p>
        </section>

        <section aria-labelledby="faq-heading" id="faq">
          <h2 id="faq-heading">Frequently asked questions about DCOS dental lab software</h2>
          {faqs.map((f) => (
            <div key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </section>

        <footer>
          <p>
            DentalConnect OS · Dental lab management software · Clinic-to-lab collaboration
            platform · Digital dentistry workflow · Made in India.
          </p>
        </footer>
      </article>

      <InteractiveLanding />
    </>
  );
}
