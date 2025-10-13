'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Engine as BabylonEngine, Scene as BabylonScene, useScene } from 'react-babylonjs';
import { usePageMeta } from '@/hooks/usePageMeta';
import {
    Color3,
    Vector3,
    SpotLight,
    Color4,
    ShadowGenerator,
    Mesh,
    Scene,
    Texture,
    ActionManager,
    ExecuteCodeAction,
    Animation,
    CubicEase,
    QuadraticEase,
    EasingFunction,
    TransformNode,
} from '@babylonjs/core';
import * as Tone from 'tone';

// ===== 型定義 =====
interface BoxInfo {
    name: string;
    position: Vector3;
    rotation: Vector3;
    imageUrl: string;
    width: number;
    height: number;
    depth: number;
    title: string;
    texture?: Texture;
}

interface GalleryDataItem {
    imageUrl: string;
    title: string;
}

interface XRSceneManagerProps {
    onGalleryRotate: (rotation: number) => void;
    toggleAudioRef: React.RefObject<(() => void) | null>;
    onNextPage: () => void;
}

interface AnimationManager {
    animate: (target: TransformNode | Mesh, property: string, from: number, to: number, easingFunction: EasingFunction, onComplete?: () => void) => void;
}

// ===== 定数 =====
const CONSTANTS = {
    GALLERY_RADIUS: 0.75,
    PANEL_WIDTH: 0.5,
    GROUND_SIZE: 10,
    SHADOW_MAP_SIZE: 512, // 影のマップサイズ
    PHOTOS_PER_PAGE: 6, // 1ページあたりの写真数を削減
    ANIMATION_DURATION_FRAMES: 45, // アニメーション時間を短縮
    ANIMATION_Y_OFFSET: 0.5, // Y軸オフセット量
    PHOTO_Y_POSITION: 1.3,
} as const;

const POSITIONS = {
    CAMERA: new Vector3(0, 1.6, 0),
    AUDIO_BUTTON: new Vector3(0, 1.5, -1),
    PAGE_NAV: new Vector3(0, 1.2, -1),
} as const;

const COLORS = {
    GROUND: new Color3(0.2, 0.2, 0.3),
    CLEAR: new Color4(0.05, 0.05, 0.1, 1),
} as const;

// ===== イージング設定 =====
const EASING = {
    IN_CUBIC: (() => {
        const ease = new CubicEase();
        ease.setEasingMode(EasingFunction.EASINGMODE_EASEIN);
        return ease;
    })(),
    OUT_CUBIC: (() => {
        const ease = new CubicEase();
        ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        return ease;
    })(),
    OUT_QUAD: (() => {
        const ease = new QuadraticEase();
        ease.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
        return ease;
    })(),
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
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
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
        if (Tone.getContext().state !== 'running') {
            await Tone.start();
        }
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

// ===== カスタムフック：アニメーション管理 =====
const useAnimationManager = (sceneRef: React.RefObject<Scene | null>) => {
    const animationManager = useMemo<AnimationManager>(() => ({
        animate: (target: TransformNode | Mesh, property: string, from: number, to: number, easingFunction: EasingFunction, onComplete?: () => void) => {
            if (!sceneRef.current) return;
            Animation.CreateAndStartAnimation(
                `anim_${property}_${Date.now()}`,
                target,
                property,
                60,
                CONSTANTS.ANIMATION_DURATION_FRAMES,
                from,
                to,
                Animation.ANIMATIONLOOPMODE_CONSTANT,
                easingFunction,
                onComplete
            );
        }
    }), [sceneRef]);

    const runAnimation = useCallback((target: TransformNode | Mesh, property: string, from: number, to: number, easingFunction: EasingFunction, onAnimationEnd?: () => void) => {
        animationManager.animate(target, property, from, to, easingFunction, onAnimationEnd);
    }, [animationManager]);

    return { runAnimation };
};
const XRSceneManager: React.FC<XRSceneManagerProps> = React.memo(({ onGalleryRotate, toggleAudioRef, onNextPage }) => {
    const scene = useScene();
    const onNextPageRef = useRef(onNextPage);

    useEffect(() => {
        onNextPageRef.current = onNextPage;
    }, [onNextPage]);

    const handleThumbstick = useCallback((axes: { x: number; y: number }) => {
        if (Math.abs(axes.x) > 0.1) {
            onGalleryRotate(-axes.x * 0.05);
        }
    }, [onGalleryRotate]);

    const handleTrigger = useCallback((component: unknown) => {
        const comp = component as { changes: { pressed?: { current: boolean; previous: boolean } } };
        if (comp.changes.pressed?.current && !comp.changes.pressed?.previous) {
            toggleAudioRef.current?.();
        }
    }, [toggleAudioRef]);

    const handleAButton = useCallback((component: unknown) => {
        const comp = component as { changes: { pressed?: { current: boolean; previous: boolean } } };
        if (comp.changes.pressed?.current && !comp.changes.pressed?.previous) {
            onNextPageRef.current();
        }
    }, []);

    const setupController = useCallback((controller: unknown, motionController: unknown) => {
        if (!scene) return;
        
        const mc = motionController as { getComponent: (id: string) => unknown };
        const thumbstick = mc.getComponent('xr-standard-thumbstick');
        if (thumbstick) {
            (thumbstick as any).onAxisValueChangedObservable.add(handleThumbstick);
        }

        const ctrl = controller as { grip?: unknown; pointer?: unknown; inputSource: { handedness: string } };
        const parentMesh = ctrl.grip || ctrl.pointer;
        if (!parentMesh) return;

        if (ctrl.inputSource.handedness === 'left') {
            const audioButton = scene.getMeshByName("audio-button-text");
            if (audioButton) {
                audioButton.setParent(parentMesh as any);
                audioButton.position = new Vector3(0, 0.05, 0.1);
                audioButton.rotation = new Vector3(Math.PI / 4, 0, 0);
            }

            const triggerComponent = mc.getComponent('xr-standard-trigger');
            if (triggerComponent) {
                (triggerComponent as any).onButtonStateChangedObservable.add(handleTrigger);
            }
        } else if (ctrl.inputSource.handedness === 'right') {
            const pageNavParent = scene.getTransformNodeByName("page-nav-parent");
            if (pageNavParent) {
                pageNavParent.setParent(parentMesh as any);
                pageNavParent.position = new Vector3(0, 0.07, 0.1);
                pageNavParent.rotation = new Vector3(Math.PI / 4, 0, 0);
            }

            const aButton = mc.getComponent('a-button');
            if (aButton) (aButton as any).onButtonStateChangedObservable.add(handleAButton);
        }
    }, [scene, handleThumbstick, handleTrigger, handleAButton]);

    const setupXR = useCallback(async () => {
        if (!scene) return;

        try {
            const xr = await scene.createDefaultXRExperienceAsync({
                disableTeleportation: true,
                disablePointerSelection: true,
            });

            if (xr.baseExperience) {
                xr.input.onControllerAddedObservable.add((controller) => {
                    controller.onMotionControllerInitObservable.add((motionController) => {
                        setupController(controller, motionController);
                    });
                });

                xr.input.onControllerRemovedObservable.add((controller) => {
                    if (!scene) return;
                    
                    if (controller.inputSource.handedness === 'left') {
                        const audioButton = scene.getMeshByName("audio-button-text");
                        if (audioButton) {
                            audioButton.setParent(null);
                            audioButton.position = POSITIONS.AUDIO_BUTTON;
                            audioButton.rotation = Vector3.Zero();
                        }
                    } else if (controller.inputSource.handedness === 'right') {
                        const pageNavParent = scene.getTransformNodeByName("page-nav-parent");
                        if (pageNavParent) {
                            pageNavParent.setParent(null);
                            pageNavParent.position = POSITIONS.PAGE_NAV;
                            pageNavParent.rotation = Vector3.Zero();
                        }
                    }
                });
            }
        } catch (error) {
            console.warn('WebXR not supported or failed to initialize:', error);
        }
    }, [scene, setupController]);

    useEffect(() => {
        setupXR();
    }, [setupXR]);

    return null;
});

// ===== メインシーンコンポーネント =====
const CirclePlanesScene: React.FC = () => {
    const [boxes, setBoxes] = useState<BoxInfo[]>([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [galleryRotationY, setGalleryRotationY] = useState(0);
    const [sceneReady, setSceneReady] = useState(false);
    const [isPageChanging, setIsPageChanging] = useState(false);
    const shadowGeneratorRef = useRef<ShadowGenerator | null>(null);
    const sceneRef = useRef<Scene | null>(null);
    const toggleAudioRef = useRef<(() => void) | null>(null);

    // カスタムフックの使用
    const galleryData = useGalleryData();
    const { isAudioPlaying, toggleAudio } = useAudioManager();
    const { runAnimation } = useAnimationManager(sceneRef);

    // 計算のメモ化
    const totalPages = useMemo(() => {
        return galleryData.length > 0 ? Math.ceil(galleryData.length / CONSTANTS.PHOTOS_PER_PAGE) : 1;
    }, [galleryData.length]);

    const currentPhotos = useMemo(() => {
        const start = currentPage * CONSTANTS.PHOTOS_PER_PAGE;
        const end = start + CONSTANTS.PHOTOS_PER_PAGE;
        return galleryData.slice(start, end);
    }, [galleryData, currentPage]);

    // BoxInfo作成関数の最適化
    const createBoxInfo = useCallback((item: GalleryDataItem, index: number, total: number): Promise<BoxInfo> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            
            const handleLoad = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const width = CONSTANTS.PANEL_WIDTH;
                const height = width / aspectRatio;
                const angle = (index / total) * 2 * Math.PI;
                const x = CONSTANTS.GALLERY_RADIUS * Math.cos(angle);
                const z = CONSTANTS.GALLERY_RADIUS * Math.sin(angle);
                const position = new Vector3(x, height / 2 + CONSTANTS.PHOTO_Y_POSITION, z);
                const rotation = new Vector3(0, -angle + Math.PI / 2, 0);

                const texture = new Texture(
                    item.imageUrl, 
                    sceneRef.current!, 
                    false, 
                    true, 
                    Texture.BILINEAR_SAMPLINGMODE,
                    () => resolve({
                        name: `box-${index}`,
                        position,
                        rotation,
                        imageUrl: item.imageUrl,
                        width,
                        height,
                        depth: 0.001,
                        title: item.title,
                        texture,
                    }),
                    (msg) => reject(new Error(`Failed to load texture: ${item.imageUrl} - ${msg}`))
                );
            };

            img.onload = handleLoad;
            img.onerror = () => reject(new Error(`Failed to load image: ${item.imageUrl}`));
            img.src = item.imageUrl;
        });
    }, []);

    const loadBoxesData = useCallback(async () => {
        if (!sceneRef.current || currentPhotos.length === 0) {
            if (boxes.length > 0) setBoxes([]);
            return;
        }

        try {
            const boxDataPromises = currentPhotos.map((item, index) => 
                createBoxInfo(item, index, currentPhotos.length)
            );
            const loadedBoxes = await Promise.all(boxDataPromises);
            setBoxes(loadedBoxes);
        } catch (error) {
            console.error("Error preloading images:", error);
            setBoxes([]);
        }
    }, [currentPhotos, createBoxInfo, boxes.length]);
    
    useEffect(() => {
        if (sceneReady && currentPhotos.length > 0 && boxes.length === 0) {
            loadBoxesData();
        }
    }, [sceneReady, currentPhotos, loadBoxesData, boxes.length]);

    useEffect(() => {
        toggleAudioRef.current = toggleAudio;
    }, [toggleAudio]);

    const handleGalleryRotate = useCallback((rotationAmount: number) => {
        setGalleryRotationY((prev) => prev + rotationAmount);
    }, []);

    // ページ変更処理の最適化
    const changePage = useCallback(() => {
        if (isPageChanging || !sceneRef.current) return;
        
        setIsPageChanging(true);
        const scene = sceneRef.current;
        
        if (boxes.length === 0) {
            const newPage = (currentPage + 1) % totalPages;
            setCurrentPage(newPage);
            setIsPageChanging(false);
            return;
        }

        let pendingAnimations = boxes.length;
        const onExitAnimationEnd = () => {
            if (--pendingAnimations === 0) {
                const newPage = (currentPage + 1) % totalPages;
                setBoxes([]);
                setCurrentPage(newPage);
            }
        };

        boxes.forEach(box => {
            const wrapperNode = scene.getTransformNodeByName(`item-wrapper-${box.name}`);
            if (wrapperNode) {
                const photoMesh = scene.getMeshByName(box.name);
                const titleBgMesh = scene.getMeshByName(`title-bg-${box.name}`);
                
                runAnimation(wrapperNode, 'position.y', wrapperNode.position.y, wrapperNode.position.y + CONSTANTS.ANIMATION_Y_OFFSET, EASING.IN_CUBIC, onExitAnimationEnd);
                if (photoMesh) runAnimation(photoMesh, 'visibility', 1, 0, EASING.IN_CUBIC);
                if (titleBgMesh) runAnimation(titleBgMesh, 'visibility', 1, 0, EASING.IN_CUBIC);
            } else {
                onExitAnimationEnd();
            }
        });
    }, [isPageChanging, boxes, currentPage, totalPages, runAnimation]);

    const handleNextPage = useCallback(() => changePage(), [changePage]);

    const setupShadowGenerator = useCallback((light: SpotLight) => {
        const generator = new ShadowGenerator(CONSTANTS.SHADOW_MAP_SIZE, light);
        generator.useBlurExponentialShadowMap = true;
        generator.blurKernel = 32;
        generator.darkness = 0.5;
        shadowGeneratorRef.current = generator;
    }, []);

    const handleAudioButtonClick = useCallback(() => {
        toggleAudioRef.current?.();
    }, []);

    const handleItemCreated = useCallback((node: TransformNode, isLast: boolean) => {
        if (!isPageChanging || !sceneRef.current) return;
            
        const finalPosition = node.position.clone();
        const childMeshes = node.getChildMeshes();
        const photoMesh = childMeshes.find(m => m.name.startsWith('box-'));
        const titleBgMesh = childMeshes.find(m => m.name.startsWith('title-bg-'));
        
        node.position.y += CONSTANTS.ANIMATION_Y_OFFSET;
        if (photoMesh) photoMesh.visibility = 0;
        if (titleBgMesh) titleBgMesh.visibility = 0;

        const onAnimationComplete = isLast ? () => setIsPageChanging(false) : undefined;
        
        // 位置アニメーション
        runAnimation(node, 'position.y', node.position.y, finalPosition.y, EASING.OUT_QUAD, onAnimationComplete);
        
        // フェードインアニメーション
        setTimeout(() => {
            if (photoMesh) runAnimation(photoMesh, 'visibility', 0, 1, EASING.OUT_QUAD);
            if (titleBgMesh) runAnimation(titleBgMesh, 'visibility', 0, 1, EASING.OUT_QUAD);
        }, 200); // 200ms遅延
    }, [isPageChanging, runAnimation]);

    // ギャラリーアイテムコンポーネント
    const createGalleryItem = useCallback((box: BoxInfo, index: number) => {
        const plateHeight = 0.1;
        const verticalOffset = 0.05;
        const plateLocalY = -box.height / 2 - verticalOffset - plateHeight / 2;

        return (
            <React.Fragment key={box.name}>
                <transformNode 
                    name={`item-wrapper-${box.name}`} 
                    position={box.position} 
                    rotation={box.rotation}
                    onCreated={(node) => handleItemCreated(node as TransformNode, index === boxes.length - 1)}>
                    
                    <box name={box.name} width={box.width} height={box.height} depth={box.depth}
                        onCreated={(mesh: Mesh) => shadowGeneratorRef.current?.addShadowCaster(mesh)}>
                        <standardMaterial 
                            name={`${box.name}-mat`} 
                            diffuseTexture={box.texture} 
                            emissiveTexture={box.texture} 
                            specularColor={Color3.Black()} 
                        />
                    </box>
                    
                    <box 
                        name={`title-bg-${box.name}`} 
                        width={box.width + 0.05} 
                        height={plateHeight} 
                        depth={0.01} 
                        position={new Vector3(0, plateLocalY, -0.01)}
                        onCreated={(mesh: Mesh) => shadowGeneratorRef.current?.addShadowCaster(mesh)}>
                        <standardMaterial name={`title-bg-mat-${box.name}`} diffuseColor={Color3.Black()} alpha={0.7} />
                    </box>

                    <plane 
                        name={`title-plane-${box.name}`} 
                        width={box.width + 0.05} 
                        height={plateHeight} 
                        position={new Vector3(0, plateLocalY, -0.011)} 
                        isPickable={false}>
                        <advancedDynamicTexture 
                            name={`title-texture-${box.name}`} 
                            height={128} 
                            width={Math.round(128 * ((box.width + 0.05) / plateHeight))} 
                            createForParentMesh>
                            <textBlock 
                                name={`title-text-${box.name}`} 
                                text={box.title} 
                                color="white" 
                                fontSize={28} 
                                fontWeight="bold" 
                            />
                        </advancedDynamicTexture>
                    </plane>
                </transformNode>
            </React.Fragment>
        );
    }, [handleItemCreated, boxes.length]);

    return (
        <div className="relative w-full h-screen bg-gray-900">
            <BabylonEngine antialias adaptToDeviceRatio canvasId="babylonJS">
                <BabylonScene
                    clearColor={COLORS.CLEAR}
                    onCreated={(scene: Scene) => {
                        sceneRef.current = scene;
                        setSceneReady(true);
                    }}
                >
                    <XRSceneManager 
                        onGalleryRotate={handleGalleryRotate} 
                        toggleAudioRef={toggleAudioRef}
                        onNextPage={handleNextPage}
                    />

                    <universalCamera name="universalCamera" position={POSITIONS.CAMERA} minZ={0.1} />
                    <hemisphericLight name="hemiLight" intensity={0.5} direction={Vector3.Up()} />
                    <spotLight
                        name="spotLight"
                        position={new Vector3(0, 5, 0)}
                        direction={new Vector3(0, -1, 0)}
                        angle={Math.PI / 3}
                        exponent={2}
                        intensity={100}
                        onCreated={setupShadowGenerator}
                    />
                    <ground name="ground" width={CONSTANTS.GROUND_SIZE} height={CONSTANTS.GROUND_SIZE} receiveShadows>
                        <standardMaterial name="ground-mat" diffuseColor={COLORS.GROUND} specularColor={Color3.Black()} />
                    </ground>

                    {/* BGM Button */}
                    <plane
                        name="audio-button-text"
                        width={0.15} height={0.08} position={POSITIONS.AUDIO_BUTTON} onCreated={(mesh: Mesh) => {
                            if (!sceneRef.current) return;
                            mesh.actionManager = new ActionManager(sceneRef.current);
                            mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, handleAudioButtonClick));
                        }}>
                            <advancedDynamicTexture name="audio-button-text-texture" height={128} width={256} createForParentMesh>
                                <rectangle name="text-background" cornerRadius={10} background={isAudioPlaying ? "rgba(102, 204, 255, 0.7)" : "rgba(128, 128, 128, 0.7)"}>
                                    <textBlock name="audio-button-label" text={isAudioPlaying ? "🎵 BGM ON" : "🎵 BGM OFF"} color="white" fontSize={28} fontWeight="bold"/>
                                </rectangle>
                            </advancedDynamicTexture>
                        </plane>

                    {/* Page Navigation UI */}
                    <transformNode name="page-nav-parent" position={POSITIONS.PAGE_NAV}>
                        <plane name="page-info" width={0.35} height={0.1} position={new Vector3(0, 0, 0)} isPickable={false}>
                            <advancedDynamicTexture name="page-info-texture" height={128} width={256} createForParentMesh>
                                <textBlock name="page-info-text" text={`Page ${currentPage + 1} / ${totalPages}`} color="white" fontSize={32} fontWeight="bold" />
                            </advancedDynamicTexture>
                        </plane>
                    </transformNode>
                    
                    {/* Gallery Parent Node */}
                    <transformNode name="gallery-parent" rotation={new Vector3(0, galleryRotationY, 0)}>
                        {boxes.map(createGalleryItem)}
                    </transformNode>
                </BabylonScene>
            </BabylonEngine>
        </div>
    );
};

const App = React.memo(function App() {
    
    
    // カスタムフックでページのmeta情報を設定
    usePageMeta({
        title: '円形回転型（BGM付き）| Babylon.js | VR Galleries',
        description: 'Babylon.jsを使ったVRフォトギャラリー。3D空間での写真鑑賞を、音楽と共にインスタレーション体験でお楽しみください。',
        keywords: 'Babylon.js, VR, フォトギャラリー, 3D, WebGL, インスタレーション, 音楽',
        ogTitle: '円形回転型（BGM付き）| Babylon.js | VR Galleries',
        ogDescription: 'Babylon.jsを使ったVRフォトギャラリー。3D空間での写真鑑賞体験。',
        ogType: 'website',
        ogImage: '/images/babylonjs-gallery-preview.jpg'
    });

    return <CirclePlanesScene />;
});

XRSceneManager.displayName = 'XRSceneManager';

export default App;
