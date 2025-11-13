'use client';

import { useWorks } from '@/hooks/useWorks';
import { useNews } from '@/hooks/useNews';
import WorksGrid from '@/components/WorksGrid';
import NewsList from '@/components/NewsList';
import { LoadingSpinner, ErrorMessage } from '@/components/LoadingStates';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import { usePageMeta } from '@/hooks/usePageMeta';
import FAQ from '@/components/FAQ';
import { Mail } from 'lucide-react';

export default function Home() {
  const { works, loading, error } = useWorks();
  const { news, loading: newsLoading, error: newsError } = useNews();

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
        {/* 背景動画 */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src="/movie/vrgalleries.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/40"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <nav className="flex justify-center mb-8">
            <div className="flex items-center space-x-6">
              <span className="text-slate-700 font-semibold text-sm border-b-2 border-slate-300 pb-1">
                Home
              </span>
              <Button variant="ghost" asChild>
                <Link href="https://forms.gle/admYN7ZzWAkLwjKh8" target="_blank" rel="noopener noreferrer">Contact</Link>
              </Button>
            </div>
          </nav>
          
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight font-serif text-slate-900 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)] [text-shadow:_0_0_20px_rgb(255_255_255_/_80%),_0_2px_4px_rgb(0_0_0_/_40%)]">
              VR Galleries
            </h1>
            <p className="text-lg text-slate-800 font-semibold max-w-2xl mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] bg-white/60 rounded-lg px-6 py-4">
              VRで空間すべてが、作品の表現の場に
              <br />
              鑑賞者は「見る」から「体験する」へ
            </p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              お知らせ・イベント
            </h2>
            <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
          </div>
          
          {newsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : newsError ? (
            <div className="text-center py-8 text-red-600">
              {newsError}
            </div>
          ) : (
            <NewsList news={news} />
          )}
        </div>
      </section>

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
                <Image 
                  src="/images/icon1.png" 
                  alt="低コストアイコン"
                  width={64}
                  height={64}
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
                <Image 
                  src="/images/icon2.png" 
                  alt="省スペースアイコン"
                  width={56}
                  height={56}
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
                <Image 
                  src="/images/icon3.png" 
                  alt="簡単設営アイコン"
                  width={64}
                  height={64}
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
                <Image 
                  src="/images/vrphoto.jpg" 
                  alt="Meta Quest VRゴーグル"
                  fill
                  className="object-cover"
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
                <Image 
                  src="/images/profile.jpg" 
                  alt="主催者プロフィール写真"
                  fill
                  className="object-cover"
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

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200 p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              メンバー募集
            </h2>
            <div className="w-16 h-0.5 bg-slate-300 mx-auto mt-3"></div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                <Image 
                  src="/images/icon_vrcamera.png" 
                  alt="VRカメラアイコン"
                  width={160}
                  height={160}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-4 text-slate-700 leading-relaxed">
              <p>
                福岡市内在住で、カメラまたはVRに興味があり、1年以上継続して取り組んだ経験のある方を募集しています。プロ・アマは問いません。VRギャラリーでの作品展示や制作活動を一緒に楽しめる仲間を探しています。個人サークルとしての活動のため報酬はありませんが、創作の喜びを共有できる方を歓迎します。
              </p>
              <div className="pt-2 flex justify-end">
                <Button asChild className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 text-base">
                  <Link href="https://forms.gle/admYN7ZzWAkLwjKh8" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    連絡先はこちら
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
