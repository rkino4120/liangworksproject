'use client';

import { useWorks } from '@/hooks/useWorks';
import WorksGrid from '@/components/WorksGrid';
import { LoadingSpinner, ErrorMessage } from '@/components/LoadingStates';

export default function Home() {
  const { works, loading, error } = useWorks();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Liang Works
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three.js、Babylon.jsを使用したWebGL/WebGPU作品集です。
              <br />
              ぜひ感想をお聞かせください。
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
            <p>&copy; 2024 WebGL Works. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}