// microCMS APIから返される作品データの型定義
export type Work = {
  id: string;
  title: string;
  description: string;
  url: string;
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

// microCMS APIのレスポンス型
export type WorksResponse = {
  contents: Work[];
  totalCount: number;
  offset: number;
  limit: number;
};
