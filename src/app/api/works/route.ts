import { NextResponse } from 'next/server';
import { createClient } from 'microcms-js-sdk';

// サーバーサイドでのみ環境変数を使用
const client = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN!,
  apiKey: process.env.MICROCMS_API_KEY!,
});

export type Work = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    revisedAt: string;
  };
  thumbnail?: {
    url: string;
    height: number;
    width: number;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
};

export type WorksResponse = {
  contents: Work[];
  totalCount: number;
  offset: number;
  limit: number;
};

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
