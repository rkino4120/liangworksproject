'use client';

/* eslint-disable */
// @ts-nocheck

import { Suspense, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { Plane, OrbitControls, Circle, useTexture, Box, Text } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { HandleTarget, Handle } from '@react-three/handle';
import { DoubleSide, Texture, TextureLoader, RepeatWrapping, Vector3 } from 'three';
import { SafeSpotLight, SafeMesh, createPosition, createHexColor, degreesToRadians } from '../../../components/SafeThreeComponents';
import type { Position3D } from '../../../types/three-fiber';
import { LIGHTING_CONFIG, CAMERA_CONFIG, GALLERY_CONFIG } from '../../../config/three-config';

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
}

function PhotoPlane({ position, rotation, texture, title }: PhotoPlaneProps) {
  // 画像の縦横比を正確に取得（メモ化）
  const { width, height } = useMemo(() => {
    let width = 1, height = 1;
    if (texture.image) {
      const img = texture.image;
      const imgWidth = img.naturalWidth ?? img.width ?? 1;
      const imgHeight = img.naturalHeight ?? img.height ?? 1;
      const aspectRatio = imgWidth / imgHeight;
      const MAX_SIZE = 0.75;
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
    <group position={position} rotation={rotation}>
      {/* Three.jsのPlaneジオメトリ */}
      <Plane args={[width, height]} castShadow>
        {/* PBR（物理ベースレンダリング）のような外観のためのマテリアル */}
        <meshStandardMaterial
          map={texture} // テクスチャマップ
          roughness={0.3} // 粗さ（0: 滑らか、1: 粗い）
          metalness={0.1} // 金属感（0: 誘電体、1: 金属）
          side={DoubleSide} // 両面表示
          toneMapped={true} // トーンマッピング適用
        />
      </Plane>
      {/* タイトルプレート */}
      {title && (
        <group position={[0, -height / 2 - 0.12, 0]}>
          <Box args={[0.2, 0.06, 0.005]} receiveShadow castShadow>
            <meshStandardMaterial color="#bbb" metalness={1} roughness={0.2} />
          </Box>
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
}

function PhotoGallery({ radius, imageUrls }: PhotoGalleryProps) {
  // すべての画像テクスチャをロード
  const textures = useLoader(TextureLoader, imageUrls);

  // ギャラリーの動的な半径を計算 (メモ化により再計算を抑制)
  const dynamicRadius = useMemo(() => {
    const totalWidth = textures.reduce((sum, texture) => {
      const aspect = (texture.image?.naturalWidth || 1) / (texture.image?.naturalHeight || 1);
      return sum + (aspect > 1 ? 0.75 : 0.75 * aspect);
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
          />
        );
      })}
    </>
  );
}


function InteractiveGallery({ radius, imageUrls }: PhotoGalleryProps) {
  return (
    <HandleTarget>
      <Handle translate="as-rotate" rotate={{ x: false, y: true, z: false }}>
        <PhotoGallery radius={radius} imageUrls={imageUrls} />
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
  const store = createXRStore();
  const wallHeight = GALLERY_CONFIG.WALL.HEIGHT;
  const wallRadius = GALLERY_CONFIG.WALL.RADIUS;
  const segments = GALLERY_CONFIG.WALL.SEGMENTS;

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: 'black' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 75 }} flat dpr={[1, 2]}>
        <XR store={store}>
          <ambientLight intensity={LIGHTING_CONFIG.AMBIENT.INTENSITY} />
          <SafeSpotLight
            position={LIGHTING_CONFIG.SPOT.POSITION}
            angle={degreesToRadians(LIGHTING_CONFIG.SPOT.ANGLE_DEGREES)}
            intensity={LIGHTING_CONFIG.SPOT.INTENSITY}
            color={LIGHTING_CONFIG.SPOT.COLOR}
            castShadow={LIGHTING_CONFIG.SPOT.CAST_SHADOW}
          />
          <rectAreaLight
            args={[0xffffff, 5, 0.5, 2]}
            position={[0, 1.5, 0]}
            lookAt={[1, 1.5, 2]}
            castShadow
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
            <InteractiveGallery radius={1.1} imageUrls={imageUrls} />
          </Suspense>
        </XR>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
