import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleShell, proseStyles as s } from '@/components/blog/ArticleShell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';
const SLUG = 'how-to-choose-dental-lab-management-software';
const TITLE = 'How to choose dental lab management software: 7 criteria that matter';
const DEK =
  'The framework we use with dentists and lab owners to cut through demos, marketing pages, and edge features — and pick software that ships cases faster.';
const PUBLISHED_ISO = '2026-08-13';
const PUBLISHED_LABEL = 'August 13, 2026';

export const metadata: Metadata = {
  title: TITLE,
  description:
    'A practical framework for choosing dental lab management software — 7 criteria that separate real value from demo theatre, plus questions to ask every vendor.',
  alternates: { canonical: `/blog/${SLUG}` },
  openGraph: {
    title: TITLE,
    description: DEK,
    url: `${SITE_URL}/blog/${SLUG}`,
    type: 'article',
    publishedTime: PUBLISHED_ISO,
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
  keywords:
    'how to choose dental lab software, dental lab management software criteria, dental software evaluation, digital dentistry workflow',
};

export default function Post() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleShell
        eyebrow="How-to"
        title={TITLE}
        lede={DEK}
        publishedISO={PUBLISHED_ISO}
        publishedLabel={PUBLISHED_LABEL}
        readMinutes={8}
      >
        <p style={s.p}>
          Every dental software vendor sells the same thing on the demo call: real-time
          collaboration, better TAT, fewer remakes, happy customers. Every vendor is
          also, mostly, telling the truth in the abstract. The problem is that the abstract
          isn’t what determines whether the software works for you.
        </p>
        <p style={s.p}>
          This is the framework we use to help clinics and labs cut through all of that.
          Seven criteria. Each one has a question you can ask a vendor that gets to the
          truth in one sentence.
        </p>

        <h2 style={s.h2}>1. Does it fit the case, not the org chart?</h2>
        <p style={s.p}>
          A case moves between two organizations: the clinic that scanned it and the lab
          that will fabricate it. Software that treats one side as a first-class user and
          the other as a “portal user” is architecturally biased. That bias shows up in
          every workflow.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “Show me the exact same case from both the dentist’s
          screen and the lab technician’s screen. Which one is nicer to use?”
        </p>

        <h2 style={s.h2}>2. Does it eliminate the paper prescription?</h2>
        <p style={s.p}>
          The paper prescription is the source of most remakes. It’s incomplete, it’s
          handwritten, and it arrives after the scan. Good software forces the clinic to
          complete a structured prescription with mandatory fields — material, shade,
          margin design, occlusion — before the case can even move.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “Can a case be submitted without a material selected?
          Without a shade? Without a prep type?”
        </p>

        <h2 style={s.h2}>3. Does the 3D view actually get used?</h2>
        <p style={s.p}>
          Most platforms have a 3D viewer. Very few have a 3D viewer that the dentist
          actually opens after the case leaves their scanner. The tell is whether comments
          can be pinned directly to the model, and whether those pins show up when the
          technician opens the case — from the same camera angle the dentist used.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “Show me a spatial pin comment on a real STL model,
          created from the clinic side, being read from the lab side.”
        </p>

        <h2 style={s.h2}>4. Does the scanner integration reduce steps?</h2>
        <p style={s.p}>
          Any vendor will say they integrate with iTero, 3Shape TRIOS, Medit, and
          Carestream. What most of them mean is that the scanner exports a file to a
          folder, and someone at the clinic uploads that file through a web form. That’s
          not integration. Integration is when the file arrives at the lab automatically,
          seconds after the scan finishes.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “Does a case appear at the lab without anyone at the
          clinic clicking upload?”
        </p>

        <h2 style={s.h2}>5. Is turnaround measured, not just tracked?</h2>
        <p style={s.p}>
          Case status boards look impressive on a demo. What matters is whether the
          software gives you a number — average TAT for this month, versus last month,
          broken down by material category. Without that number, you can’t improve.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “What was our average TAT last month? Show me the chart
          you’ll show me on Day 30 of using this.”
        </p>

        <h2 style={s.h2}>6. Is patient data actually isolated?</h2>
        <p style={s.p}>
          India’s DPDP Act is not a suggestion. Any platform touching patient PHI needs
          documented data isolation, masked share links that expire, and a clear
          Processor-vs-Fiduciary relationship. If a vendor’s answer is a marketing
          paragraph rather than a technical one, that’s the answer.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “What database schema does patient PHI sit in? What
          happens to a share preview link 72 hours after it’s created?”
        </p>

        <h2 style={s.h2}>7. Will your team actually use it in 90 days?</h2>
        <p style={s.p}>
          The most expensive software mistake is the platform your team stops using in
          month three because it’s clunky, slow, or optimized for a demo that doesn’t
          match their daily flow. Software should collapse steps, not add them.
        </p>
        <p style={s.p}>
          <strong>Ask:</strong> “How many clicks does it take to route a new crown case
          from scan to lab? Time me on your live system.”
        </p>

        <h2 style={s.h2}>The evaluation timeline that actually works</h2>
        <p style={s.p}>
          A software decision on this level shouldn’t take a quarter. Two weeks is
          plenty:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>
            <strong>Day 1-2:</strong> Read the vendor’s public content. Skip the demo if
            the marketing page can’t answer your top three questions.
          </li>
          <li style={s.li}>
            <strong>Day 3-4:</strong> One 30-minute working session with each shortlisted
            vendor. Not a demo — you drive, they answer.
          </li>
          <li style={s.li}>
            <strong>Day 5-10:</strong> Run five real cases end-to-end on each finalist.
            Have both the dentist and the technician rate the experience.
          </li>
          <li style={s.li}>
            <strong>Day 11-14:</strong> Decide, sign, and start onboarding.
          </li>
        </ul>

        <h2 style={s.h2}>The red flags</h2>
        <p style={s.p}>
          Some things reliably predict a bad fit:
        </p>
        <ul style={s.ul}>
          <li style={s.li}>
            No public pricing and no willingness to give you a number in the first call.
          </li>
          <li style={s.li}>
            Multi-week implementation timelines for a clinic-lab workflow that should
            work on Day 1.
          </li>
          <li style={s.li}>
            A dashboard that shows you a lot of numbers you didn’t ask for and can’t act
            on.
          </li>
          <li style={s.li}>
            Roadmaps that keep pushing your must-have feature by a quarter.
          </li>
        </ul>

        <h2 style={s.h2}>Where DCOS fits</h2>
        <p style={s.p}>
          We built DentalConnect OS around this framework — because we watched clinics and
          labs choose the wrong software over and over and lose months to it. If you want
          to run the seven questions above against DCOS itself, we’ll do that in a live
          case walkthrough.{' '}
          <Link href="/login" style={s.a}>
            Get started here.
          </Link>
        </p>

        <h2 style={s.h2}>Related reading</h2>
        <ul style={s.ul}>
          <li style={s.li}>
            <Link href="/blog/best-dental-lab-software-india-2026" style={s.a}>
              Best dental lab software in India (2026 buyer’s guide)
            </Link>
          </li>
          <li style={s.li}>
            <Link href="/blog/dcos-vs-labyx" style={s.a}>
              DCOS vs Labyx: which dental lab software is right for you?
            </Link>
          </li>
        </ul>
      </ArticleShell>
    </>
  );
}
