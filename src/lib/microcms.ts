// 型定義のみを提供するファイル
// 実際のAPIコールはAPI Route (/api/works, /api/news) で行う

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
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

export type NewsResponse = {
  contents: News[];
  totalCount: number;
  offset: number;
  limit: number;
};