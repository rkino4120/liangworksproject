import { createClient } from 'microcms-js-sdk';
import { config } from './config';

export const client = createClient({
  serviceDomain: config.microCMS.serviceDomain,
  apiKey: config.microCMS.apiKey,
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

export const getWorks = async (): Promise<WorkResponse> => {
  return await client.get({
    endpoint: 'itemlist',
    queries: {
      fields: 'id,title,description,url,category,thumbnail,publishedAt,updatedAt',
      limit: 50,
    },
  });
};

export const getWorksByCategory = async (category: string): Promise<WorkResponse> => {
  return await client.get({
    endpoint: 'itemlist',
    queries: {
      fields: 'id,title,description,url,category,thumbnail,publishedAt,updatedAt',
      filters: `category[equals]${category}`,
      limit: 50,
    },
  });
};

export const getNews = async (): Promise<NewsResponse> => {
  return await client.get({
    endpoint: 'news',
    queries: {
      fields: 'id,title,body,publishedAt,updatedAt',
      limit: 5,
      orders: '-publishedAt',
    },
  });
};
