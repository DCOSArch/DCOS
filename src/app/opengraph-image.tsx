import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DentalConnect OS — Dental Lab Management & Clinic Collaboration Software';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #1E1F1C 0%, #272822 55%, #1E1F1C 100%)',
          color: '#F3F1E7',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '80px 96px',
          position: 'relative',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            display: 'flex',
            width: '80px',
            height: '6px',
            background: '#A6E22E',
            borderRadius: '4px',
            marginBottom: '48px',
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '48px',
          }}
        >
          {/* Stethoscope-ish glyph */}
          <div
            style={{
              display: 'flex',
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: '#1E1F1C',
              border: '2px solid #3E3D32',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#66D9EF',
              fontSize: '40px',
              fontWeight: 800,
            }}
          >
            D
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#F3F1E7' }}>
              DentalConnect OS
            </div>
            <div style={{ fontSize: '20px', color: '#C2BEAD', marginTop: '4px' }}>
              The Operating System for Modern Dentistry
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '64px',
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: '#F3F1E7',
            maxWidth: '1000px',
          }}
        >
          <span>Dental lab management &</span>
          <span>
            clinic collaboration,{' '}
            <span style={{ color: '#66D9EF' }}>in one platform.</span>
          </span>
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: 'auto',
            flexWrap: 'wrap',
          }}
        >
          {['3D case routing', 'Digital prescriptions', 'Real-time messaging', 'TAT tracking'].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '12px 20px',
                  background: 'rgba(166, 226, 46, 0.12)',
                  border: '1px solid rgba(166, 226, 46, 0.35)',
                  borderRadius: '999px',
                  color: '#A6E22E',
                  fontSize: '22px',
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            bottom: '40px',
            right: '96px',
            fontSize: '22px',
            color: '#8E8B7F',
            letterSpacing: '0.02em',
          }}
        >
          dcos.in
        </div>
      </div>
    ),
    { ...size }
  );
}
