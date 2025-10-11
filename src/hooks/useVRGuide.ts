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

// guide.jsonの型定義
type GuideSteps = GuideStep[];

export function useVRGuide(): VRGuideState & VRGuideActions {
  const [showGuide, setShowGuide] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState<GuideSteps>([]);
  const [currentText, setCurrentText] = useState('');
  const [showPhotos, setShowPhotos] = useState(true);
  const [photosAnimating, setPhotosAnimating] = useState(false);

  // useRefを使用してAudioオブジェクトを管理します。
  // これにより、Audioオブジェクトへの参照が変更されても不要な再レンダリングが走りません。
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

  // 音声再生とテキスト表示を管理するuseEffect
  useEffect(() => {
    // ガイドが表示されていない、またはガイドデータが空の場合は何もしない
    if (!showGuide || guideSteps.length === 0) {
      return;
    }

    // 全てのステップが完了した場合の処理
    if (currentStep >= guideSteps.length) {
      console.log('All steps completed');
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

    // テキストを設定（改行を変換）
    setCurrentText(step.text.replace(/\\n/g, '\n'));

    // 新しいAudioオブジェクトを作成
    const audio = new Audio(step.mp3file);
    audioRef.current = audio;

    // --- イベントリスナーの定義 ---
    const handlePlay = () => {
      console.log('Audio started playing:', step.mp3file);
      setAudioPlaying(true);
    };

    const handleEnded = () => {
      console.log(`Step ${currentStep + 1} audio ended`);
      setAudioPlaying(false);
      
      const nextStep = currentStep + 1;
      if (nextStep >= guideSteps.length) {
        // 全ガイド終了時は写真をアニメーション表示
        console.log('All guide steps completed, showing photos with animation...');
        setShowGuide(false);
        setCurrentText('');
        setCurrentStep(0); // ステップをリセット
        setPhotosAnimating(true);
        setShowPhotos(true);
        
        setTimeout(() => {
          setPhotosAnimating(false);
          console.log('Photo animation completed after guide completion');
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
    
    // --- イベントリスナーの登録 ---
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 音声の再生を開始
    audio.play().catch((error) => {
      console.error('Failed to play guide audio:', error);
      // alertは使用せず、コンソールにエラーを出力
      console.error('This might be due to browser autoplay policy. User interaction is required.');
      setAudioPlaying(false);
    });

    // --- クリーンアップ処理 ---
    // このuseEffectが再実行される前（currentStepが変わった時など）や、
    // コンポーネントがアンマウントされた時に実行されます。
    // これにより、古い音声の再生やイベントリスナーが残ることを防ぎます。
    return () => {
      console.log('Cleaning up audio for step:', currentStep + 1);
      
      // イベントリスナーを必ず削除
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);

      // 音声を停止し、リソースを解放
      if (!audio.paused) {
        audio.pause();
      }
      // srcを空にすることで、ブラウザによるダウンロードを停止させることができます
      audio.src = ''; 
      audioRef.current = null;
    };
    // 依存配列を絞り、意図したタイミングでのみ実行されるようにします
  }, [currentStep, showGuide, guideSteps]);

  // ガイド開始
  const startGuide = useCallback(() => {
    if (audioPlaying) {
      console.log('Audio already playing, skipping start.');
      return;
    }
    if (guideSteps.length === 0) {
      console.log('Guide steps not loaded yet, please wait...');
      return;
    }
    console.log('Starting VR guide...');
    setShowGuide(true);
    setShowPhotos(false); // ガイド開始時に写真を非表示
    setCurrentStep(0);
  }, [audioPlaying, guideSteps.length]);

  // ガイドを即座に終了して写真をアニメーション表示
  const skipGuide = useCallback(() => {
    if (!showGuide) return;
    console.log('Skipping guide completely...');
    
    // ガイド終了処理
    console.log('Guide skipped, showing photos with animation...');
    setShowGuide(false);
    setAudioPlaying(false);
    setCurrentText('');
    setCurrentStep(0); // ステップをリセット
    setPhotosAnimating(true);
    setShowPhotos(true);
    
    // 音声停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    setTimeout(() => {
      setPhotosAnimating(false);
      console.log('Photo animation completed');
    }, 3000); // 3秒のアニメーション
  }, [showGuide]);

  // ガイドを完全に終了
  const endGuide = useCallback(() => {
    console.log('Ending VR guide...');
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

  // 状態変化のデバッグログ
  useEffect(() => {
    console.log(`VRGuide state: showGuide=${showGuide}, showPhotos=${showPhotos}, photosAnimating=${photosAnimating}, currentStep=${currentStep}`);
  }, [showGuide, showPhotos, photosAnimating, currentStep]);

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
