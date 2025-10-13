'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface GuideStep {
  mp3file: string;
  text: string;
}

export interface VRGuideState {
  showGuide: boolean;
  audioPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  currentText: string;
  showPhotos: boolean;
  photosAnimating: boolean;
}

export interface VRGuideActions {
  startGuide: () => void;
  skipGuide: () => void;
  endGuide: () => void;
}

// guide.jsonから定義
type GuideSteps = GuideStep[];

export function useVRGuide(): VRGuideState & VRGuideActions {
  const [showGuide, setShowGuide] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState<GuideSteps>([]);
  const [currentText, setCurrentText] = useState('');
  const [showPhotos, setShowPhotos] = useState(true);
  const [photosAnimating, setPhotosAnimating] = useState(false);

  // useRefを使ってAudioオブジェクトを管理する
  // これにより、Audioオブジェクトの参照が保持され、必要なクリーンアップを実行できる
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // guide.jsonを読み込み
  useEffect(() => {
    const loadGuideSteps = async () => {
      try {
        const response = await fetch('/guide.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const steps: GuideSteps = await response.json();
        setGuideSteps(steps);
      } catch (error) {
        console.error('Failed to load guide steps:', error);
      }
    };
    loadGuideSteps();
  }, []);

  // 音声ガイドとテキスト表示を管理するuseEffect
  useEffect(() => {
    // ガイド表示されていないまたはガイドデータが空の場合は何もしない
    if (!showGuide || guideSteps.length === 0) {
      return;
    }

    // 全てのステップが完了した時の処理
    if (currentStep >= guideSteps.length) {
      
      setShowGuide(false);
      setAudioPlaying(false);
      setCurrentStep(0);
      setCurrentText('');
      return;
    }

    const step = guideSteps[currentStep];
    if (!step) {
      console.error('Step not found:', currentStep);
      return;
    }

    // テキスト設定（改行文字を処理）
    setCurrentText(step.text.replace(/\\n/g, '\n'));

    // 新しいAudioオブジェクトを作成
    const audio = new Audio(step.mp3file);
    audioRef.current = audio;

    // --- イベントリスナーの定義 ---
    const handlePlay = () => {
      
      setAudioPlaying(true);
    };

    const handleEnded = () => {
      
      setAudioPlaying(false);
      
      const nextStep = currentStep + 1;
      if (nextStep >= guideSteps.length) {
        // ガイド終了時は写真アニメーション表示
        
        setShowGuide(false);
        setCurrentText('');
        setCurrentStep(0); // ステップをリセット
        setPhotosAnimating(true);
        setShowPhotos(true);
        
        setTimeout(() => {
          setPhotosAnimating(false);
          
        }, 3000); // 3秒のアニメーション
      } else {
        // 次のステップへ
        setCurrentStep(nextStep);
      }
    };

    const handleError = (error: Event) => {
      console.error('Audio playback failed:', error, 'File:', step.mp3file);
      setShowGuide(false);
      setAudioPlaying(false);
    };
    
    // --- イベントリスナー登録 ---
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 音声を再生
    audio.play().catch((error) => {
      console.error('Failed to play guide audio:', error);
      // alertを使わず、コンソールにエラー出力
      console.error('This might be due to browser autoplay policy. User interaction is required.');
      setAudioPlaying(false);
    });

    // --- クリーンアップ処理 ---
    // このuseEffectが再実行される時（currentStepが変わった時など）や、
    // コンポーネントがアンマウントされる時に実行される
    // これにより、古い音声のイベントリスナーが残ることを防ぎます
    return () => {
      
      
      // イベントリスナーを削除
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      // 音声を停止してリソースを解放
      if (!audio.paused) {
        audio.pause();
      }
      // srcを空にすることでブラウザにリソースを停止させる
      audio.src = ''; 
      audioRef.current = null;
    };
    // 依存配列。これらのデータが変更された時のみ実行される
  }, [currentStep, showGuide, guideSteps]);

  // ガイド開始
  const startGuide = useCallback(() => {
    if (audioPlaying) {
      
      return;
    }
    if (guideSteps.length === 0) {
      
      return;
    }
    
    setShowGuide(true);
    setShowPhotos(false); // ガイド開始時は写真非表示
    setCurrentStep(0);
  }, [audioPlaying, guideSteps.length]);

  // ガイドを即座に終了してアニメーション表示
  const skipGuide = useCallback(() => {
    if (!showGuide) return;
    
    
    // ガイド終了処理
    
    setShowGuide(false);
    setAudioPlaying(false);
    setCurrentText('');
    setCurrentStep(0); // ステップをリセット
    setPhotosAnimating(true);
    setShowPhotos(true);
    
    // 音声を停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    setTimeout(() => {
      setPhotosAnimating(false);
      
    }, 3000); // 3秒のアニメーション
  }, [showGuide]);

  // ガイドを完全に終了
  const endGuide = useCallback(() => {
    
    setShowGuide(false);
    setAudioPlaying(false);
    setCurrentStep(0); // ステップをリセット
    setCurrentText('');
    setShowPhotos(true); // 写真を表示
    setPhotosAnimating(false);

    // 再生中の音声があれば停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  // 状態変更をログ出力（主にデバッグ用）
  useEffect(() => {
    if (showGuide) {
      
    } else if (photosAnimating) {
      
    }
  }, [showGuide, photosAnimating, currentStep, guideSteps.length]);

  return {
    // State
    showGuide,
    audioPlaying,
    currentStep,
    totalSteps: guideSteps.length,
    currentText,
    showPhotos,
    photosAnimating,
    // Actions
    startGuide,
    skipGuide,
    endGuide,
  };
}
