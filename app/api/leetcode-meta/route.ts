import { NextRequest, NextResponse } from 'next/server';
import { fetchLeetCodeMeta } from '@/lib/leetcode';

// POST /api/leetcode-meta
// Body: { url: string }
// Lets the frontend preview title/difficulty/tags before actually saving a solve.
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'Missing "url" in request body' }, { status: 400 });
    }
    const meta = await fetchLeetCodeMeta(url);
    return NextResponse.json({ meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
