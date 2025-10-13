// 安全なThree.jsコンポーネントラッパー

import React from 'react';
import { Position3D, SafeSpotLightProps, SafeMeshProps } from '../types/three-fiber';

// 安全なSpotLightコンポーネント
export const SafeSpotLight: React.FC<SafeSpotLightProps> = (props) => {
  return (
    // @ts-expect-error Three.js Fiberの型定義の制限を回避
    <spotLight {...props} />
  );
};

// 安全なMeshコンポーネント
export const SafeMesh: React.FC<SafeMeshProps> = (props) => {
  return (
    // @ts-expect-error Three.js Fiberの型定義の制限を回避
    <mesh {...props} />
  );
};

// 位置ヘルパー関数
export const createPosition = (x: number, y: number, z: number): Position3D => [x, y, z];

// カラーヘルパー関数
export const createHexColor = (hex: string): string => {
  if (!hex.startsWith('#')) {
    return `#${hex}`;
  }
  return hex;
};

// 角度変換ヘルパー関数
export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians: number): number => (radians * 180) / Math.PI;
