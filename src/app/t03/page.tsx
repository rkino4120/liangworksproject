'use client';

/* eslint-disable */
// @ts-nocheck

// This file uses Three.js - explicitly import Three.js types
/// <reference types="@types/three" />

import { useState, useRef, useEffect, useMemo } from 'react';
import { SRGBColorSpace, MeshStandardMaterial, VideoTexture } from 'three';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import { HandleTarget, Handle } from '@react-three/handle';
import { createXRStore, XR } from '@react-three/xr';
import { Physics, useBox, useCylinder } from '@react-three/cannon';

const store = createXRStore({ emulate: { syntheticEnvironment: false } });

export default function App() {
  return (
    <div className="w-screen h-screen bg-black relative">
      <Canvas
        shadows="soft"
        camera={{ position: [-0.5, 0.5, 0.5] }}
        gl={{
          antialias: true,
          outputColorSpace: SRGBColorSpace
        }}
      >
        <fog attach="fog" args={['#202020', 1, 10]} />
        <ambientLight intensity={0.1} />
        <spotLight
          {...{ position: [0, 3, 0] } as any}
          angle={Math.PI / 6}
          penumbra={1}
          intensity={1000}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-radius={10}
        />
        <Physics>
          <XR store={store}>
            <MyScene />
          </XR>
        </Physics>
        <OrbitControls />
      </Canvas>
      {/* VRモード入室ボタンを中央に配置 */}
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
    </div>
  );
}


interface ImagePlaneConfig {
  position: [number, number, number];
  imagePath: string;
}

interface VideoPlaneConfig {
  position: [number, number, number];
  videoPath: string;
}

type PlaneConfig = ImagePlaneConfig | VideoPlaneConfig;

interface CubeConfig {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
}

function MyScene() {
  const planeConfigs: PlaneConfig[] = useMemo(() => [
    { position: [-1, 2, 0], imagePath: '/images/photo01.jpg' },
    { position: [0, 2, 0], imagePath: '/images/photo02.jpg' },
    { position: [1, 2, 0], imagePath: '/images/photo03.jpg' },
    { position: [2, 2, 0], videoPath: '/images/fireworks.mp4' },
  ], []);

  const cubeConfigs: CubeConfig[] = useMemo(() => [
    { position: [-1, 0.15, -1], args: [0.25, 0.5, 0.25], color: 'white' },
    { position: [0.5, 0.5, -0.5], args: [0.25, 1, 0.25], color: 'white' },
    { position: [0.5, 0.5, 0.35], args: [0.25, 1, 0.25], color: 'white' },
    { position: [0.75, 0.15, 0.75], args: [0.25, 0.5, 0.25], color: 'white' },
    { position: [0.5, 0.15, 0], args: [0.5, 0.5, 0.5], color: 'white' },
  ], []);

  return (
    <>
      <HandleTarget>
        {planeConfigs.map((cfg, index) => (
          <Handle key={index} targetRef="from-context" translate rotate scale={false}>
            {'imagePath' in cfg ? (
              <TexturedPlane
                key={index}
                initialPosition={cfg.position}
                texturePath={cfg.imagePath}
              />
            ) : (
              <VideoPlane
                key={index}
                initialPosition={cfg.position}
                videoPath={cfg.videoPath}
              />
            )}
          </Handle>
        ))}
      </HandleTarget>
      {cubeConfigs.map((cfg, index) => (
        <StaticCube
          key={`cube-${index}`}
          position={cfg.position}
          args={cfg.args}
          color={cfg.color}
        />
      ))}
      <FloorCylinder />
    </>
  );
}

function TexturedPlane({
  initialPosition,
  texturePath,
}: {
  initialPosition: [number, number, number];
  texturePath: string;
}) {
  const texture = useTexture(texturePath);
  const matRefs = useRef<MeshStandardMaterial>(null);
  const [isGrabbed, setIsGrabbed] = useState(false);
  
  // 画像の縦横比を計算
  const { width, height } = useMemo(() => {
    if (texture.image) {
      const img = texture.image;
      const imgWidth = img.naturalWidth || img.width || 1;
      const imgHeight = img.naturalHeight || img.height || 1;
      const aspectRatio = imgWidth / imgHeight;
      
      // 最大サイズを設定（高さ基準）
      const maxHeight = 0.75;
      
      if (aspectRatio > 1) {
        // 横長の画像
        return { width: maxHeight * aspectRatio, height: maxHeight };
      } else {
        // 縦長の画像
        return { width: maxHeight * aspectRatio, height: maxHeight };
      }
    }
    return { width: 0.5, height: 0.75 }; // デフォルト値
  }, [texture.image]);
  
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: initialPosition,
    args: [width, 0.01, height],
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    linearDamping: 0.9,
    angularDamping: 0.9,
  }));

  // 画像サイズが変わったら物理演算のサイズも更新
  useEffect(() => {
    if (api) {
      // 物理演算の形状を更新する必要がある場合はここで処理
      // react-three/cannonではランタイムでの形状変更は難しいため、
      // 初期化時に正しいサイズを設定することが重要
    }
  }, [width, height, api]);

  useFrame(() => {
    if (isGrabbed && ref.current) {
      const { position, rotation } = ref.current;
      api.position.set(position.x, position.y, position.z);
      api.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  });

  const handleGrab = (grab: boolean) => {
    setIsGrabbed(grab);
    if (grab) {
      api.mass.set(0);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    } else {
      api.mass.set(1);
    }
  };

  return (
    <Handle targetRef={ref} translate rotate>
      <group ref={ref} onPointerDown={() => handleGrab(true)} onPointerUp={() => handleGrab(false)}>
        <mesh {...{ castShadow: true, receiveShadow: true } as any}>
          <boxGeometry args={[width, 0.01, height]} />
          <meshBasicMaterial map={texture} ref={matRefs} />
        </mesh>
      </group>
    </Handle>
  );
}

function VideoPlane({
  initialPosition,
  videoPath,
}: {
  initialPosition: [number, number, number];
  videoPath: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
  const [isGrabbed, setIsGrabbed] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0.5, height: 0.75 });

  // Physics hook for the video plane
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: initialPosition,
    args: [dimensions.width, 0.01, dimensions.height],
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
    linearDamping: 0.9,
    angularDamping: 0.9,
  }));

  useEffect(() => {
    const video = document.createElement('video');
    video.src = videoPath;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.style.display = 'none';

    video.onloadedmetadata = () => {
      // 動画の縦横比を計算
      const videoWidth = video.videoWidth || 1;
      const videoHeight = video.videoHeight || 1;
      const aspectRatio = videoWidth / videoHeight;
      
      // 最大サイズを設定（高さ基準）
      const maxHeight = 0.75;
      
      if (aspectRatio > 1) {
        // 横長の動画
        setDimensions({ width: maxHeight * aspectRatio, height: maxHeight });
      } else {
        // 縦長の動画
        setDimensions({ width: maxHeight * aspectRatio, height: maxHeight });
      }
      
      video.play().catch(error => console.error("Video autoplay failed:", error));
    };

    videoRef.current = video;
    const texture = new VideoTexture(video);
    setVideoTexture(texture);

    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
      if (texture) {
        texture.dispose();
      }
    };
  }, [videoPath]);

  useFrame(() => {
    if (isGrabbed && ref.current) {
      const { position, rotation } = ref.current;
      api.position.set(position.x, position.y, position.z);
      api.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  });

  const handleGrab = (grab: boolean) => {
    setIsGrabbed(grab);
    if (grab) {
      api.mass.set(0);
      api.velocity.set(0, 0, 0);
      api.angularVelocity.set(0, 0, 0);
    } else {
      api.mass.set(1);
    }
  };

  return (
    <Handle targetRef={ref} translate rotate>
      <group ref={ref} onPointerDown={() => handleGrab(true)} onPointerUp={() => handleGrab(false)}>
        <mesh {...{ castShadow: true, receiveShadow: true } as any}>
          <boxGeometry args={[dimensions.width, 0.01, dimensions.height]} />
          {videoTexture && <meshBasicMaterial map={videoTexture} />}
        </mesh>
      </group>
    </Handle>
  );
}

function StaticCube({
  position,
  args,
  color,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color: string;
}) {
  const [ref] = useBox(() => ({
    mass: 0,
    position: position,
    args: args,
    type: 'Static',
  }));

  return (
    <mesh ref={ref as any} {...{ receiveShadow: true, castShadow: true } as any}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function FloorCylinder() {
  const [ref] = useCylinder(() => ({
    mass: 0,
    position: [0, -0.1, 0],
    args: [7.5, 7.5, 0.1, 32],
    type: 'Static',
  }));

  return (
      <mesh ref={ref as any} {...{ receiveShadow: true } as any}>
        <cylinderGeometry args={[7.5, 7.5, 0.1, 64]} />
        <meshStandardMaterial color="white" />
      </mesh>
  );
}
