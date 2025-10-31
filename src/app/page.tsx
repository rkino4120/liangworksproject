'use client';

import { useWorks } from '@/hooks/useWorks';
import WorksGrid from '@/components/WorksGrid';
import { LoadingSpinner, ErrorMessage } from '@/components/LoadingStates';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePageMeta } from '@/hooks/usePageMeta';
import FAQ from '@/components/FAQ';

export default function Home() {
  const { works, loading, error } = useWorks();

  usePageMeta({
    title: 'VR Galleries - WebGL/WebGPU作品集',
    description: 'Three.jsを使用したWebGL/WebGPU作品を展示するVRアートギャラリー。インタラクティブな3D体験をお楽しみください。',
    keywords: 'WebGL, WebGPU, Three.js, VR, 3D, インタラクティブ, アート, ギャラリー',
    ogType: 'website',
    ogImage: '/images/og-image.jpg'
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <nav className="flex justify-center mb-8">
            <div className="flex items-center space-x-6">
              <span className="text-slate-700 font-semibold text-sm border-b-2 border-slate-300 pb-1">
                Home
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
              作品の新たな展示方法のご提案です。
            </p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              VRギャラリーのメリット
            </h2>
            <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
          </div>
          <p className="text-slate-700 mb-8 leading-relaxed text-center">
            デジタル作品をVRギャラリーで鑑賞するのをおすすめする理由は大きく3つあります。
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <img 
                  src="/images/icon1.png" 
                  alt="低コストアイコン"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">低コスト</h3>
              <p className="text-slate-700 leading-relaxed text-left">
                写真を高解像度で印刷すると1枚あたり数千円になり、誰でも気軽に作品を発表できるわけではありません。デジタルのままであれば何点展示してもコストは変わりません。
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-14 h-14 mb-4 flex items-center justify-center">
                <img 
                  src="/images/icon2.png" 
                  alt="省スペースアイコン"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">省スペース</h3>
              <p className="text-slate-700 leading-relaxed text-left">
                鑑賞者は1メートル四方のスペースがあれば体験でき、主催者側も物理的な会場が不要です。世界中どこからでも同時にアクセスできるため、地理的な制約もありません。
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 mb-4 flex items-center justify-center">
                <img 
                  src="/images/icon3.png" 
                  alt="簡単設営アイコン"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">簡単設営</h3>
              <p className="text-slate-700 leading-relaxed text-left">
                ブラウザからアクセスするだけのため、複雑な配線や撤収の手間がありません。急きょ作品の入れ替えや文字の修正があった場合もインターネットに接続できる端末から即反映が可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              VRゴーグルについて
            </h2>
            <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-4 text-slate-700 leading-relaxed">
                <p>
                  <strong className="text-slate-800">Meta Quest 3/3S</strong>での動作確認済みです。Meta Questシリーズは、他のVRゴーグルと比べると高機能ながら安価で手に入れやすいのが特徴です。
                </p>
                <p>
                  実際に比べないと分からないくらい程度ですが、3Sより3の方が視野角が広く、高解像度で映像を表示できます。
                </p>
                <p>
                  メガネをかけたままでもVRゴーグルを使用できますが、鮮明に見える範囲が限られます。
                </p>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 shadow-md">
                <img 
                  src="/images/vrphoto.jpg" 
                  alt="Meta Quest VRゴーグル"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              主催者より
            </h2>
            <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
          </div>
          
          <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start">
            <div className="mx-auto md:mx-0">
              <div className="relative w-48 h-48 rounded-full overflow-hidden bg-slate-200 shadow-md">
                <img 
                  src="/images/profile.jpg" 
                  alt="主催者プロフィール写真"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400"><svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>';
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                <strong className="text-slate-800">Liang（りゃん）</strong>という名前で活動しています。最近、大阪から福岡に移住しました。
              </p>
              <p>
                普段はWebデザインやWebディレクションの仕事をしながら、趣味でプログラミングや一眼カメラを楽しんでいます。
              </p>
              <p>
                写真撮影をしていると「いつか個展を開きたい」と憧れるのですが、現実的にはハードルが高いと感じていました。
              </p>
              <p>
                そこで、「誰もが気軽に個展を開催できる方法が欲しい」と考え、VRギャラリーの活動を始めました。
              </p>
              <p className="font-semibold text-slate-800">
                ぜひ一度体験してみてください！
              </p>
            </div>
          </div>
        </div>
      </section>

      <FAQ />

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
