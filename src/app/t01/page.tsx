'use client';

/* eslint-disable */
// @ts-nocheck

import { Suspense, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { Plane, OrbitControls, Circle, useTexture, Box, Text } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { HandleTarget, Handle } from '@react-three/handle';
import { DoubleSide, Texture, TextureLoader, RepeatWrapping, LinearFilter, Mesh, Group } from 'three';
import * as THREE from 'three';
import { SafeSpotLight, SafeMesh, createPosition, degreesToRadians } from '../../components/SafeThreeComponents';
import { LIGHTING_CONFIG, GALLERY_CONFIG } from '../../config/three-config';
import { VRGuideText, VRGuideSkipButton } from '../../components/VRGuide';
import { useVRGuide } from '../../hooks/useVRGuide';

const imageUrls = [
  '/images/photo01.jpg',
  '/images/photo02.jpg',
  '/images/photo03.jpg',
  '/images/photo04.jpg',
  '/images/photo05.jpg',
  '/images/photo06.jpg',
  '/images/photo07.jpg',
  '/images/photo08.jpg'
];

// 画像とタイトルのデータを定義
const imageTitles = [
  '欲望に咲く花',
  '孤独',
  '自然',
  '補色',
  '夢想',
  '心身権衡',
  '追想と追憶',
  '羽毛'
];

interface PhotoPlaneProps {
  position: [number, number, number]; // 平面の位置[x, y, z]
  rotation: [number, number, number]; // 平面の回転[x, y, z] (ラジアン)
  texture: Texture; // 表示するテクスチャ
  title?: string; // タイトルを追加
  isVisible: boolean; // 表示/非表示
  isAnimating: boolean; // アニメーション中
  animationDelay: number; // アニメーションの遅延ミリ秒
}
function PhotoPlane({ position, rotation, texture, title, isVisible, isAnimating, animationDelay }: PhotoPlaneProps) {
  const meshRef = useRef<Group>(null);
  const titleMeshRef = useRef<THREE.Mesh>(null);
  const [opacity, setOpacity] = useState(isVisible && !isAnimating ? 1 : 0);
  const [currentY, setCurrentY] = useState(isVisible ? position[1] : -5); // Y座標の状態管理

  // Y座標とopacityのアニメーション管理
  useEffect(() => {
    if (isAnimating && isVisible) {
      // 開始時は透明に設定し、地面下から開始
      setOpacity(0);
      setCurrentY(-5);
      
      // 遅延後にアニメーションを開始
      const timer = setTimeout(() => {
        
        let animationFrameId: number;
        const targetY = position[1]; // 目標Y座標
        const startY = -5; // 開始Y座標
        const animationDuration = 2000; // 2秒のアニメーション
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          
          // イージング関数(easeOutCubic)を適用
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          
          // Y座標を更新
          setCurrentY(startY + (targetY - startY) * easedProgress);
          
          // 透明度を更新
          setOpacity(easedProgress);
          
          // アニメーション継続チェック
          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          } else {
            
          }
        };
        
        animate();
        
        // クリーンアップ
        return () => {
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        };
      }, animationDelay);
      
      return () => clearTimeout(timer);
    } else if (!isVisible) {
      // 非表示時は即座に地面下に移動
      setOpacity(0);
      setCurrentY(-5);
    } else if (isVisible && !isAnimating) {
      // アニメーションなしで表示の場合は即座に表示
      setOpacity(1);
      setCurrentY(position[1]);
    }
  }, [isVisible, isAnimating, animationDelay, position, title]);

  // マテリアルの透明度を更新
  useEffect(() => {
    // グループ内の最初のメッシュ（Plane）を探してマテリアルを更新する
    const planeMesh = meshRef.current?.children?.find((child) => {
      return (child as THREE.Mesh).type === 'Mesh' && (child as THREE.Mesh).material;
    }) as THREE.Mesh | undefined;
  
    if (planeMesh?.material) {
      if (Array.isArray(planeMesh.material)) {
        planeMesh.material.forEach((mat) => {
          if (mat instanceof THREE.MeshBasicMaterial) {
            mat.transparent = opacity < 1;
            mat.opacity = opacity;
          }
        });
      } else if (planeMesh.material instanceof THREE.MeshBasicMaterial) {
        planeMesh.material.transparent = opacity < 1;
        planeMesh.material.opacity = opacity;
      }
    }
    
    if (titleMeshRef.current?.material) {
      if (Array.isArray(titleMeshRef.current.material)) {
        titleMeshRef.current.material.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.transparent = opacity < 1;
            mat.opacity = opacity;
          }
        });
      } else if (titleMeshRef.current.material instanceof THREE.MeshStandardMaterial) {
        titleMeshRef.current.material.transparent = opacity < 1;
        titleMeshRef.current.material.opacity = opacity;
      }
    }
  }, [opacity]);

  // Y座標の更新
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.y = currentY;
    }
  }, [currentY]);

  // 画像の縦横比を正確に取得（メモ化）
  const { width, height } = useMemo(() => {
    let width = 1, height = 1;
    if (texture.image) {
      const img = texture.image as HTMLImageElement;
      const imgWidth = img.naturalWidth ?? img.width ?? 1;
      const imgHeight = img.naturalHeight ?? img.height ?? 1;
      const aspectRatio = imgWidth / imgHeight;
      // VR環境での見やすさを考慮してサイズの0.75から0.5に縮小
      const MAX_SIZE = 0.5;
      if (aspectRatio > 1) {
        width = MAX_SIZE;
        height = MAX_SIZE / aspectRatio;
      } else {
        width = MAX_SIZE * aspectRatio;
        height = MAX_SIZE;
      }
    }
    return { width, height };
  }, [texture.image]);

  return (
    <group ref={meshRef} position={[position[0], currentY, position[2]]} rotation={rotation}>
      {/* Three.jsのPlaneオブジェクト*/}
      <Plane args={[width, height]} castShadow>
        {/* 画像の鮮やかな色調表示のためのマテリアル */}
        <meshBasicMaterial
          map={texture} // テクスチャとして指定
          side={DoubleSide} // 両面表示
          toneMapped={false} // トーンマッピングを無効にして鮮やかに
          transparent={opacity < 1} // 必要な場合のみ透明
          opacity={opacity} // 透明度
        />
      </Plane>
      {/* タイトルプレート */}
      {title && (
        <group position={[0, -height / 2 - 0.12, 0]}>
          <mesh ref={titleMeshRef as any} name={`title-${title}`}>
            <boxGeometry args={[0.2, 0.06, 0.005]} />
            <meshStandardMaterial 
              color="#bbb" 
              metalness={1} 
              roughness={0.2}
              transparent={opacity < 1}
              opacity={opacity}
            />
          </mesh>
          <Text
            fontSize={0.02}
            color="#fff"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0.005]}
          >
            {title}
          </Text>
        </group>
      )}
    </group>
  );
}

interface PhotoGalleryProps {
  radius: number;
  imageUrls: string[];
  showPhotos: boolean;
  photosAnimating: boolean;
}

function PhotoGallery({ radius, imageUrls, showPhotos, photosAnimating }: PhotoGalleryProps) {
  // すべての画像テクスチャをロード
  const textures = useLoader(TextureLoader, imageUrls);

  // テクスチャの品質設定を最適化
  useMemo(() => {
    textures.forEach(texture => {
      // VRでのフィルタリング設定
      texture.magFilter = LinearFilter; // 拡大時の補間アルゴリズム
      texture.minFilter = LinearFilter; // 縮小時の補間アルゴリズム
      texture.generateMipmaps = true; // ミップマップ生成
      texture.anisotropy = 16; // 異方性フィルタリングを最大に
    });
  }, [textures]);

  // ギャラリーの動的半径を計算 (メモ化により再計算を抑制)
  const dynamicRadius = useMemo(() => {
    const totalWidth = textures.reduce((sum, texture) => {
      const aspect = (texture.image?.naturalWidth || 1) / (texture.image?.naturalHeight || 1);
      // VRに調整したサイズ0.75 → 0.5に
      return sum + (aspect > 1 ? 0.5 : 0.5 * aspect);
    }, 0);

    // 最小半径以上で画像が重ならないように動的に半径を確保
    return Math.max(radius, totalWidth / (Math.PI * 2));
  }, [textures, radius]);

  return (
    <>
      {/* 各画像に対してPhotoPlaneを生成*/}
      {textures.map((texture, index) => {
        // 円形配置のための角度と位置を計算
        const angle = (index * Math.PI * 2) / textures.length;
        const x = dynamicRadius * Math.sin(angle);
        const z = dynamicRadius * Math.cos(angle);
        const rotationY = angle + Math.PI; // 中心を向くように
        return (
          <PhotoPlane
            key={imageUrls[index]} // Reactのリコンシリエーション用のキー
            position={[x, 1.4, z]} // 平面の位置(Y軸は高さ1.4で固定)
            rotation={[0, rotationY, 0]} // 平面の向き
            texture={texture} // ロードしたテクスチャを渡す
            title={imageTitles[index]} // タイトルを渡す
            isVisible={showPhotos}
            isAnimating={photosAnimating}
            animationDelay={index * 200} // 200msずつ順次アニメーション
          />
        );
      })}
    </>
  );
}


function InteractiveGallery({ radius, imageUrls, showPhotos, photosAnimating }: PhotoGalleryProps) {
  return (
    <HandleTarget>
      <Handle translate="as-rotate" rotate={{ x: false, y: true, z: false }}>
        <PhotoGallery radius={radius} imageUrls={imageUrls} showPhotos={showPhotos} photosAnimating={photosAnimating} />
      </Handle>
    </HandleTarget>
  );
}

function Floor() {
  const texture = useTexture('/texture/concrete_diff.jpg');
  const bumpMap = useTexture('/texture/concrete_rough.png');
  texture.repeat.set(12, 12);
  texture.wrapS = texture.wrapT = RepeatWrapping;

  bumpMap.repeat.set(12, 12);
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping;

  return (
    <Circle args={[8, 128]} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial
        map={texture}
        bumpMap={bumpMap}
        bumpScale={0.05}
      />
    </Circle>
  );
}

export default function App() {
  const [xrSupported, setXrSupported] = useState(false);
  const [store, setStore] = useState<ReturnType<typeof createXRStore> | null>(null);
  
  // VRガイドシステムで管理
  const vrGuide = useVRGuide();
  // stale closureを避けるためにrefで管理
  const vrGuideRef = useRef(vrGuide);
  const isVRActiveRef = useRef(false);
  
  // BGM管理用のref
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  // BGMの初期化
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bgmAudio = new Audio('/mp3/vfbgm.mp3');
      bgmAudio.loop = true; // ループ再生
      bgmAudio.volume = 0.3; // 音量30%に設定
      bgmAudio.preload = 'auto'; // 事前読み込み
      bgmAudioRef.current = bgmAudio;
      
      
    }
    
    return () => {
      // クリーンアップ
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  // BGM再生関数
  const playBGM = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.play().catch(error => {
        console.warn('BGM playback failed:', error);
      });
      
    }
  }, []);

  // BGM停止関数
  const stopBGM = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current.currentTime = 0; // 先頭に戻す
      
    }
  }, []);

  // 毎フレームレンダリングでvrGuideの現在のrefに格納する
  useEffect(() => {
    vrGuideRef.current = vrGuide;
  });


  // XRサポート確認とストアの初期化
  useEffect(() => {
    let xrStore: ReturnType<typeof createXRStore> | null = null;
    try {
      // ブラウザ環境でのXRストア作成
      if (typeof window !== 'undefined') {
        // WebXR APIの利用可能性を確認
        if ('navigator' in window && 'xr' in navigator && navigator.xr) {
          navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
              try {
                xrStore = createXRStore();
                setStore(xrStore);
                setXrSupported(true);
                

                // XRセッション状態の変更を監視
                xrStore.subscribe((state) => {
                  if (state.session && !isVRActiveRef.current) {
                    // VRセッションが開始
                    isVRActiveRef.current = true;
                    
                    playBGM(); // BGM開始
                    setTimeout(() => vrGuideRef.current.startGuide(), 100);
                  } else if (!state.session && isVRActiveRef.current) {
                    // VRセッションが終了
                    
                    isVRActiveRef.current = false;
                    stopBGM(); // BGM停止
                    vrGuideRef.current.endGuide();
                  }
                });
              } catch (error) {
                console.error('XR store creation failed:', error);
                setXrSupported(false);
              }
            } else {
              console.warn('VR sessions are not supported');
              setXrSupported(false);
            }
          }).catch(() => {
            console.warn('WebXR support check failed');
            setXrSupported(false);
          });
        } else {
          console.warn('WebXR API not available');
          setXrSupported(false);
        }
      }
    } catch (error) {
      console.error('Failed to initialize XR:', error);
      setXrSupported(false);
    }

    return () => {
      // クリーンアップ
      
      
      // BGMの停止
      stopBGM();
      
      // VRガイド終了
      if(vrGuideRef.current) {
        vrGuideRef.current.endGuide();
      }
      
      // XRストアの破棄
      if (xrStore) {
        try {
          xrStore.destroy?.();
        } catch (error) {
          console.warn('Error during XR store cleanup:', error);
        }
      }
    };
  }, []); // このuseEffectは一度だけ実行
  const wallHeight = GALLERY_CONFIG.WALL.HEIGHT;
  const wallRadius = GALLERY_CONFIG.WALL.RADIUS;
  const segments = GALLERY_CONFIG.WALL.SEGMENTS;

  const SceneContent = () => (
    <>
      <ambientLight intensity={LIGHTING_CONFIG.AMBIENT.INTENSITY} />
      <hemisphereLight 
        color={LIGHTING_CONFIG.HEMISPHERE.SKY_COLOR}
        groundColor={LIGHTING_CONFIG.HEMISPHERE.GROUND_COLOR}
        intensity={LIGHTING_CONFIG.HEMISPHERE.INTENSITY}
      />
      <SafeSpotLight
        position={LIGHTING_CONFIG.SPOT.POSITION}
        angle={degreesToRadians(LIGHTING_CONFIG.SPOT.ANGLE_DEGREES)}
        intensity={LIGHTING_CONFIG.SPOT.INTENSITY}
        color={LIGHTING_CONFIG.SPOT.COLOR}
        castShadow={LIGHTING_CONFIG.SPOT.CAST_SHADOW}
        penumbra={LIGHTING_CONFIG.SPOT.PENUMBRA}
      />
      <Suspense fallback={null}>
        <Floor />
        <SafeMesh
          position={createPosition(0, wallHeight / 2, 0)}
          receiveShadow={true}
        >
          <cylinderGeometry args={[wallRadius, wallRadius, wallHeight, segments, 1, true]} />
          <meshStandardMaterial side={DoubleSide} color={0x000000} />
        </SafeMesh>
        <InteractiveGallery 
          radius={GALLERY_CONFIG.PHOTO.RADIUS} 
          imageUrls={imageUrls} 
          showPhotos={vrGuide.showPhotos}
          photosAnimating={vrGuide.photosAnimating}
        />
        {/* VRガイド表示*/}
        <VRGuideText visible={vrGuide.showGuide} text={vrGuide.currentText} />
        <VRGuideSkipButton visible={vrGuide.showGuide} onSkip={vrGuide.skipGuide} />
      </Suspense>
    </>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black', position: 'relative' }}>
      <Canvas camera={{ position: [0, 1.6, 5], fov: 75 }} flat dpr={[1, 2]}>
        {/* XRがサポートされている場合のみXRコンポーネントを使用 */}
        {xrSupported && store ? (
          <XR store={store}>
            <SceneContent />
          </XR>
        ) : (
          /* 通常モード(XRなし)*/
          <>
            <SceneContent />
            <OrbitControls />
          </>
        )}
      </Canvas>
      {/* VRモード入室ボタンを中央に配置 */}
      {xrSupported && store && (
      <button
        onClick={() => store.enterVR()}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '24px 80px',
          fontSize: '24px',
          fontWeight: '500',
          letterSpacing: '0.4em',
          color: '#ffffff',
          backgroundColor: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '2px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.transform = 'translate(-50%, -50%) translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translate(-50%, -50%) translateY(0)';
        }}
      >
        ENTER VR
      </button>
      )}
    </div>
  );
}

