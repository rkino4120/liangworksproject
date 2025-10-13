'use client';

import { useWorks } from '@/hooks/useWorks';
import WorksGrid from '@/components/WorksGrid';
import { LoadingSpinner, ErrorMessage } from '@/components/LoadingStates';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Home() {
  const { works, loading, error } = useWorks();

  usePageMeta({
    title: 'VR Galleries - WebGL/WebGPU作品集',
    description: 'Three.js、Babylon.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー。インタラクティブな3D体験をお楽しみください。',
    keywords: 'WebGL, WebGPU, Three.js, Babylon.js, VR, 3D, インタラクティブ, アート, ギャラリー',
    ogType: 'website',
    ogImage: '/images/og-image.jpg'
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-slate-50 opacity-70"></div>
        <div className="relative z-10 container mx-auto px-4 py-12">
          <nav className="flex justify-center mb-8">
            <div className="flex items-center space-x-6">
              <span className="text-slate-700 font-semibold text-sm border-b-2 border-slate-300 pb-1">
                作品一覧
              </span>
              <Button variant="ghost" asChild>
                <Link href="/contact">Contact</Link>
              </Button>
            </div>
          </nav>
          
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight font-serif text-slate-800 drop-shadow-sm">
              VR Galleries
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              VRゴーグルで写真を鑑賞できるギャラリーです。
              <br />
              作品の新たな展示方法をお楽しみください。
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="space-y-8">
            <ErrorMessage message={error} />
            <Separator />
            <WorksGrid initialWorks={works} />
          </div>
        ) : (
          <WorksGrid initialWorks={works} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              &copy; 2025 Liang Works. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
