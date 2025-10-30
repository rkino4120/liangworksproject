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

// ===== 定数 =====
const CONSTANTS = {
    GALLERY_RADIUS: 0.75,
    PANEL_WIDTH: 0.5,
    GROUND_SIZE: 10,
    PHOTOS_PER_PAGE: 6,
    PHOTO_Y_POSITION: 1.3,
    ANIMATION_DURATION: 1.2, // 秒（フェードアウト+フェードイン）
    FADE_OUT_DURATION: 0.5, // フェードアウト時間
    FADE_IN_DURATION: 0.7, // フェードイン時間
    ANIMATION_Y_OFFSET: 0.5,
} as const;

const COLORS = {
    GROUND: '#333350',
    CLEAR: '#0c0c19',
} as const;

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
                const response = await fetch('/photovr.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data: GalleryDataItem[] = await response.json();
                setGalleryData(data.length > 0 ? data : DEFAULT_GALLERY_DATA);
            } catch (error) {
                console.error('Failed to load gallery data, using default:', error);
                setGalleryData(DEFAULT_GALLERY_DATA);
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

    return { isAudioPlaying, toggleAudio };
};

// ===== 個別写真プレーンコンポーネント =====
interface PhotoPlaneProps {
    info: PhotoInfo;
    animationProgress: number;
    onLoaded?: () => void;
}

const PhotoPlane: React.FC<PhotoPlaneProps> = ({ info, animationProgress, onLoaded }) => {
    const groupRef = useRef<THREE.Group>(null);
    const photoMeshRef = useRef<THREE.Mesh>(null);
    const plateMeshRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(TextureLoader, info.imageUrl);
    const [dimensions, setDimensions] = React.useState({ width: info.width, height: info.height });
    const loadedRef = useRef(false);

    useEffect(() => {
        texture.magFilter = LinearFilter;
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 16;
        
        // 画像の実際の縦横比を取得して適用
        if (texture.image) {
            const aspectRatio = texture.image.width / texture.image.height;
            const width = CONSTANTS.PANEL_WIDTH;
            const height = width / aspectRatio;
            setDimensions({ width, height });
            
            // 画像が読み込まれたことを通知（一度だけ）
            if (!loadedRef.current && onLoaded) {
                loadedRef.current = true;
                onLoaded();
            }
        }
    }, [texture, onLoaded]);

    // アニメーションの適用
    useEffect(() => {
        if (groupRef.current) {
            const progress = Math.min(1, Math.max(0, animationProgress));
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            
            groupRef.current.position.y = info.position[1] + CONSTANTS.ANIMATION_Y_OFFSET * (1 - eased);
            
            if (photoMeshRef.current && photoMeshRef.current.material) {
                const mat = photoMeshRef.current.material as THREE.MeshBasicMaterial;
                mat.opacity = eased;
                mat.transparent = true;
            }
            if (plateMeshRef.current && plateMeshRef.current.material) {
                const mat = plateMeshRef.current.material as THREE.MeshStandardMaterial;
                mat.opacity = eased * 0.7;
                mat.transparent = true;
            }
        }
    }, [animationProgress, info.position]);

    const plateHeight = 0.1;
    const plateY = -dimensions.height / 2 - 0.05 - plateHeight / 2;

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
};

// ===== ギャラリーコンポーネント =====
interface GalleryProps {
    photos: PhotoInfo[];
    rotationY: number;
    animationProgress: number;
    onPhotoLoaded?: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ photos, rotationY, animationProgress, onPhotoLoaded }) => {
    return (
        <group rotation={[0, rotationY, 0]}>
            {photos.map((photo, index) => (
                <PhotoPlane 
                    key={`${photo.imageUrl}-${index}`} 
                    info={photo} 
                    animationProgress={animationProgress - index * 0.1}
                    onLoaded={onPhotoLoaded}
                />
            ))}
        </group>
    );
};

// ===== 床コンポーネント =====
const Floor: React.FC = () => {
    const texture = useLoader(TextureLoader, '/texture/concrete_diff.jpg');
    const bumpMap = useLoader(TextureLoader, '/texture/concrete_rough.png');

    useEffect(() => {
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
};

// ===== XRコントローラー管理 =====
interface XRControlsProps {
    onRotate: (amount: number) => void;
    onToggleAudio: () => void;
    onNextPage: () => void;
}

const XRControls: React.FC<XRControlsProps> = ({ onRotate, onToggleAudio, onNextPage }) => {
    const leftController = useXRInputSourceState('controller', 'left');
    const rightController = useXRInputSourceState('controller', 'right');
    
    const prevButtonStates = useRef({ leftTrigger: false, rightA: false });

    useFrame(() => {
        // 左コントローラーのサムスティックで回転
        if (leftController?.gamepad?.['xr-standard-thumbstick']) {
            const thumbstick = leftController.gamepad['xr-standard-thumbstick'];
            if (thumbstick && typeof thumbstick === 'object' && 'xAxis' in thumbstick) {
                const xAxis = (thumbstick as XRGamepadAxis).xAxis || 0;
                if (Math.abs(xAxis) > 0.1) {
                    onRotate(-xAxis * 0.05);
                }
            }
        }
        
        // ボタン入力チェック
        if (leftController?.gamepad?.['xr-standard-trigger']) {
            const trigger = leftController.gamepad['xr-standard-trigger'];
            const pressed = trigger && typeof trigger === 'object' && 'state' in trigger ? 
                (trigger as XRGamepadButton).state === 'pressed' : false;
            
            if (pressed && !prevButtonStates.current.leftTrigger) {
                onToggleAudio();
            }
            prevButtonStates.current.leftTrigger = pressed;
        }
        
        if (rightController?.gamepad?.['a-button']) {
            const aButton = rightController.gamepad['a-button'];
            const pressed = aButton && typeof aButton === 'object' && 'state' in aButton ? 
                (aButton as XRGamepadButton).state === 'pressed' : false;
            
            if (pressed && !prevButtonStates.current.rightA) {
                onNextPage();
            }
            prevButtonStates.current.rightA = pressed;
        }
    });

    return null;
};

// ===== UIオーバーレイ =====
interface UIOverlayProps {
    isAudioPlaying: boolean;
    onToggleAudio: () => void;
    currentPage: number;
    totalPages: number;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ isAudioPlaying, onToggleAudio, currentPage, totalPages }) => {
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
};

// ===== メインシーンコンポーネント =====
const CirclePlanesScene: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(0);
    const [galleryRotationY, setGalleryRotationY] = useState(0);
    const [animationProgress, setAnimationProgress] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [loadedImagesCount, setLoadedImagesCount] = useState(0);
    const [allImagesLoaded, setAllImagesLoaded] = useState(false);
    
    const galleryData = useGalleryData();
    const { isAudioPlaying, toggleAudio } = useAudioManager();
    
    const [xrSupported, setXrSupported] = useState(false);
    const [store, setStore] = useState<ReturnType<typeof createXRStore> | null>(null);

    // XR初期化
    useEffect(() => {
        if (typeof window !== 'undefined' && 'navigator' in window && 'xr' in navigator) {
            navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    const xrStore = createXRStore();
                    setStore(xrStore);
                    setXrSupported(true);
                }
            });
        }
    }, []);

    const totalPages = useMemo(() => 
        Math.ceil(galleryData.length / CONSTANTS.PHOTOS_PER_PAGE), 
        [galleryData.length]
    );

    const currentPhotos = useMemo(() => {
        const start = currentPage * CONSTANTS.PHOTOS_PER_PAGE;
        return galleryData.slice(start, start + CONSTANTS.PHOTOS_PER_PAGE);
    }, [galleryData, currentPage]);

    // 写真情報の生成
    const photoInfos = useMemo((): PhotoInfo[] => {
        return currentPhotos.map((item, index) => {
            const angle = (index / currentPhotos.length) * 2 * Math.PI;
            const x = CONSTANTS.GALLERY_RADIUS * Math.cos(angle);
            const z = CONSTANTS.GALLERY_RADIUS * Math.sin(angle);
            
            // 仮のアスペクト比（実際は画像読み込み時に取得すべき）
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
        if (currentPhotos.length > 0 && loadedImagesCount >= currentPhotos.length) {
            setAllImagesLoaded(true);
        }
    }, [loadedImagesCount, currentPhotos.length]);

    // ページ変更時に読み込みカウントをリセット
    useEffect(() => {
        setLoadedImagesCount(0);
        setAllImagesLoaded(false);
    }, [currentPage]);

    // アニメーション進行管理
    useEffect(() => {
        if (isAnimating) {
            const startTime = Date.now();
            const duration = CONSTANTS.ANIMATION_DURATION * 1000;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(1, elapsed / duration);
                setAnimationProgress(progress);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    setIsAnimating(false);
                }
            };
            
            requestAnimationFrame(animate);
        }
    }, [isAnimating]);

    // ページ変更時にアニメーション開始
    useEffect(() => {
        setAnimationProgress(0);
        setIsAnimating(true);
    }, [currentPage]);

    const handleGalleryRotate = useCallback((amount: number) => {
        setGalleryRotationY(prev => prev + amount);
    }, []);

    const handleNextPage = useCallback(() => {
        setCurrentPage(prev => (prev + 1) % totalPages);
    }, [totalPages]);

    return (
        <div className="relative w-full h-screen bg-gray-900">
            <UIOverlay 
                isAudioPlaying={isAudioPlaying}
                onToggleAudio={toggleAudio}
                currentPage={currentPage}
                totalPages={totalPages}
            />
            
            {/* VR Enter Button - 中央に大きく表示 */}
            {xrSupported && store && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <button 
                        onClick={() => allImagesLoaded && store.enterVR()} 
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
                            <>⏳ Loading Images... ({loadedImagesCount}/{currentPhotos.length})</>
                        )}
                    </button>
                </div>
            )}
            
            <Canvas shadows camera={{ position: [0, 1.6, 0], near: 0.1, far: 100 }}>
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
                
                <Suspense fallback={null}>
                    <Floor />
                    <Gallery 
                        photos={photoInfos} 
                        rotationY={galleryRotationY}
                        animationProgress={animationProgress}
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
        ogImage: '/images/threejs-gallery-preview.jpg'
    });

    return <CirclePlanesScene />;
});

export default App;
