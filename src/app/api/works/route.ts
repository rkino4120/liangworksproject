import { NextResponse } from 'next/server';
import { createClient } from 'microcms-js-sdk';
import { WorksResponse } from '@/types/work';

// サーバーサイドでのみ環境変数を使用
const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

export async function GET() {
  try {
    const data = await client.get<WorksResponse>({
      endpoint: 'itemlist',
      queries: {
        fields: 'id,title,description,url,category,thumbnail,createdAt,updatedAt,publishedAt,revisedAt',
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('microCMS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch works' },
      { status: 500 }
    );
  }
}
