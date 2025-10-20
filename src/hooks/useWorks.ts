'use client';

import { useState, useEffect, useCallback } from 'react';
import { Work } from '@/types/work';

interface UseWorksResult {
  works: Work[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'webgl-works-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分

interface CacheData {
  works: Work[];
  timestamp: number;
}

export const useWorks = (): UseWorksResult => {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // キャッシュからデータを読み込み
  const loadFromCache = useCallback((): Work[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const cacheData: CacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          return cacheData.works;
        }
      }
    } catch (error) {
      console.warn('Failed to load from cache:', error);
    }
    return null;
  }, []);

  // キャッシュにデータを保存
  const saveToCache = useCallback((works: Work[]) => {
    try {
      const cacheData: CacheData = {
        works,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, []);

  const fetchWorks = useCallback(async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // キャッシュから読み込み試行
      if (useCache) {
        const cachedWorks = loadFromCache();
        if (cachedWorks) {
          setWorks(cachedWorks);
          setLoading(false);
          setLastUpdated(new Date());
          return;
        }
      }

      // API Route経由でデータ取得
      const apiResponse = await fetch('/api/works');
      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();
      setWorks(response.contents);
      saveToCache(response.contents);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch works:', err);
      setError('作品データの取得に失敗しました');
      // エラー時のサンプルデータを表示
      setWorks([
        {
          id: '1',
          title: 'Interactive 3D Scene',
          description: 'Three.jsを使ったインタラクティブな3Dシーン。マウスの動きに応じてオブジェクトが回転します。',
          url: 'https://example.com/threejs-demo1',
          thumbnail: {
            url: '/next.svg',
            width: 400,
            height: 300,
          },
          createdAt: '2024-01-15T10:00:00.000Z',
          publishedAt: '2024-01-15T10:00:00.000Z',
          updatedAt: '2024-01-15T10:00:00.000Z',
          revisedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          id: '2',
          title: 'VR Gallery Experience',
          description: 'Three.jsとWebXRを使ったVRギャラリー体験。3D空間での写真鑑賞を楽しめます。',
          url: 'https://example.com/threejs-demo2',
          thumbnail: {
            url: '/vercel.svg',
            width: 400,
            height: 300,
          },
          createdAt: '2024-01-10T10:00:00.000Z',
          publishedAt: '2024-01-10T10:00:00.000Z',
          updatedAt: '2024-01-10T10:00:00.000Z',
          revisedAt: '2024-01-10T10:00:00.000Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return {
    works,
    loading,
    error,
    refetch: (useCache = false) => fetchWorks(useCache),
    lastUpdated,
  };
};
