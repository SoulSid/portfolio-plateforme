import { buildFeed } from '@/lib/rss';

export async function GET() {
  return new Response(await buildFeed('fr'), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
