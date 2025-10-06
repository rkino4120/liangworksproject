'use client';

import { useEffect } from 'react';
import { Box, Text } from '@react-three/drei';

// VRガイドテキスト表示コンポーネント
export function VRGuideText({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <group position={[0, 2, -1.5]}>
      {/* 背景パネル */}
      <Box args={[1.5, 0.6, 0.02]} position={[0, 0, -0.01]}>
        <meshStandardMaterial color="#000000" opacity={0.8} transparent />
      </Box>
      {/* メインテキスト */}
      <Text
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        position={[0, 0.2, 0]}
      >
        VR写真ギャラリーにようこそ。{'\n'}
        これから操作説明を開始します。{'\n'}
        必要がない方はスキップを押してください。
      </Text>
    </group>
  );
}

// VRガイドスキップボタンコンポーネント
export function VRGuideSkipButton({ visible, onSkip }: { visible: boolean; onSkip: () => void }) {
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
      {/* ボタン背景 */}
      <Box args={[0.4, 0.15, 0.05]}>
        <meshStandardMaterial 
          color="#ff4757" 
          roughness={0.3}
          metalness={0.1}
        />
      </Box>
      {/* ボタンテキスト */}
      <Text
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.026]}
      >
        スキップ (スペースキー)
      </Text>
    </group>
  );
}