import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * Image Open Graph générée à la volée.
 * Reprend la grammaire visuelle du site : fond encre, monospace, accent.
 * /og?title=...&kind=...&meta=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') ?? '').slice(0, 120);
  const meta = (searchParams.get('meta') ?? '').slice(0, 90);
  const skin = searchParams.get('skin') === 'bitfield' ? 'bitfield' : 'octet';
  const accent = skin === 'bitfield' ? '#C5F82A' : '#F0A500';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#07090C',
          padding: '72px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#7D8794' }}>
          {meta.toUpperCase()}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 70 ? 54 : 66,
            fontWeight: 700,
            lineHeight: 1.15,
            color: '#E8ECF1',
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', height: 6 }}>
          <div style={{ display: 'flex', width: 640, height: 2, background: '#1E252F' }} />
          <div style={{ display: 'flex', width: 110, height: 6, background: accent }} />
          <div style={{ display: 'flex', width: 306, height: 2, background: '#1E252F' }} />
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
