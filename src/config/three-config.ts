// Three.js関連の定数と設定値

import type { Position3D } from '../types/three-fiber';

// ライト設定
export const LIGHTING_CONFIG = {
  AMBIENT: {
    INTENSITY: 0.05,
  },
  SPOT: {
    POSITION: [0, 4, 0] as Position3D,
    ANGLE_DEGREES: 22.5,
    INTENSITY: 500,
    COLOR: '#FFF7E1',
    CAST_SHADOW: true,
    PENUMBRA: 0.5, // 縁のボケ効果（0: シャープ、1: 完全にボケる）
  },
  RECT_AREA: {
    ARGS: [0xffffff, 5, 0.5, 2] as const,
    POSITION: [0, 1.5, 0] as Position3D,
    LOOK_AT: [1, 1.5, 2] as Position3D,
    CAST_SHADOW: true,
  },
} as const;

// カメラ設定
export const CAMERA_CONFIG = {
  POSITION: [0, 5, 10] as Position3D,
  FOV: 75,
} as const;

// ギャラリー設定
export const GALLERY_CONFIG = {
  WALL: {
    HEIGHT: 5,
    RADIUS: 8,
    SEGMENTS: 64,
    COLOR: 0x000000,
  },
  INTERACTIVE: {
    RADIUS: 1.1,
  },
} as const;

// 型安全なバリデーション関数
export const validatePosition = (position: unknown): Position3D => {
  if (Array.isArray(position) && position.length === 3 && position.every(n => typeof n === 'number')) {
    return position as Position3D;
  }
  throw new Error('Invalid position: must be [number, number, number]');
};

export const validateAngle = (angle: number): number => {
  if (typeof angle !== 'number' || angle < 0 || angle > Math.PI) {
    throw new Error('Invalid angle: must be between 0 and π radians');
  }
  return angle;
};

export const validateIntensity = (intensity: number): number => {
  if (typeof intensity !== 'number' || intensity < 0) {
    throw new Error('Invalid intensity: must be a positive number');
  }
  return intensity;
};