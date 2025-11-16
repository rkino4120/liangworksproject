// 型定義のみを提供するファイル
// Works: API Route /api/works で MicroCMS から取得
// News: API Route /api/news で news.json から取得

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
  publishedAt: string;
  updatedAt: string;
};

export type WorkResponse = {
  contents: Work[];
  totalCount: number;
  offset: number;
  limit: number;
};

export type News = {
  id: number | string;
  title: string;
  body: string;
  publishedAt: string;
};

export type NewsResponse = {
  contents: News[];
};