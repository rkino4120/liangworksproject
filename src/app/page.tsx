'use client';

import { useWorks } from '@/hooks/useWorks';
import WorksGrid from '@/components/WorksGrid';
import { LoadingSpinner, ErrorMessage } from '@/components/LoadingStates';
import Link from 'next/link';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Home() {
  const { works, loading, error } = useWorks();

  // カスタムフックでページのmeta情報を設定
  usePageMeta({
    title: 'VR Galleries - WebGL/WebGPU作品集',
    description: 'Three.js、Babylon.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー。インタラクティブな3D体験をお楽しみください。',
    keywords: 'WebGL, WebGPU, Three.js, Babylon.js, VR, 3D, インタラクティブ, アート, ギャラリー',
    ogType: 'website',
    ogImage: '/images/og-image.jpg'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex justify-center mb-6">
            <div className="flex space-x-8">
              <span className="text-black font-medium border-b-2 border-black pb-1">
                作品一覧
              </span>
              <Link href="/contact" className="text-gray-600 hover:text-black transition-colors duration-200">
                Contact
              </Link>
            </div>
          </nav>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              VR Galleries
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              WebXR技術を生かしたVRアートギャラリー展示場です。
              <br />
              デジタル作品の新たな体験をお楽しみください。
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div>
            <ErrorMessage message={error} />
            <div className="mt-8">
              <WorksGrid initialWorks={works} />
            </div>
          </div>
        ) : (
          <WorksGrid initialWorks={works} />
        )}
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 Liang Works. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}