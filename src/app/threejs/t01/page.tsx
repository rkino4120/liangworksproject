'use client';

/* eslint-disable */
// @ts-nocheck

import { Suspense, useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { Plane, OrbitControls, Circle, useTexture, Box, Text } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { HandleTarget, Handle } from '@react-three/handle';
import { DoubleSide, Texture, TextureLoader, RepeatWrapping, LinearFilter } from 'three';
import { SafeSpotLight, SafeMesh, createPosition, degreesToRadians } from '../../../components/SafeThreeComponents';
import { LIGHTING_CONFIG, GALLERY_CONFIG } from '../../../config/three-config';
import { VRGuideText, VRGuideSkipButton } from '../../../components/VRGuide';
import { useVRGuide } from '../../../hooks/useVRGuide';

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

// 画像ごとのタイトルをここで定義
const imageTitles = [
  '一縷の望み',
  '杭',
  '足に絡む蔓',
  '凝集',
  '失う恐怖',
  '通りゃんせ',
  '日を追うごとに',
  '羽化'
];

interface PhotoPlaneProps {
  position: [number, number, number]; // 平面の位置 [x, y, z]
  rotation: [number, number, number]; // 平面の回転 [x, y, z] (ラジアン)
  texture: Texture; // 表示する画像のテクスチャ
  title?: string; // タイトルを追加
  isVisible: boolean; // 表示/非表示
  isAnimating: boolean; // アニメーション中
  animationDelay: number; // アニメーション遅延（ミリ秒）
}

function PhotoPlane({ position, rotation, texture, title, isVisible, isAnimating, animationDelay }: PhotoPlaneProps) {
  const meshRef = useRef<any>(null);
  const titleMeshRef = useRef<any>(null);
  const [opacity, setOpacity] = useState(isVisible && !isAnimating ? 1 : 0);

  // アニメーション管理を簡素化
  useEffect(() => {
    if (isAnimating && isVisible) {
      // 初期状態を透明に設定
      setOpacity(0);
      
      // 遅延後にアニメーション開始
      const timer = setTimeout(() => {
        console.log(`Starting fade-in animation for ${title}`);
        let animationFrameId: number;
        
        const animate = () => {
          setOpacity(prev => {
            const newOpacity = Math.min(1, prev + 0.02); // 固定速度でフェードイン
            
            // アニメーション完了チェック
            if (newOpacity < 1) {
              animationFrameId = requestAnimationFrame(animate);
            } else {
              console.log(`Fade-in completed for ${title}`);
            }
            
            return newOpacity;
          });
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
      // 非表示時は即座に透明
      setOpacity(0);
    } else if (isVisible && !isAnimating) {
      // アニメーションなしで表示時は即座に不透明
      setOpacity(1);
    }
  }, [isVisible, isAnimating, animationDelay, title]);

  // マテリアルの透明度を更新
  useEffect(() => {
    if (meshRef.current?.material) {
      meshRef.current.material.transparent = opacity < 1;
      meshRef.current.material.opacity = opacity;
    }
    if (titleMeshRef.current?.material) {
      titleMeshRef.current.material.transparent = opacity < 1;
      titleMeshRef.current.material.opacity = opacity;
    }
  }, [opacity]);

  // 表示/非表示の管理
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.visible = isVisible;
    }
  }, [isVisible]);

  // 画像の縦横比を正確に取得（メモ化）
  const { width, height } = useMemo(() => {
    let width = 1, height = 1;
    if (texture.image) {
      const img = texture.image;
      const imgWidth = img.naturalWidth ?? img.width ?? 1;
      const imgHeight = img.naturalHeight ?? img.height ?? 1;
      const aspectRatio = imgWidth / imgHeight;
      // VR環境での適切な視聴距離を考慮したサイズ（元の0.75から0.5に縮小）
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
    <group ref={meshRef} position={position} rotation={rotation}>
      {/* Three.jsのPlaneジオメトリ */}
      <Plane args={[width, height]} castShadow>
        {/* PBR（物理ベースレンダリング）のような外観のためのマテリアル */}
        <meshStandardMaterial
          map={texture} // テクスチャマップ
          roughness={0.1} // 粗さを下げて反射を増やす（0: 滑らか、1: 粗い）
          metalness={0.0} // 金属感を削除して自然な色味に（0: 誘電体、1: 金属）
          side={DoubleSide} // 両面表示
          toneMapped={false} // トーンマッピングを無効化して鮮明に
          transparent={opacity < 1} // 必要時のみ透明
          opacity={opacity} // 動的透明度
        />
      </Plane>
      {/* タイトルプレート */}
      {title && (
        <group position={[0, -height / 2 - 0.12, 0]}>
          <mesh ref={titleMeshRef} name={`title-${title}`}>
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
      // VR用のフィルタリング設定
      texture.magFilter = LinearFilter; // 拡大時の補間を滑らかに
      texture.minFilter = LinearFilter; // 縮小時の補間を滑らかに
      texture.generateMipmaps = true; // ミップマップを生成
      texture.anisotropy = 16; // 異方性フィルタリングを最大に
    });
  }, [textures]);

  // ギャラリーの動的な半径を計算 (メモ化により再計算を抑制)
  const dynamicRadius = useMemo(() => {
    const totalWidth = textures.reduce((sum, texture) => {
      const aspect = (texture.image?.naturalWidth || 1) / (texture.image?.naturalHeight || 1);
      // VR用に調整されたサイズ（0.75 → 0.5）
      return sum + (aspect > 1 ? 0.5 : 0.5 * aspect);
    }, 0);

    // 半径が初期半径以上で、かつ写真が重ならないように十分な大きさであることを確認
    return Math.max(radius, totalWidth / (Math.PI * 2));
  }, [textures, radius]);

  return (
    <>
      {/* 各画像に対してPhotoPlaneを作成 */}
      {textures.map((texture, index) => {
        // 円形配置のための角度と位置を計算
        const angle = (index * Math.PI * 2) / textures.length;
        const x = dynamicRadius * Math.sin(angle);
        const z = dynamicRadius * Math.cos(angle);
        const rotationY = angle + Math.PI; // 中心に向かって回転

        return (
          <PhotoPlane
            key={imageUrls[index]} // Reactのリストレンダリング用のキー
            position={[x, 1.4, z]} // 平面の位置 (Y軸は高さ1.4に固定)
            rotation={[0, rotationY, 0]} // 平面の回転
            texture={texture} // ロード済みのテクスチャを渡す
            title={imageTitles[index]} // タイトルを渡す
            isVisible={showPhotos}
            isAnimating={photosAnimating}
            animationDelay={index * 200} // 200ms間隔で順次アニメーション
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
  const [store, setStore] = useState<any>(null);
  
  // VRガイド機能をフックで管理
  const vrGuide = useVRGuide();
  // stale closureを避けるためにrefで管理
  const vrGuideRef = useRef(vrGuide);
  const isVRActiveRef = useRef(false);

  // 毎回のレンダリングでvrGuideの最新の値をrefに格納する
  useEffect(() => {
    vrGuideRef.current = vrGuide;
  });


  // XRサポートの確認とストアの初期化
  useEffect(() => {
    let xrStore: any = null;
    try {
      // ブラウザ環境でのみXRストアを作成
      if (typeof window !== 'undefined') {
        // WebXR APIの利用可能性を確認
        if ('navigator' in window && 'xr' in navigator && navigator.xr) {
          navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            if (supported) {
              try {
                xrStore = createXRStore();
                setStore(xrStore);
                setXrSupported(true);
                console.log('XR initialized successfully');

                // XRセッション状態の変更を監視
                xrStore.subscribe((state: any) => {
                  if (state.session && !isVRActiveRef.current) {
                    // VRセッション開始
                    isVRActiveRef.current = true;
                    console.log('Starting VR guide...');
                    setTimeout(() => vrGuideRef.current.startGuide(), 100);
                  } else if (!state.session && isVRActiveRef.current) {
                    // VRセッション終了
                    console.log('Ending VR session, stopping guide...');
                    isVRActiveRef.current = false;
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
      console.log('Cleaning up XR store and audio...');
      
      // VRガイドを終了
      if(vrGuideRef.current) {
        vrGuideRef.current.endGuide();
      }
      
      // XRストアを破棄
      if (xrStore) {
        try {
          xrStore.destroy?.();
        } catch (error) {
          console.warn('Error during XR store cleanup:', error);
        }
      }
    };
  }, []); // このuseEffectはマウント時に一度だけ実行

  const wallHeight = GALLERY_CONFIG.WALL.HEIGHT;
  const wallRadius = GALLERY_CONFIG.WALL.RADIUS;
  const segments = GALLERY_CONFIG.WALL.SEGMENTS;

  const SceneContent = () => (
    <>
      <ambientLight intensity={LIGHTING_CONFIG.AMBIENT.INTENSITY} />
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
        {/* VRガイド表示 */}
        <VRGuideText visible={vrGuide.showGuide} text={vrGuide.currentText} />
        <VRGuideSkipButton visible={vrGuide.showGuide} onSkip={vrGuide.skipGuide} />
      </Suspense>
    </>
  );

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, 1.6, 5], fov: 75 }} flat dpr={[1, 2]}>
        {/* XRサポートがある場合のみXRコンポーネントを使用 */}
        {xrSupported && store ? (
          <XR store={store}>
            <SceneContent />
          </XR>
        ) : (
          /* 通常モード（XRなし） */
          <>
            <SceneContent />
            <OrbitControls />
          </>
        )}
      </Canvas>
    </div>
  );
}

