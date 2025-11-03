// microCMS APIから返されるお知らせデータの型定義
export type News = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  updatedAt: string;
  createdAt: string;
  revisedAt: string;
};

// microCMS APIのレスポンス型
export type NewsResponse = {
  contents: News[];
  totalCount: number;
  offset: number;
  limit: number;
};
