'use client';

import { useState, useCallback } from 'react';

export interface VRGuideState {
  showGuide: boolean;
  audioPlaying: boolean;
  guideAudio: HTMLAudioElement | null;
}

export interface VRGuideActions {
  startGuide: () => void;
  skipGuide: () => void;
  endGuide: () => void;
  cleanup: () => void;
}

export function useVRGuide(): VRGuideState & VRGuideActions {
  const [showGuide, setShowGuide] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [guideAudio, setGuideAudio] = useState<HTMLAudioElement | null>(null);

  // ガイド開始
  const startGuide = useCallback(() => {
    // 既に音声が再生中の場合は何もしない
    if (audioPlaying || guideAudio) {
      console.log('Audio already playing, skipping...');
      return;
    }

    console.log('Starting VR guide...');
    setShowGuide(true);
    setAudioPlaying(true);

    // 既存の音声を停止（追加の安全対策）
    const audioElement = guideAudio as HTMLAudioElement | null;
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
        setGuideAudio(null);
      } catch (error) {
        console.warn('Error stopping existing audio:', error);
        setGuideAudio(null);
      }
    }

    // 新しい音声を作成して再生
    try {
      const audio = new Audio('/mp3/guide01.mp3');
      
      audio.addEventListener('ended', () => {
        console.log('Guide audio ended');
        setShowGuide(false);
        setAudioPlaying(false);
        setGuideAudio(null);
      });
      
      audio.addEventListener('error', (error) => {
        console.error('Audio playback failed:', error);
        setShowGuide(false);
        setAudioPlaying(false);
        setGuideAudio(null);
      });
      
      audio.play().then(() => {
        setGuideAudio(audio);
        console.log('Guide audio started playing successfully');
      }).catch((error) => {
        console.error('Failed to play guide audio:', error);
        setShowGuide(false);
        setAudioPlaying(false);
      });
    } catch (error) {
      console.error('Failed to create audio:', error);
      setShowGuide(false);
      setAudioPlaying(false);
    }
  }, [audioPlaying, guideAudio]);

  // ガイドスキップ
  const skipGuide = useCallback(() => {
    console.log('Skipping guide...');
    setShowGuide(false);
    setAudioPlaying(false);
    const audioElement = guideAudio as HTMLAudioElement | null;
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
        setGuideAudio(null);
      } catch (error) {
        console.warn('Error stopping audio during skip:', error);
        setGuideAudio(null);
      }
    }
  }, [guideAudio]);

  // ガイド終了
  const endGuide = useCallback(() => {
    console.log('Ending VR guide...');
    setShowGuide(false);
    setAudioPlaying(false);
    const audioElement = guideAudio as HTMLAudioElement | null;
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
        setGuideAudio(null);
      } catch (error) {
        console.warn('Error stopping audio during guide end:', error);
        setGuideAudio(null);
      }
    }
  }, [guideAudio]);

  // クリーンアップ
  const cleanup = useCallback(() => {
    console.log('Cleaning up VR guide...');
    setShowGuide(false);
    setAudioPlaying(false);
    const audioElement = guideAudio as HTMLAudioElement | null;
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
        setGuideAudio(null);
      } catch (error) {
        console.warn('Error during VR guide cleanup:', error);
      }
    }
  }, [guideAudio]);

  return {
    // State
    showGuide,
    audioPlaying,
    guideAudio,
    // Actions
    startGuide,
    skipGuide,
    endGuide,
    cleanup,
  };
}