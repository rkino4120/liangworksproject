import { NextResponse } from 'next/server';
import { createClient } from 'microcms-js-sdk';

// サーバーサイド専用のクライアント（NEXT_PUBLIC_なしの環境変数を使用）
const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

export async function GET() {
  try {
    const response = await client.get({
      endpoint: 'news',
      queries: {
        fields: 'id,title,body,publishedAt,updatedAt',
        limit: 5,
        orders: '-publishedAt',
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
