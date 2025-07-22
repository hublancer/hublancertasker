'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSound(soundUrl: string, { volume = 1.0 } = {}) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioInstance = new Audio(soundUrl);
    audioInstance.volume = volume;
    setAudio(audioInstance);
  }, [soundUrl, volume]);

  const play = useCallback(() => {
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        // Autoplay was prevented.
        console.warn("Audio play was prevented by browser policy. This is common and expected.");
      });
    }
  }, [audio]);

  return [play];
}
