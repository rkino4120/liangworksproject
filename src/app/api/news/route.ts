import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'news.json');
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    // Support both { news: [...] } and { contents: [...] }
    const contents = parsed.contents ?? parsed.news ?? [];

    return NextResponse.json({ contents });
  } catch (error) {
    console.error('Failed to read news.json:', error);
    return NextResponse.json(
      { error: 'Failed to read news' },
      { status: 500 }
    );
  }
}
