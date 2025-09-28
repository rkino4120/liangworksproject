// Three.js Fiber の型安全性を向上させるための型定義

import { Vector3Tuple, Texture } from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    spotLight: {
      position?: Vector3Tuple;
      angle?: number;
      intensity?: number;
      color?: string | number;
      castShadow?: boolean;
      penumbra?: number;
      decay?: number;
      distance?: number;
    };
    
    mesh: {
      position?: Vector3Tuple;
      rotation?: Vector3Tuple;
      scale?: Vector3Tuple;
      receiveShadow?: boolean;
      castShadow?: boolean;
      visible?: boolean;
      name?: string;
      children?: React.ReactNode;
    };
    
    cylinderGeometry: {
      args?: [
        radiusTop?: number,
        radiusBottom?: number,
        height?: number,
        radialSegments?: number,
        heightSegments?: number,
        openEnded?: boolean,
        thetaStart?: number,
        thetaLength?: number
      ];
    };
    
    meshStandardMaterial: {
      color?: string | number;
      side?: number;
      transparent?: boolean;
      opacity?: number;
      roughness?: number;
      metalness?: number;
      map?: Texture;
      bumpMap?: Texture;
      bumpScale?: number;
      toneMapped?: boolean;
    };
  }
}

// 型安全な位置指定のためのヘルパー型
export type Position3D = [number, number, number];
export type Rotation3D = [number, number, number];
export type Scale3D = [number, number, number];

// 型安全なライトプロパティ
export interface SafeSpotLightProps {
  position: Position3D;
  angle: number;
  intensity: number;
  color: string | number;
  castShadow?: boolean;
  penumbra?: number;
  decay?: number;
  distance?: number;
}

// 型安全なメッシュプロパティ
export interface SafeMeshProps {
  position?: Position3D;
  rotation?: Rotation3D;
  scale?: Scale3D;
  receiveShadow?: boolean;
  castShadow?: boolean;
  visible?: boolean;
  name?: string;
  children?: React.ReactNode;
}