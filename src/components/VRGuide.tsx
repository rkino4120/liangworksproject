'use client';

import { useEffect, useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';

// VRガイドテキスト表示コンポーネント
export function VRGuideText({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null;

  return (
    <group position={[0, 2, -1.5]}>
      {/* 背景パネル */}
      <Box args={[1.5, 0.6, 0.02]} position={[0, 0, -0.01]}>
        <meshStandardMaterial color="#000000" opacity={0.8} transparent />
      </Box>
      {/* メインテキスト */}
      <Text
        fontSize={0.05}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        lineHeight={1.5}
        position={[0, 0, -0.01]}
      >
        {text}
      </Text>
    </group>
  );
}

// VRガイドスキップボタンコンポーネント
export function VRGuideSkipButton({ visible, onSkip }: { visible: boolean; onSkip: () => void }) {
  const [hover, setHover] = useState(false);

  // キーボードイベント処理（常に実行、visibleで制御）
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (visible && (event.key === ' ' || event.key === 'Enter')) { // スペースキーまたはエンターでスキップ
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible, onSkip]);

  if (!visible) return null;

  return (
    <group position={[0, 1.2, -1.5]}>
      {/* ボタン背景 - pointer イベントを追加（groupで受けて中にmeshを置く） */}
      <group
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSkip();
        }}
        onClick={(e: ThreeEvent<PointerEvent>) => {
          // クリックでも確実に動作させる
          e.stopPropagation();
          onSkip();
        }}
      >
  <mesh name="vr-guide-skip-button">
          <boxGeometry args={[0.5, 0.15, 0.05]} />
          <meshStandardMaterial
            color={hover ? '#ff6b7a' : '#ff4757'}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      </group>
      {/* ボタンテキスト */}
      <Text
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.026]}
      >
        ガイドスキップ
      </Text>
    </group>
  );
}