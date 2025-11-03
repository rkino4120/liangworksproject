'use client';

import { useState, useEffect, useCallback } from 'react';
import { News } from '@/lib/microcms';

interface UseNewsResult {
  news: News[];
  loading: boolean;
  error: string | null;
}

export function useNews(): UseNewsResult {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // API Route経由でデータ取得
      const apiResponse = await fetch('/api/news');
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();
      setNews(response.contents || []);
    } catch (err) {
      console.error('お知らせの取得に失敗しました:', err);
      setError('お知らせの取得に失敗しました');
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return { news, loading, error };
}
