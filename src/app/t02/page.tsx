'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Plane, Circle, Text, OrbitControls } from '@react-three/drei';
import { XR, createXRStore, XROrigin, useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import { DoubleSide, TextureLoader, LinearFilter, RepeatWrapping } from 'three';
import * as Tone from 'tone';
import { usePageMeta } from '@/hooks/usePageMeta';

// ===== 型定義 =====
interface PhotoInfo {
    imageUrl: string;
    title: string;
    position: [number, number, number];
    rotation: [number, number, number];
    width: number;
    height: number;
}

interface GalleryDataItem {
    imageUrl: string;
    title: string;
}

interface XRGamepadAxis {
    xAxis?: number;
    yAxis?: number;
}

interface XRGamepadButton {
    state?: 'pressed' | 'released' | 'touched';
}

/** アニメーションフェーズ: idle→sinking→loading→rising→idle */
type AnimPhase = 'idle' | 'sinking' | 'loading' | 'rising';

// ===== 定数 =====
const GALLERY_RADIUS = 0.75;
const PANEL_WIDTH = 0.5;
const PHOTOS_PER_PAGE = 6;
const PHOTO_Y_POSITION = 1.3;
const SINK_DURATION = 1.5;           // 沈むフェーズの秒数
const RISE_DURATION = 1.5;           // 上昇フェーズの秒数
const STAGGER_RANGE = 0.5;           // フェーズ内でのスタッガー範囲（0-1）
const INDIVIDUAL_ANIM_LENGTH = 0.5;  // 各写真の個別アニメ長（フェーズ比）
const ANIMATION_DISTANCE = 3.0;      // 沈む距離（床y=0より十分下）

const COLORS = {
    CLEAR: '#0c0c19',
} as const;

// three.js ローダーキャッシュ有効化
THREE.Cache.enabled = true;

// ===== デフォルトデータ =====
const DEFAULT_GALLERY_DATA: GalleryDataItem[] = Array.from({ length: 16 }, (_, i) => ({
    imageUrl: `/images/photo${String(i + 1).padStart(2, '0')}.jpg`,
    title: `作品 ${String(i + 1).padStart(2, '0')}`,
}));

// ===== ユーティリティ =====
function easeInQuad(t: number): number {
    return t * t;
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

/** indexの写真のフェーズ内個別アニメーション進捗（0-1）を返す */
function calcStaggeredProgress(phaseProgress: number, index: number, total: number): number {
    const staggerStep = total > 1 ? STAGGER_RANGE / (total - 1) : 0;
    const startTime = index * staggerStep;
    return Math.max(0, Math.min(1, (phaseProgress - startTime) / INDIVIDUAL_ANIM_LENGTH));
}

// ===== カスタムフック：ギャラリーデータ管理 =====
const useGalleryData = () => {
    const [galleryData, setGalleryData] = useState<GalleryDataItem[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/photovr.json');
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: GalleryDataItem[] = await res.json();
                setGalleryData(data.length > 0 ? data : DEFAULT_GALLERY_DATA);
            } catch {
                setGalleryData(DEFAULT_GALLERY_DATA);
            }
        })();
    }, []);

    return galleryData;
};

// ===== カスタムフック：オーディオ管理 =====
const useAudioManager = () => {
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const playerRef = useRef<Tone.Player | null>(null);

    useEffect(() => {
        playerRef.current = new Tone.Player('/mp3/photobgm.mp3').toDestination();
        playerRef.current.loop = true;
        return () => {
            if (Tone.getTransport().state !== 'stopped') {
                Tone.getTransport().stop();
                Tone.getTransport().cancel();
            }
            playerRef.current?.dispose();
        };
    }, []);

    const toggleAudio = useCallback(async () => {
        if (Tone.getContext().state !== 'running') await Tone.start();
        if (playerRef.current) {
            if (playerRef.current.state === 'started') {
                playerRef.current.stop();
                setIsAudioPlaying(false);
            } else {
                playerRef.current.start();
                setIsAudioPlaying(true);
            }
        }
    }, []);

    const stopAudio = useCallback(() => {
        if (playerRef.current?.state === 'started') {
            playerRef.current.stop();
            setIsAudioPlaying(false);
        }
    }, []);

    return { isAudioPlaying, toggleAudio, stopAudio };
};

// ===== 個別写真プレーンコンポーネント =====
interface PhotoPlaneProps {
    info: PhotoInfo;
    index: number;
    totalPhotos: number;
    animPhaseRef: { current: AnimPhase };
    phaseProgressRef: { current: number };
    onLoaded?: () => void;
}

const PhotoPlane: React.FC<PhotoPlaneProps> = React.memo(({
    info, index, totalPhotos, animPhaseRef, phaseProgressRef, onLoaded,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const texture = useLoader(TextureLoader, info.imageUrl);
    const [dimensions, setDimensions] = useState({ width: info.width, height: info.height });
    const prevImageUrlRef = useRef('');

    // テクスチャ設定（レンダー中に同期的に実行、パフォーマンス最適化）
    useMemo(() => {
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = false;
        texture.colorSpace = THREE.SRGBColorSpace;
    }, [texture]);

    // アスペクト比計算＆読み込み完了通知
    useEffect(() => {
        if (!texture.image) return;
        const aspectRatio = texture.image.width / texture.image.height;
        setDimensions({ width: PANEL_WIDTH, height: PANEL_WIDTH / aspectRatio });
        if (prevImageUrlRef.current !== info.imageUrl) {
            prevImageUrlRef.current = info.imageUrl;
            onLoaded?.();
        }
    }, [texture, info.imageUrl, onLoaded]);

    // useFrameでY位置アニメーション（refのみ操作、re-renderなし）
    // 床(y=0)が自然にオクルージョンするため、opacity操作は不要
    useFrame(() => {
        if (!groupRef.current) return;
        const phase = animPhaseRef.current;
        const progress = phaseProgressRef.current;
        let yOffset = 0;

        if (phase === 'sinking') {
            const local = calcStaggeredProgress(progress, index, totalPhotos);
            yOffset = -ANIMATION_DISTANCE * easeInQuad(local);
        } else if (phase === 'loading') {
            yOffset = -ANIMATION_DISTANCE;
        } else if (phase === 'rising') {
            const local = calcStaggeredProgress(progress, index, totalPhotos);
            yOffset = -ANIMATION_DISTANCE * (1 - easeOutCubic(local));
        }

        groupRef.current.position.y = info.position[1] + yOffset;
    });

    const plateHeight = 0.1;
    const plateY = useMemo(() => -dimensions.height / 2 - 0.05 - plateHeight / 2, [dimensions.height]);

    return (
        <group ref={groupRef} position={info.position} rotation={info.rotation}>
            {/* 写真プレーン */}
            <Plane args={[dimensions.width, dimensions.height]} castShadow>
                <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
            </Plane>
            {/* タイトルプレート背景 */}
            <mesh position={[0, plateY, -0.01]} castShadow>
                <boxGeometry args={[dimensions.width + 0.05, plateHeight, 0.01]} />
                <meshStandardMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
            {/* タイトルテキスト */}
            <Text
                position={[0, plateY, 0.006]}
                fontSize={0.02}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={dimensions.width}
            >
                {info.title}
            </Text>
        </group>
    );
});

PhotoPlane.displayName = 'PhotoPlane';

// ===== ギャラリーコンポーネント =====
interface GalleryProps {
    photos: PhotoInfo[];
    rotationY: number;
    animPhaseRef: { current: AnimPhase };
    phaseProgressRef: { current: number };
    onPhotoLoaded?: () => void;
}

const Gallery: React.FC<GalleryProps> = React.memo(({
    photos, rotationY, animPhaseRef, phaseProgressRef, onPhotoLoaded,
}) => (
    <group rotation={[0, rotationY, 0]}>
        {photos.map((photo, idx) => (
            <PhotoPlane
                key={photo.imageUrl}
                info={photo}
                index={idx}
                totalPhotos={photos.length}
                animPhaseRef={animPhaseRef}
                phaseProgressRef={phaseProgressRef}
                onLoaded={onPhotoLoaded}
            />
        ))}
    </group>
));

Gallery.displayName = 'Gallery';

// ===== 床コンポーネント =====
const Floor: React.FC = React.memo(() => {
    const [texture, bumpMap] = useLoader(TextureLoader, [
        '/texture/concrete_diff.jpg',
        '/texture/concrete_rough.png',
    ]);

    useMemo(() => {
        [texture, bumpMap].forEach((tex) => {
            tex.repeat.set(12, 12);
            tex.wrapS = tex.wrapT = RepeatWrapping;
        });
    }, [texture, bumpMap]);

    return (
        <Circle args={[8, 128]} rotation-x={-Math.PI / 2} receiveShadow>
            <meshStandardMaterial map={texture} bumpMap={bumpMap} bumpScale={0.05} />
        </Circle>
    );
});

Floor.displayName = 'Floor';

// ===== XRコントローラー管理 =====
interface XRControlsProps {
    onRotate: (amount: number) => void;
    onToggleAudio: () => void;
    onNextPage: () => void;
}

const XRControls: React.FC<XRControlsProps> = ({ onRotate, onToggleAudio, onNextPage }) => {
    const leftController = useXRInputSourceState('controller', 'left');
    const rightController = useXRInputSourceState('controller', 'right');
    const prev = useRef({ leftTrigger: false, aButton: false });

    useFrame(() => {
        // 右スティックで回転
        const ts = rightController?.gamepad?.['xr-standard-thumbstick'];
        if (ts && typeof ts === 'object' && 'xAxis' in ts) {
            const x = (ts as XRGamepadAxis).xAxis || 0;
            if (Math.abs(x) > 0.1) onRotate(-x * 0.05);
        }

        // 左トリガーでオーディオ切替
        const lt = leftController?.gamepad?.['xr-standard-trigger'];
        const ltPressed = lt && typeof lt === 'object' && 'state' in lt
            ? (lt as XRGamepadButton).state === 'pressed' : false;
        if (ltPressed && !prev.current.leftTrigger) onToggleAudio();
        prev.current.leftTrigger = ltPressed;

        // Aボタン（右コントローラー）で写真入れ替え
        const ab = rightController?.gamepad?.['a-button'];
        const abPressed = ab && typeof ab === 'object' && 'state' in ab
            ? (ab as XRGamepadButton).state === 'pressed' : false;
        if (abPressed && !prev.current.aButton) onNextPage();
        prev.current.aButton = abPressed;
    });

    return null;
};

XRControls.displayName = 'XRControls';

// ===== UIオーバーレイ =====
interface UIOverlayProps {
    isAudioPlaying: boolean;
    onToggleAudio: () => void;
    currentPage: number;
    totalPages: number;
}

const UIOverlay: React.FC<UIOverlayProps> = React.memo(({
    isAudioPlaying, onToggleAudio, currentPage, totalPages,
}) => (
    <div className="absolute top-4 left-4 z-10 space-y-2">
        <button
            onClick={onToggleAudio}
            className={`px-4 py-2 rounded-lg font-bold text-white transition-colors ${
                isAudioPlaying ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
            }`}
        >
            {isAudioPlaying ? '🎵 BGM ON' : '🎵 BGM OFF'}
        </button>
        <div className="px-4 py-2 bg-black bg-opacity-50 rounded-lg text-white font-bold">
            Page {currentPage + 1} / {totalPages}
        </div>
    </div>
));

UIOverlay.displayName = 'UIOverlay';

// ===== VR Enter Button =====
interface VRButtonProps {
    store: ReturnType<typeof createXRStore>;
    allImagesLoaded: boolean;
    loadedImagesCount: number;
    totalImages: number;
}

const VREnterButton: React.FC<VRButtonProps> = React.memo(({
    store, allImagesLoaded, loadedImagesCount, totalImages,
}) => {
    const handleEnterVR = useCallback(() => {
        if (allImagesLoaded) store.enterVR();
    }, [allImagesLoaded, store]);

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <button
                onClick={handleEnterVR}
                disabled={!allImagesLoaded}
                className={`pointer-events-auto px-12 py-6 rounded-2xl font-bold text-2xl shadow-2xl transform transition-all duration-300 ${
                    allImagesLoaded
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-110 hover:shadow-green-500/50 cursor-pointer'
                        : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                }`}
            >
                {allImagesLoaded
                    ? <>🥽 Enter VR Mode</>
                    : <>⏳ Loading Images... ({loadedImagesCount}/{totalImages})</>
                }
            </button>
        </div>
    );
});

VREnterButton.displayName = 'VREnterButton';

// ===== アニメーション駆動コンポーネント（Canvas内でuseFrame使用） =====
interface AnimationDriverProps {
    animPhaseRef: { current: AnimPhase };
    phaseProgressRef: { current: number };
    texturesReadyRef: { current: boolean };
    onSinkComplete: () => void;
    onRiseComplete: () => void;
}

const AnimationDriver: React.FC<AnimationDriverProps> = ({
    animPhaseRef, phaseProgressRef, texturesReadyRef, onSinkComplete, onRiseComplete,
}) => {
    const sinkFiredRef = useRef(false);
    const riseFiredRef = useRef(false);

    useFrame((_state, delta) => {
        const phase = animPhaseRef.current;

        if (phase === 'idle') {
            sinkFiredRef.current = false;
            riseFiredRef.current = false;
            return;
        }

        if (phase === 'sinking') {
            phaseProgressRef.current = Math.min(1, phaseProgressRef.current + delta / SINK_DURATION);
            if (phaseProgressRef.current >= 1 && !sinkFiredRef.current) {
                sinkFiredRef.current = true;
                animPhaseRef.current = 'loading';
                phaseProgressRef.current = 0;
                onSinkComplete();
            }
            return;
        }

        if (phase === 'loading') {
            if (texturesReadyRef.current) {
                animPhaseRef.current = 'rising';
                phaseProgressRef.current = 0;
            }
            return;
        }

        if (phase === 'rising') {
            phaseProgressRef.current = Math.min(1, phaseProgressRef.current + delta / RISE_DURATION);
            if (phaseProgressRef.current >= 1 && !riseFiredRef.current) {
                riseFiredRef.current = true;
                animPhaseRef.current = 'idle';
                phaseProgressRef.current = 0;
                onRiseComplete();
            }
        }
    });

    return null;
};

AnimationDriver.displayName = 'AnimationDriver';

// ===== メインシーンコンポーネント =====
const CirclePlanesScene: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [displayPage, setDisplayPage] = useState(0);
    const [galleryRotationY, setGalleryRotationY] = useState(0);
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [allImagesLoaded, setAllImagesLoaded] = useState(false);

    // アニメーション状態（refベース：useFrame内で高速参照、re-renderなし）
    const animPhaseRef = useRef<AnimPhase>('idle');
    const phaseProgressRef = useRef(0);
    const texturesReadyRef = useRef(false);
    const newPageLoadedCountRef = useRef(0);
    const targetPhotoCountRef = useRef(PHOTOS_PER_PAGE);
    const nextPageRef = useRef(0);

    const galleryData = useGalleryData();
    const { isAudioPlaying, toggleAudio, stopAudio } = useAudioManager();

    const [xrSupported, setXrSupported] = useState(false);
    const [store, setStore] = useState<ReturnType<typeof createXRStore> | null>(null);
    const [isInVR, setIsInVR] = useState(false);

    // XR初期化
    useEffect(() => {
        if (typeof window === 'undefined' || !navigator?.xr) return;
        let unsubscribe: (() => void) | undefined;
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (!supported) return;
            const xrStore = createXRStore();
            setStore(xrStore);
            setXrSupported(true);
            unsubscribe = xrStore.subscribe((state) => {
                const inVR = !!state.session;
                setIsInVR(inVR);
                if (!inVR) stopAudio();
            });
        });
        return () => { unsubscribe?.(); };
    }, [stopAudio]);

    const totalPages = useMemo(
        () => Math.ceil(galleryData.length / PHOTOS_PER_PAGE),
        [galleryData.length],
    );
    const totalPagesRef = useRef(totalPages);
    useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);

    const currentPhotos = useMemo(() => {
        const start = displayPage * PHOTOS_PER_PAGE;
        return galleryData.slice(start, start + PHOTOS_PER_PAGE);
    }, [galleryData, displayPage]);

    // 写真情報の生成（円形配置）
    const photoInfos = useMemo((): PhotoInfo[] =>
        currentPhotos.map((item, i) => {
            const angle = (i / currentPhotos.length) * 2 * Math.PI;
            const x = GALLERY_RADIUS * Math.cos(angle);
            const z = GALLERY_RADIUS * Math.sin(angle);
            const aspectRatio = 4 / 3; // 仮の値。テクスチャ読み込み後に実際のアスペクト比で更新
            const w = PANEL_WIDTH;
            const h = w / aspectRatio;
            return {
                imageUrl: item.imageUrl,
                title: item.title,
                position: [x, h / 2 + PHOTO_Y_POSITION, z],
                rotation: [0, -angle - Math.PI / 2, 0],
                width: w,
                height: h,
            };
        }),
    [currentPhotos]);

    // テクスチャ先読み（useLoader内部キャッシュに登録）
    const preloadPageTextures = useCallback((pageIndex: number) => {
        if (galleryData.length === 0) return;
        const start = pageIndex * PHOTOS_PER_PAGE;
        galleryData.slice(start, start + PHOTOS_PER_PAGE).forEach((item) => {
            useLoader.preload(TextureLoader, item.imageUrl);
        });
    }, [galleryData]);

    // 初期ページと次ページの先読み
    useEffect(() => {
        if (totalPages > 0) {
            preloadPageTextures(displayPage);
            if (totalPages > 1) preloadPageTextures((displayPage + 1) % totalPages);
        }
    }, [displayPage, totalPages, preloadPageTextures]);

    // 写真読み込み完了カウント（初回ロード＋ページ遷移兼用）
    const handlePhotoLoaded = useCallback(() => {
        setLoadedImagesCount((prev) => prev + 1);
        newPageLoadedCountRef.current += 1;
        if (newPageLoadedCountRef.current >= targetPhotoCountRef.current) {
            texturesReadyRef.current = true;
        }
    }, []);

    // 初回読み込み完了判定（VR Enterボタン有効化）
    useEffect(() => {
        if (totalPages > 0 && currentPhotos.length > 0 && loadedImagesCount >= currentPhotos.length) {
            setAllImagesLoaded(true);
        }
    }, [loadedImagesCount, currentPhotos.length, totalPages]);

    // 沈み完了コールバック：ページ切り替え＆カウンターリセット
    const onSinkComplete = useCallback(() => {
        newPageLoadedCountRef.current = 0;
        texturesReadyRef.current = false;
        setDisplayPage(nextPageRef.current);
    }, []);

    // 上昇完了コールバック：次の次のページを先読み
    const onRiseComplete = useCallback(() => {
        if (totalPagesRef.current > 1) {
            preloadPageTextures((nextPageRef.current + 1) % totalPagesRef.current);
        }
    }, [preloadPageTextures]);

    // ギャラリー回転ハンドラ
    const handleGalleryRotate = useCallback((amount: number) => {
        setGalleryRotationY((prev) => prev + amount);
    }, []);

    // 次ページハンドラ（Aボタンから呼ばれる）
    const handleNextPage = useCallback(() => {
        if (animPhaseRef.current !== 'idle' || totalPages <= 1) return;

        const nextPage = (currentPage + 1) % totalPages;
        nextPageRef.current = nextPage;

        // 次ページの実際の写真枚数を計算
        const start = nextPage * PHOTOS_PER_PAGE;
        targetPhotoCountRef.current = Math.min(PHOTOS_PER_PAGE, galleryData.length - start);

        setCurrentPage(nextPage);
        preloadPageTextures(nextPage);

        // 沈みアニメーション開始
        animPhaseRef.current = 'sinking';
        phaseProgressRef.current = 0;
    }, [currentPage, totalPages, preloadPageTextures, galleryData.length]);

    return (
        <div className="relative w-full h-screen bg-gray-900">
            {isInVR && (
                <UIOverlay
                    isAudioPlaying={isAudioPlaying}
                    onToggleAudio={toggleAudio}
                    currentPage={currentPage}
                    totalPages={totalPages}
                />
            )}
            {store && (
                <VREnterButton
                    store={store}
                    allImagesLoaded={allImagesLoaded}
                    loadedImagesCount={loadedImagesCount}
                    totalImages={currentPhotos.length}
                />
            )}
            <Canvas shadows camera={{ position: [0, 1.6, 0], near: 0.1, far: 100 }}>
                {/* アニメーション駆動（Canvas内でuseFrame使用、VR/非VR両対応） */}
                <AnimationDriver
                    animPhaseRef={animPhaseRef}
                    phaseProgressRef={phaseProgressRef}
                    texturesReadyRef={texturesReadyRef}
                    onSinkComplete={onSinkComplete}
                    onRiseComplete={onRiseComplete}
                />

                {xrSupported && store && (
                    <XR store={store}>
                        <XROrigin position={[0, 0, 0]} />
                        <XRControls
                            onRotate={handleGalleryRotate}
                            onToggleAudio={toggleAudio}
                            onNextPage={handleNextPage}
                        />
                    </XR>
                )}

                <color attach="background" args={[COLORS.CLEAR]} />
                <fog attach="fog" args={[COLORS.CLEAR, 5, 20]} />

                <ambientLight intensity={0.5} />
                <spotLight
                    position={[0, 5, 0]}
                    angle={Math.PI / 3}
                    penumbra={0.5}
                    intensity={100}
                    castShadow
                    shadow-mapSize-width={512}
                    shadow-mapSize-height={512}
                />

                <Floor />

                <Suspense fallback={null}>
                    <Gallery
                        photos={photoInfos}
                        rotationY={galleryRotationY}
                        animPhaseRef={animPhaseRef}
                        phaseProgressRef={phaseProgressRef}
                        onPhotoLoaded={handlePhotoLoaded}
                    />
                </Suspense>

                <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
        </div>
    );
};

// ===== アプリケーションエントリポイント =====
const App = React.memo(function App() {
    usePageMeta({
        title: '円形回転型（BGM付き）| Three.js | VR Galleries',
        description: 'Three.jsを使ったVRフォトギャラリー。3D空間での写真鑑賞を、音楽と共にインスタレーション体験でお楽しみください。',
        keywords: 'Three.js, VR, フォトギャラリー, 3D, WebGL, インスタレーション, 音楽',
        ogTitle: '円形回転型（BGM付き）| Three.js | VR Galleries',
        ogDescription: 'Three.jsを使ったVRフォトギャラリー。3D空間での写真鑑賞体験。',
        ogType: 'website',
        ogImage: '/images/threejs-gallery-preview.jpg',
    });

    return <CirclePlanesScene />;
});

export default App;
