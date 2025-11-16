// news.jsonから読み込むお知らせデータの型定義
export type News = {
  id: number | string;
  title: string;
  body: string;
  publishedAt: string;
};

// APIレスポンス型
export type NewsResponse = {
  contents: News[];
};
