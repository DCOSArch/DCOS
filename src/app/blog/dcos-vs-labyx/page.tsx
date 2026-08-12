import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleShell, proseStyles as s } from '@/components/blog/ArticleShell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';
const SLUG = 'dcos-vs-labyx';
const TITLE = 'DCOS vs Labyx: which dental lab software is right for you?';
const DEK =
  'A side-by-side look at how DentalConnect OS and Labyx approach clinic-lab collaboration, pricing, digital workflows, and scanner integration.';
const PUBLISHED_ISO = '2026-08-13';
const PUBLISHED_LABEL = 'August 13, 2026';

export const metadata: Metadata = {
  title: TITLE,
  description:
    'DCOS vs Labyx comparison — architecture, workflow, 3D collaboration, pricing model, and which platform fits which type of dental clinic or lab.',
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: {
    title: TITLE,
    description: DEK,
    url: `${SITE_URL}/blog/${SLUG}`,
    type: 'article',
    publishedTime: PUBLISHED_ISO,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: TITLE }],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: TITLE,
  description: DEK,
  datePublished: PUBLISHED_ISO,
  dateModified: PUBLISHED_ISO,
  mainEntityOfPage: `${SITE_URL}/blog/${SLUG}`,
  author: { '@type': 'Organization', name: 'DentalConnect OS' },
  publisher: {
    '@type': 'Organization',
    name: 'DentalConnect OS',
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.ico` },
  },
  image: `${SITE_URL}/opengraph-image`,
  keywords: 'DCOS vs Labyx, Labyx alternative, dental lab software comparison, dental lab management software India',
};

export default function Post() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleShell
        eyebrow="Comparison"
        title={TITLE}
        lede={DEK}
        publishedISO={PUBLISHED_ISO}
        publishedLabel={PUBLISHED_LABEL}
        readMinutes={7}
      >
        <p style={s.p}>
          Full disclosure up front: we make DentalConnect OS. We’ve tried to write this
          comparison the way we’d want to read one — with real distinctions, not straw-man
          arguments. Labyx is a legitimate product with real customers across India, and
          for some buyers it’s the right pick. This post is about helping you figure out
          which buyer you are.
        </p>

        <h2 style={s.h2}>The one-line summary</h2>
        <p style={s.p}>
          <strong>Labyx</strong> is lab-first. Its core is production, billing, and case
          tracking inside a dental laboratory, with a client portal bolted on for the
          clinics that send work.{' '}
          <strong>DCOS</strong> is collaboration-first. Its core is the case moving
          between two parties — a clinic and a lab — with production, prescriptions, and
          messaging designed to feel native to both sides.
        </p>

        <h2 style={s.h2}>Side-by-side</h2>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Dimension</th>
              <th style={s.th}>DentalConnect OS</th>
              <th style={s.th}>Labyx</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.td}>Primary user</td>
              <td style={s.td}>Two-sided (clinic + lab)</td>
              <td style={s.td}>Lab-first, with a client portal for clinics</td>
            </tr>
            <tr>
              <td style={s.td}>Case entry</td>
              <td style={s.td}>
                Digital prescription structured for the clinic; auto-imported scans via
                folder-watcher
              </td>
              <td style={s.td}>
                Fast, lab-optimized case entry; portal for clinics to submit
              </td>
            </tr>
            <tr>
              <td style={s.td}>3D collaboration</td>
              <td style={s.td}>
                Native STL/PLY viewer with spatial pin comments tied to mesh vertices
              </td>
              <td style={s.td}>
                Case attachments and communications; 3D collaboration is not the headline
              </td>
            </tr>
            <tr>
              <td style={s.td}>Messaging</td>
              <td style={s.td}>
                Case-scoped real-time chat between clinic and lab, threaded to each case
              </td>
              <td style={s.td}>Client communications module</td>
            </tr>
            <tr>
              <td style={s.td}>Turnaround tracking</td>
              <td style={s.td}>
                Automated stage transitions with timestamps visible to both sides
              </td>
              <td style={s.td}>Production stage tracking inside the lab</td>
            </tr>
            <tr>
              <td style={s.td}>Scanner integration</td>
              <td style={s.td}>
                Local folder watcher for iTero / 3Shape / Medit / Carestream
              </td>
              <td style={s.td}>Manual or portal upload</td>
            </tr>
            <tr>
              <td style={s.td}>Inventory</td>
              <td style={s.td}>Automatic deductions on stage transitions</td>
              <td style={s.td}>Lab production inventory module</td>
            </tr>
            <tr>
              <td style={s.td}>Billing</td>
              <td style={s.td}>Basic invoicing; not the product’s core</td>
              <td style={s.td}>Full lab billing including pickup/delivery plans</td>
            </tr>
            <tr>
              <td style={s.td}>Pricing model</td>
              <td style={s.td}>
                Per clinic-lab pair. Free for the first pair. Transparent tiers online.
              </td>
              <td style={s.td}>Phone-based sales; no public pricing at time of writing</td>
            </tr>
            <tr>
              <td style={s.td}>Deployment</td>
              <td style={s.td}>Cloud (SaaS), mobile-friendly</td>
              <td style={s.td}>Cloud (SaaS)</td>
            </tr>
            <tr>
              <td style={s.td}>Compliance posture</td>
              <td style={s.td}>
                India DPDP-aligned; documented data isolation and preview link expiry
              </td>
              <td style={s.td}>Standard cloud security</td>
            </tr>
          </tbody>
        </table>

        <h2 style={s.h2}>When Labyx is the right choice</h2>
        <p style={s.p}>
          Labyx is the more mature product on the lab-back-office dimensions. If your
          decision looks like this, Labyx probably wins for you:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>
            You’re a dental lab owner and your top pain is billing, delivery plans, and
            production scheduling — not clinic communication.
          </li>
          <li style={s.li}>
            You already have a system for clinics submitting scans (email, WhatsApp, or a
            shared drive) that works, and you don’t want to change the clinic-side
            behavior right now.
          </li>
          <li style={s.li}>
            You want an off-the-shelf lab-management stack with a large existing user
            base in India.
          </li>
        </ul>

        <h2 style={s.h2}>When DCOS is the right choice</h2>
        <p style={s.p}>
          DCOS wins when the clinic-lab boundary is where the pain lives. That’s the case
          for most clinics we talk to, and an increasing number of labs. Pick DCOS if:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>
            You’re a clinic (or DSO) evaluating software — Labyx assumes you’ll use the
            lab’s system. DCOS is built for you as a first-class user.
          </li>
          <li style={s.li}>
            Remakes and clarification calls are eating your margin. Structured
            prescriptions and 3D pin messaging directly attack that.
          </li>
          <li style={s.li}>
            You want scanner-folder integration so scans get to the lab without a human
            in the middle.
          </li>
          <li style={s.li}>
            You care about DPDP compliance and want documented data isolation on Day 1.
          </li>
          <li style={s.li}>
            You want transparent pricing you can compare without a sales call.
          </li>
        </ul>

        <h2 style={s.h2}>The honest edge cases</h2>
        <p style={s.p}>
          There are situations where neither product is the right answer. If you’re a
          five-technician lab with no digital cases and no clinic pressure to modernize,
          spreadsheets and WhatsApp still work. If you’re a 3Shape-native operation
          running a heavy CAD/CAM workflow, 3Shape LMS may be a better fit than either
          Indian option. Software is a lever — pick it for the job you actually have.
        </p>

        <h2 style={s.h2}>How to decide in a week</h2>
        <p style={s.p}>
          Both DCOS and Labyx offer demos. Instead of watching two demos and deciding,
          run this three-step evaluation:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>
            <strong>Pick one clinic-lab pair.</strong> Not the biggest, not the smallest.
            The most typical.
          </li>
          <li style={s.li}>
            <strong>Route 10 real cases through each platform</strong> over one week each.
            Measure remakes, clarification messages, and TAT.
          </li>
          <li style={s.li}>
            <strong>Ask both sides — the dentist and the lab technician — which
            platform they’d fight to keep.</strong> Take the answer seriously even if
            it’s not the one you expected.
          </li>
        </ul>

        <p style={s.p}>
          If you want to start the DCOS side of that pilot, it’s a{' '}
          <Link href="/login" style={s.a}>
            free signup
          </Link>{' '}
          — the first clinic-lab pair is on us.
        </p>

        <h2 style={s.h2}>Related reading</h2>
        <ul style={s.ul}>
          <li style={s.li}>
            <Link href="/blog/best-dental-lab-software-india-2026" style={s.a}>
              Best dental lab software in India (2026 buyer’s guide)
            </Link>
          </li>
          <li style={s.li}>
            <Link href="/blog/how-to-choose-dental-lab-management-software" style={s.a}>
              How to choose dental lab management software: 7 criteria that matter
            </Link>
          </li>
        </ul>
      </ArticleShell>
    </>
  );
}
