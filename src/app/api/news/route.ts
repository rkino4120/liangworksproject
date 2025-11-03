import { NextResponse } from 'next/server';
import { getNews } from '@/lib/microcms';

export async function GET() {
  try {
    const response = await getNews();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
