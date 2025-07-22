'use client';

import { useCallback } from 'react';

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface SoundOptions {
  frequency?: number;
  volume?: number;
  duration?: number;
  type?: WaveType;
}

export function useSound({
  frequency = 440,
  volume = 0.5,
  duration = 0.1,
  type = 'sine',
}: SoundOptions = {}) {
  const play = useCallback(() => {
    // We can only use the Web Audio API in the browser.
    if (typeof window === 'undefined') return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn("Could not play sound. This can happen if the browser tab is not in focus.", error);
    }
  }, [frequency, volume, duration, type]);

  return [play];
}
