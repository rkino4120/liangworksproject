// 型安全なHooksとエラーハンドリング

import { useCallback, useMemo } from 'react';
import type { Position3D } from '../types/three-fiber';
import { validatePosition, validateAngle, validateIntensity } from '../config/three-config';

// 型安全なポジション管理Hook
export const useTypeSafePosition = (
  x: number, 
  y: number, 
  z: number
): Position3D => {
  return useMemo(() => {
    try {
      return validatePosition([x, y, z]);
    } catch (error) {
      console.error('Invalid position provided:', { x, y, z }, error);
      return [0, 0, 0]; // フォールバック値
    }
  }, [x, y, z]);
};

// 型安全なライト設定Hook
export const useTypeSafeLighting = (
  position: Position3D,
  angle: number,
  intensity: number
) => {
  return useMemo(() => {
    try {
      return {
        position: validatePosition(position),
        angle: validateAngle(angle),
        intensity: validateIntensity(intensity),
      };
    } catch (error) {
      console.error('Invalid lighting configuration:', { position, angle, intensity }, error);
      return {
        position: [0, 0, 0] as Position3D,
        angle: Math.PI / 4,
        intensity: 100,
      };
    }
  }, [position, angle, intensity]);
};

// エラーコンポーネントの型定義
export interface ThreeJSErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export interface ThreeJSError extends Error {
  componentStack?: string;
}

// Three.js専用エラーハンドラー
export const useThreeJSErrorHandler = () => {
  return useCallback((error: ThreeJSError, errorInfo: ThreeJSErrorInfo) => {
    console.error('Three.js Component Error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    
    // 本番環境ではエラー監視サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // 例: Sentry.captureException(error, { extra: errorInfo });
    }
  }, []);
};
