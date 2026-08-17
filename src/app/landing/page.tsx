import type { Metadata } from 'next';
import Link from 'next/link';
import InteractiveLanding from '@/components/landing/InteractiveLandingWrapper';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  title: 'Dental Lab Management & Clinic Collaboration Software',
  description:
    'DentalConnect OS (DCOS) connects dental clinics and laboratories on one real-time cloud platform — 3D case routing, digital prescriptions, instant messaging, inventory tracking, and automated turnaround. The operating system for modern dentistry, built for clinics and labs worldwide.',
  // The landing content is served at the bare root `/` (via a middleware rewrite for
  // signed-out visitors), so the root is the canonical homepage. Direct hits on
  // `/landing` consolidate into `/` via this canonical.
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'DentalConnect OS — Dental Lab Management & Clinic Collaboration Software',
    description:
      'Connect dental clinics and labs on one real-time platform. 3D case routing, digital prescriptions, and automated turnaround tracking.',
    url: SITE_URL,
    type: 'website',
    // A page-level openGraph block replaces the parent's entirely, so `images`
    // must be restated here or social shares render with no preview image.
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'DentalConnect OS — The Operating System for Modern Dentistry',
      },
    ],
  },
};

const features = [
  {
    title: 'Zero-Hallucination Ambient Voice AI',
    body: 'Hands-free operatory dictation with client-side Voice Activity Detection and Grammar-Constrained Decoding mapping voice directly to ISO 3950 tooth numbers, 6-point perio probing, and SNOMED-CT findings in sub-40ms.',
  },
  {
    title: 'Bi-Temporal Event Log & Merkle Ledger',
    body: 'Append-only domain event ledger cleanly separating clinical observation time (observed_at) from transaction time (system_at), providing cryptographic tamper-evidence and historical time-travel chart reconstruction.',
  },
  {
    title: 'National ABDM (M1-M3) & HL7 FHIR R5',
    body: 'Built-in ABHA ID validation, Dynamic Care Context linking, and NRCeS-compliant Fidelius Curve25519 ECDH + AES-256-GCM encryption with automated consent expiration guardrails.',
  },
  {
    title: 'Progressive WebGL 3D Mesh Engine (LOD)',
    body: 'Quadric Error Metric decimation streams 50MB+ color scans with instant coarse 5% proxy rendering, real-time GLSL occlusal clearance heatmaps, and subgingival margin finish line curve tracing.',
  },
  {
    title: 'Multi-Planar CBCT / DICOM Viewer (MPR)',
    body: 'Integrated tri-planar Axial, Coronal, and Sagittal cross-sectional views with Hounsfield Unit bone/soft tissue windowing and Inferior Alveolar Nerve (IAN) canal tracing.',
  },
  {
    title: 'Autonomous Claims & Fatigue Scheduler',
    body: 'Deterministic CDT code scrubber for real-time prior-auth claim adjudication and probabilistic scheduling modeling provider cognitive fatigue to auto-rebalance clinic queues.',
  },
];

const faqs = [
  {
    q: 'What is DentalConnect OS (DCOS 2.0)?',
    a: 'DentalConnect OS (DCOS 2.0) is a bi-temporal, ambient-driven, and local-first Clinical & Laboratory Operating System for modern dentistry. It unifies ambient voice charting, cryptographic Merkle ledger event sourcing, national ABDM/FHIR R5 compliance, progressive 3D medical imaging, and autonomous agentic workflows in a single real-time platform.',
  },
  {
    q: 'How does Ambient Voice Charting eliminate AI hallucinations?',
    a: 'Rather than passing audio to generic LLMs, DCOS utilizes client-side Voice Activity Detection (VAD) paired with Context-Free Grammar (CFG) constrained decoding against standardized dental nomenclature (ISO 3950, SNOMED-CT, CDT). Dictations map deterministically to structured clinical payloads with 0% semantic hallucination.',
  },
  {
    q: 'What makes the Bi-Temporal Merkle Ledger unique?',
    a: 'Unlike traditional relational PMS software that overwrites records, DCOS stores clinical events on an append-only cryptographic ledger chained with SHA-256 hashes. It maintains dual timelines: real-world clinical observation time and system transaction time, allowing retrospective time-travel audits without data tampering.',
  },
  {
    q: 'How does DCOS comply with Indian ABDM and international health standards?',
    a: 'DCOS natively implements ABDM Milestones 1 (ABHA identity validation), 2 (Care Context discovery and linking), and 3 (Fidelius Curve25519 ECDH + AES-256-GCM encrypted data transfers). It also exports standardized HL7 FHIR R5 Diagnostic Document Bundles for global EHR interoperability.',
  },
  {
    q: 'How does the Progressive 3D LOD engine handle large 50MB+ intraoral scans?',
    a: 'Standard 3D viewers frequently crash mobile tablets and browser tabs. DCOS executes Quadric Error Metric (QEM) decimation to stream an initial 5% coarse proxy mesh in under 80ms, progressively loading high-resolution vertex buffers as the camera settles, paired with real-time occlusal clearance heatmaps.',
  },
  {
    q: 'Which hardware devices and CAD software does DCOS bridge with?',
    a: 'DCOS includes a local WebSocket capture bridge for physical intraoral cameras and USB foot-pedals, transient 15-minute smartphone QR intake tokens, and native XML project parsers for Exocad and 3Shape .constructionInfo files.',
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
      areaServed: {
        '@type': 'Place',
        name: 'Worldwide',
      },
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
        priceCurrency: 'USD',
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
      inLanguage: 'en',
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
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
            dental clinics and fabrication laboratories on one real-time cloud platform.
            Route 3D cases, send digital prescriptions, message labs instantly, track
            inventory, and measure turnaround — from any intraoral scanner to any lab,
            anywhere in the world.
          </p>
          <p>
            <Link href="/login">Get started with DCOS</Link> ·{' '}
            <Link href="/labs">Browse verified dental laboratories</Link> ·{' '}
            <Link href="/blog">Dental lab software guides and comparisons</Link>
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
              <strong>Compliance-ready worldwide.</strong> Aligned with HIPAA (US), GDPR
              (EU/UK), and DPDP (India) requirements out of the box, so you can ship cases
              anywhere your clinic operates.
            </li>
            <li>
              <strong>Multi-currency billing.</strong> Priced in USD, EUR, GBP, INR, and
              AED — pay in your local currency where supported.
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

        <section aria-labelledby="resources-heading">
          <h2 id="resources-heading">Guides for choosing dental lab software</h2>
          <ul>
            <li>
              <Link href="/blog/best-dental-lab-software-india-2026">
                Best dental lab software in India (2026 buyer’s guide)
              </Link>
            </li>
            <li>
              <Link href="/blog/dcos-vs-labyx">
                DCOS vs Labyx: which dental lab software is right for you?
              </Link>
            </li>
            <li>
              <Link href="/blog/how-to-choose-dental-lab-management-software">
                How to choose dental lab management software: 7 criteria that matter
              </Link>
            </li>
            <li>
              <Link href="/blog">All DentalConnect OS guides and comparisons</Link>
            </li>
          </ul>
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
            platform · Digital dentistry workflow · Available worldwide.
          </p>
        </footer>
      </article>

      <InteractiveLanding />
    </>
  );
}
