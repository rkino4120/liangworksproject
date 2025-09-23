import { getWorks } from '@/lib/microcms';
import WorksGrid from '@/components/WorksGrid';

export default async function Home() {
  let works = [];
  
  try {
    const response = await getWorks();
    works = response.contents;
  } catch (error) {
    console.error('Failed to fetch works:', error);
    // デモ用のダミーデータ
    works = [
      {
        id: '1',
        title: 'Interactive 3D Scene',
        description: 'Three.jsで作成したインタラクティブな3Dシーン。マウスの動きに合わせてオブジェクトが回転します。',
        url: 'https://example.com/threejs-demo1',
        category: {
          id: 'threejs',
          name: 'Three.js',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z'
        },
        thumbnail: {
          url: '/next.svg',
          width: 400,
          height: 300,
        },
        publishedAt: '2024-01-15T10:00:00.000Z',
        updatedAt: '2024-01-15T10:00:00.000Z',
      },
      {
        id: '2',
        title: 'Physics Simulation',
        description: 'Babylon.jsを使用した物理シミュレーション。重力や衝突判定を含む複雑な物理演算を実装。',
        url: 'https://example.com/babylonjs-demo1',
        category: {
          id: 'babylonjs',
          name: 'Babylon.js',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          publishedAt: '2024-01-01T00:00:00.000Z',
          revisedAt: '2024-01-01T00:00:00.000Z'
        },
        thumbnail: {
          url: '/vercel.svg',
          width: 400,
          height: 300,
        },
        publishedAt: '2024-01-10T10:00:00.000Z',
        updatedAt: '2024-01-10T10:00:00.000Z',
      },
    ];
  }

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
        <WorksGrid initialWorks={works} />
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