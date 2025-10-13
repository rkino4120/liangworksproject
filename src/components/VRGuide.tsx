'use client';

import { useEffect, useState } from 'react';
import { Box, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';

export function VRGuideText({ visible, text }: { visible: boolean; text: string }) {
  if (!visible) return null;

  return (
    <group position={[0, 2, -1.5]}>
      <Box args={[1.5, 1.5, 0.02]} position={[0, 0, -0.01]}>
        <meshStandardMaterial color="#000000" opacity={0.8} transparent />
      </Box>
      <Text
        fontSize={0.05}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        lineHeight={1.5}
        position={[0, -0.1, 0.01]}
      >
        {text}
      </Text>
    </group>
  );
}

export function VRGuideSkipButton({ visible, onSkip }: { visible: boolean; onSkip: () => void }) {
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (visible && (event.key === ' ' || event.key === 'Enter')) {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible, onSkip]);

  if (!visible) return null;

  return (
    <group position={[0, 1.2, -1.5]}>
      <group
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          onSkip();
        }}
        onClick={(e: ThreeEvent<PointerEvent>) => {
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
      <Text
        fontSize={0.06}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        position={[0, 0, 0.026]}
      >
        スキップ
      </Text>
    </group>
  );
}
