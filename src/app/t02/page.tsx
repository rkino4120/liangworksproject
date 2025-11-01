'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Plane, Circle, Text, OrbitControls } from '@react-three/drei';
// 修正: @react-three/xr をCDNからインポートしてビルドエラーを解決
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

// ===== 定数 =====
const CONSTANTS = {
    GALLERY_RADIUS: 0.75,
    PANEL_WIDTH: 0.5,
    GROUND_SIZE: 10,
    PHOTOS_PER_PAGE: 6,
    PHOTO_Y_POSITION: 1.3,
    ANIMATION_DURATION: 2.0, // 秒（地面下に沈む + 上昇する）
    FADE_OUT_DURATION: 1.0, // フェードアウト時間（地面下に沈む）
    FADE_IN_DURATION: 1.0, // フェードイン時間（地面下から上昇）
    ANIMATION_Y_OFFSET: 0.5,
} as const;

const COLORS = {
    GROUND: '#333350',
    CLEAR: '#0c0c19',
} as const;

// three.js のローダーキャッシュを有効化して、ページ切り替え時の再ロードを抑制
THREE.Cache.enabled = true;

// ===== サンプルデータ =====
const DEFAULT_GALLERY_DATA: GalleryDataItem[] = Array.from({ length: 16 }, (_, i) => ({
    imageUrl: `/images/photo${String(i + 1).padStart(2, '0')}.jpg`,
    title: `作品 ${String(i + 1).padStart(2, '0')}`,
}));

// ===== カスタムフック：ギャラリーデータ管理 =====
const useGalleryData = () => {
    const [galleryData, setGalleryData] = useState<GalleryDataItem[]>([]);

    useEffect(() => {
        const fetchGalleryData = async () => {
            try {
                // public/photovr.json を指すようにパスを修正
                const response = await fetch('/photovr.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: GalleryDataItem[] = await response.json();
                setGalleryData(data.length > 0 ? data : DEFAULT_GALLERY_DATA);
            } catch (error) {
                console.error('Failed to load gallery data, using default:', error);
                // デフォルトデータのパスも修正
                const defaultData = Array.from({ length: 16 }, (_, i) => ({
                    imageUrl: `https://placehold.co/400x300/EEE/31343C?text=Photo+${i + 1}`,
                    title: `作品 ${String(i + 1).padStart(2, '0')}`,
                }));
                setGalleryData(defaultData);
            }
        };
        fetchGalleryData();
    }, []);

    return galleryData;
};

// ===== カスタムフック：オーディオ管理 =====
const useAudioManager = () => {
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const playerRef = useRef<Tone.Player | null>(null);

    useEffect(() => {
        // public/mp3/photobgm.mp3 を指すようにパスを修正
        playerRef.current = new Tone.Player("/mp3/photobgm.mp3").toDestination();
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
        if (playerRef.current && playerRef.current.state === 'started') {
            playerRef.current.stop();
            setIsAudioPlaying(false);
        }
    }, []);

    return { isAudioPlaying, toggleAudio, stopAudio };
};

// ===== 個別写真プレーンコンポーネント =====
interface PhotoPlaneProps {
    info: PhotoInfo;
    animationProgress: number;
    onLoaded?: () => void;
}

const PhotoPlane: React.FC<PhotoPlaneProps> = React.memo(({ info, animationProgress, onLoaded }) => {
    const groupRef = useRef<THREE.Group>(null);
    const photoMeshRef = useRef<THREE.Mesh>(null);
    const plateMeshRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(TextureLoader, info.imageUrl);
    const [dimensions, setDimensions] = useState({ width: info.width, height: info.height });
    const prevImageUrlRef = useRef<string>('');
    const hasNotifiedRef = useRef(false);

    // テクスチャ設定とサイズ計算を一度だけ実行
    useMemo(() => {
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 16;
    }, [texture]);

    useEffect(() => {
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const width = CONSTANTS.PANEL_WIDTH;
            const height = width / aspectRatio;
            setDimensions({ width, height });
            
            // 画像URLが変わったら読み込み完了を通知
            if (prevImageUrlRef.current !== info.imageUrl) {
                prevImageUrlRef.current = info.imageUrl;
                hasNotifiedRef.current = false;
            }
            
            // まだ通知していない場合のみ通知
            if (!hasNotifiedRef.current) {
                hasNotifiedRef.current = true;
                onLoaded?.();
            }
        }
    }, [texture, texture.image, onLoaded, info.imageUrl]);

    // useFrameでアニメーションを適用 - 地面下から上昇する仕様
    useFrame(() => {
        if (!groupRef.current) return;
        
        const progress = Math.min(1, Math.max(0, animationProgress));
        
        // 0.0-0.5: 地面下に沈む（フェードアウト）
        // 0.5-1.0: 地面下から上昇（フェードイン）
        let yOffset: number;
        let opacity: number;

        // ハードコードされた「3」は、写真のY位置(約1.3)と合わせて地面(Y=0)より下に沈めるための意図的な値
        const animationDistance = 3.0; 
        
        if (progress < 0.5) {
            // 沈むフェーズ
            const fadeOutProgress = progress * 2; // 0 to 1
            const eased = Math.pow(fadeOutProgress, 2); // ease-in
            yOffset = -animationDistance * eased; // 0 から -animationDistance まで
            opacity = 1 - eased;
        } else {
            // 上昇フェーズ
            const fadeInProgress = (progress - 0.5) * 2; // 0 to 1
            const eased = 1 - Math.pow(1 - fadeInProgress, 3); // ease-out cubic
            yOffset = -animationDistance * (1 - eased); // -animationDistance から 0 まで
            opacity = eased;
        }
        
        groupRef.current.position.y = info.position[1] + yOffset;
        
        if (photoMeshRef.current?.material) {
            const mat = photoMeshRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = opacity;
            mat.transparent = opacity < 1;
        }
        if (plateMeshRef.current?.material) {
            const mat = plateMeshRef.current.material as THREE.MeshStandardMaterial;
            mat.opacity = opacity * 0.7;
            mat.transparent = opacity < 1;
        }
    });

    const plateHeight = 0.1;
    const plateY = useMemo(() => -dimensions.height / 2 - 0.05 - plateHeight / 2, [dimensions.height]);

    return (
        <group ref={groupRef} position={info.position} rotation={info.rotation}>
            {/* 写真プレーン */}
            <Plane ref={photoMeshRef} args={[dimensions.width, dimensions.height]} castShadow>
                <meshBasicMaterial map={texture} side={DoubleSide} toneMapped={false} />
            </Plane>
            
            {/* タイトルプレート背景 */}
            <mesh ref={plateMeshRef} position={[0, plateY, -0.01]} castShadow>
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
    animationProgress: number;
    onPhotoLoaded?: () => void;
}

const Gallery: React.FC<GalleryProps> = React.memo(({ photos, rotationY, animationProgress, onPhotoLoaded }) => {
    return (
        <group rotation={[0, rotationY, 0]}>
            {photos.map((photo) => (
                <PhotoPlane 
                    key={photo.imageUrl} 
                    info={photo} 
                    animationProgress={animationProgress}
                    onLoaded={onPhotoLoaded}
                />
            ))}
        </group>
    );
});

Gallery.displayName = 'Gallery';

// ===== 床コンポーネント =====
const Floor: React.FC = React.memo(() => {
    // テクスチャパスを修正
    const [texture, bumpMap] = useLoader(TextureLoader, [
        '/texture/concrete_diff.jpg',
        '/texture/concrete_rough.png'
    ]);

    useMemo(() => {
        [texture, bumpMap].forEach(tex => {
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
    
    const prevButtonStates = useRef({ leftTrigger: false, rightTrigger: false });

    useFrame(() => {
        // デバッグログは削除

        // 右コントローラーのサムスティックで回転
        const thumbstick = rightController?.gamepad?.['xr-standard-thumbstick'];
        if (thumbstick && typeof thumbstick === 'object' && 'xAxis' in thumbstick) {
            const xAxis = (thumbstick as XRGamepadAxis).xAxis || 0;
            if (Math.abs(xAxis) > 0.1) {
                onRotate(-xAxis * 0.05);
            }
        }
        
        // 左トリガーでオーディオトグル
        const leftTrigger = leftController?.gamepad?.['xr-standard-trigger'];
        const leftTriggerPressed = leftTrigger && typeof leftTrigger === 'object' && 'state' in leftTrigger ? 
            (leftTrigger as XRGamepadButton).state === 'pressed' : false;
        
        if (leftTriggerPressed && !prevButtonStates.current.leftTrigger) {
            onToggleAudio();
        }
        prevButtonStates.current.leftTrigger = leftTriggerPressed;
        
        // 右トリガーでページ送り - 複数のボタンを試す
        const rightTrigger = rightController?.gamepad?.['xr-standard-trigger'];
        const rightSqueeze = rightController?.gamepad?.['xr-standard-squeeze'];
        
        const rightTriggerPressed = rightTrigger && typeof rightTrigger === 'object' && 'state' in rightTrigger ? 
            (rightTrigger as XRGamepadButton).state === 'pressed' : false;
        const rightSqueezePressed = rightSqueeze && typeof rightSqueeze === 'object' && 'state' in rightSqueeze ? 
            (rightSqueeze as XRGamepadButton).state === 'pressed' : false;
        
        if ((rightTriggerPressed || rightSqueezePressed) && !prevButtonStates.current.rightTrigger) {
            onNextPage();
        }
        prevButtonStates.current.rightTrigger = rightTriggerPressed || rightSqueezePressed;
    });

    return null;
};

XRControls.displayName = 'XRControls';

// （デバッグ用のVRフィードバックは削除）

// ===== UIオーバーレイ =====
interface UIOverlayProps {
    isAudioPlaying: boolean;
    onToggleAudio: () => void;
    currentPage: number;
    totalPages: number;
}

const UIOverlay: React.FC<UIOverlayProps> = React.memo(({ isAudioPlaying, onToggleAudio, currentPage, totalPages }) => {
    return (
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
    );
});

UIOverlay.displayName = 'UIOverlay';

// ===== VR Enter Button =====
interface VRButtonProps {
    store: ReturnType<typeof createXRStore>;
    allImagesLoaded: boolean;
    loadedImagesCount: number;
    totalImages: number;
}

const VREnterButton: React.FC<VRButtonProps> = React.memo(({ store, allImagesLoaded, loadedImagesCount, totalImages }) => {
    const handleEnterVR = useCallback(() => {
        if (allImagesLoaded) {
            store.enterVR();
        }
    }, [allImagesLoaded, store]);

    // VR未対応ブラウザ向けの表示
    if (!store) {
        return (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="px-12 py-6 rounded-2xl font-bold text-2xl shadow-2xl bg-red-800 text-white">
                    🥽 VR Not Supported
                </div>
            </div>
        );
    }

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
                {allImagesLoaded ? (
                    <>🥽 Enter VR Mode</>
                ) : (
                    <>⏳ Loading Images... ({loadedImagesCount}/{totalImages})</>
                )}
            </button>
        </div>
    );
});

VREnterButton.displayName = 'VREnterButton';

// ===== メインシーンコンポーネント =====
const CirclePlanesScene: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [displayPage, setDisplayPage] = useState(0); // 実際に表示するページ
    const [galleryRotationY, setGalleryRotationY] = useState(0);
    const [animationProgress, setAnimationProgress] = useState(1); // 初回は1（表示状態）
    const [isAnimating, setIsAnimating] = useState(false);
    const isAnimatingRef = useRef(false); // 最新のisAnimating状態を追跡するref
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [allImagesLoaded, setAllImagesLoaded] = useState(false);
    // デバッグ用のメッセージ表示とキュー機能は削除
    
    const galleryData = useGalleryData();
    const { isAudioPlaying, toggleAudio, stopAudio } = useAudioManager();
    
    const [xrSupported, setXrSupported] = useState(false);
    const [store, setStore] = useState<ReturnType<typeof createXRStore> | null>(null);
    const [isInVR, setIsInVR] = useState(false);
    // XR用アニメ進行管理（WebXRのrAFに追従するためuseFrameを使用）
    const animElapsedRef = useRef(0);
    const hasSwappedRef = useRef(false);
    const currentPageRef = useRef(currentPage);
    const totalPagesRef = useRef(0);

    // 次ページのテクスチャを先読みしてサスペンドを回避/短縮
    const preloadPageTextures = useCallback((pageIndex: number) => {
        if (!galleryData || galleryData.length === 0) return;
        const start = pageIndex * CONSTANTS.PHOTOS_PER_PAGE;
        const items = galleryData.slice(start, start + CONSTANTS.PHOTOS_PER_PAGE);
        const loader = new THREE.TextureLoader();
        items.forEach((item) => {
            // キャッシュが有効なら2回目以降は即時完了
            try {
                loader.load(item.imageUrl, () => {}, undefined, () => {});
            } catch {
                // 失敗してもUIを止めない
            }
        });
    }, [galleryData]);

    // XR初期化
    useEffect(() => {
        if (typeof window === 'undefined' || !('navigator' in window) || !('xr' in navigator)) return;
        
        let unsubscribe: (() => void) | undefined;
        
        navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
                const xrStore = createXRStore();
                setStore(xrStore);
                setXrSupported(true);
                
                // XRセッション状態の監視
                unsubscribe = xrStore.subscribe((state) => {
                    const inVR = !!state.session;
                    setIsInVR(inVR);
                    if (!inVR) {
                        stopAudio();
                    }
                });
            }
        });        return () => {
            unsubscribe?.();
        };
    }, [stopAudio]);

    const totalPages = useMemo(() => 
        Math.ceil(galleryData.length / CONSTANTS.PHOTOS_PER_PAGE), 
        [galleryData.length]
    );

    const currentPhotos = useMemo(() => {
        const start = displayPage * CONSTANTS.PHOTOS_PER_PAGE;
        return galleryData.slice(start, start + CONSTANTS.PHOTOS_PER_PAGE);
    }, [galleryData, displayPage]);

    // 写真情報の生成
    const photoInfos = useMemo((): PhotoInfo[] => {
        return currentPhotos.map((item, index) => {
            const angle = (index / currentPhotos.length) * 2 * Math.PI;
            const x = CONSTANTS.GALLERY_RADIUS * Math.cos(angle);
            const z = CONSTANTS.GALLERY_RADIUS * Math.sin(angle);
            
            // 仮のアスペクト比
            const aspectRatio = 4 / 3;
            const width = CONSTANTS.PANEL_WIDTH;
            const height = width / aspectRatio;
            
            return {
                imageUrl: item.imageUrl,
                title: item.title,
                position: [x, height / 2 + CONSTANTS.PHOTO_Y_POSITION, z],
                rotation: [0, -angle - Math.PI / 2, 0],
                width,
                height,
            };
        });
    }, [currentPhotos]);

    // 画像読み込み完了の監視
    const handlePhotoLoaded = useCallback(() => {
        setLoadedImagesCount(prev => prev + 1);
    }, []);

    // すべての画像が読み込まれたかチェック
    useEffect(() => {
        // totalPagesが計算できてから（galleryDataが読み込まれてから）
        if (totalPages > 0 && currentPhotos.length > 0 && loadedImagesCount >= currentPhotos.length) {
            setAllImagesLoaded(true);
        }
    }, [loadedImagesCount, currentPhotos.length, totalPages]);

    // 初期表示とページ確定時に、現在ページと次ページを先読み
    useEffect(() => {
        if (totalPages > 0) {
            preloadPageTextures(displayPage);
            preloadPageTextures((displayPage + 1) % totalPages);
        }
    }, [displayPage, totalPages, preloadPageTextures]);

    // 最新ページ情報をrefに同期（useFrameで利用）
    useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);
    useEffect(() => { totalPagesRef.current = totalPages; }, [totalPages]);
    // isAnimating の変更を ref に同期（常に最新の値を参照できるように）
    useEffect(() => {
        isAnimatingRef.current = isAnimating;
    }, [isAnimating]);

    // アニメーション進行管理 - requestAnimationFrameを使用
    useEffect(() => {
        if (!isAnimating) {
            return;
        }
        
        const startTime = Date.now();
        const duration = CONSTANTS.ANIMATION_DURATION * 1000;
        let animationFrameId: number;
        let hasSwappedPage = false;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            setAnimationProgress(progress);
            
            // progress が 0.5 に達したら、表示するページを切り替える（一度だけ）
            if (progress >= 0.5 && !hasSwappedPage) {
                hasSwappedPage = true;
                setDisplayPage(currentPage);
            }
            
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setAnimationProgress(1);
                setIsAnimating(false);
            }
        };
        
        animationFrameId = requestAnimationFrame(animate);
        
        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isAnimating, currentPage, displayPage, totalPages]);

    // Canvas内でのみ動作するuseFrameを使うため、Canvasの子コンポーネントで駆動
    const XRAnimationDriver: React.FC = () => {
        useFrame((_state, delta) => {
            if (!store?.getState().session) return; // 非XRでは従来のeffectに任せる
            if (!isAnimatingRef.current) return;

            animElapsedRef.current += delta;
            const progress = Math.min(1, animElapsedRef.current / CONSTANTS.ANIMATION_DURATION);
            setAnimationProgress(progress);

            if (progress >= 0.5 && !hasSwappedRef.current) {
                hasSwappedRef.current = true;
                setDisplayPage(currentPageRef.current);
            }

            if (progress >= 1) {
                setAnimationProgress(1);
                setIsAnimating(false);
                isAnimatingRef.current = false;
                animElapsedRef.current = 0;
                hasSwappedRef.current = false;

                // アニメーション中の追加入力は無効化するため、キュー処理は行わない
            }
        });
        return null;
    };

    const handleGalleryRotate = useCallback((amount: number) => {
        setGalleryRotationY(prev => prev + amount);
    }, []);

    const handleNextPage = useCallback(() => {
        console.log('=== handleNextPage called ===');
        console.log('isAnimating (from ref):', isAnimatingRef.current);
        console.log('currentPage (from closure):', currentPage);
        
        // totalPages が 0 または 1 の場合は何もしない
        if (totalPages <= 1) {
            console.log('Not enough pages to turn.');
            return;
        }
        
        // アニメーション中は入力無効（キューしない）
        if (isAnimatingRef.current) return;
        
    // 直ちに1ページ進める前に、次ページのテクスチャを先読み
    const nextPage = (currentPage + 1) % totalPages;
    preloadPageTextures(nextPage);
    // デバッグ用の表示は削除
        
    console.log('Setting currentPage to:', nextPage);
    setCurrentPage(nextPage);
    setAnimationProgress(0);
    // XR用の進行管理を初期化
    animElapsedRef.current = 0;
    hasSwappedRef.current = false;
    setIsAnimating(true);
    isAnimatingRef.current = true;
    
    // isAnimatingRefを使うことで、依存配列にisAnimatingを含める必要がなくなる
    }, [currentPage, totalPages, preloadPageTextures]);    return (
        <div className="relative w-full h-screen bg-gray-900">
            {isInVR && (
                <UIOverlay 
                    isAudioPlaying={isAudioPlaying}
                    onToggleAudio={toggleAudio}
                    currentPage={currentPage}
                    totalPages={totalPages}
                />
            )}            {/* VR Enter Button */}
            {store && (
                <VREnterButton 
                    store={store}
                    allImagesLoaded={allImagesLoaded}
                    loadedImagesCount={loadedImagesCount}
                    totalImages={currentPhotos.length}
                />
            )}
            <Canvas shadows camera={{ position: [0, 1.6, 0], near: 0.1, far: 100 }}>
                {/* XR時のアニメ進行ドライバ（Canvas内で実行） */}
                <XRAnimationDriver />
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
                
                {/* FloorとVRFeedbackはサスペンドの影響外にして、画面全体の消失を防ぐ */}
                <Floor />
                <Suspense fallback={null}>
                    <Gallery 
                        photos={photoInfos} 
                        rotationY={galleryRotationY}
                        animationProgress={animationProgress}
                        onPhotoLoaded={handlePhotoLoaded}
                    />
                </Suspense>
                {/* デバッグ用オーバーレイは削除 */}
                
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
        ogImage: '/images/threejs-gallery-preview.jpg'
    });

    return <CirclePlanesScene />;
});

export default App;

