import React, { useEffect, useRef } from 'react';
import { initYouTubePlayer } from '@/lib/youtubePlayer';

/**
 * Invisible YouTube Background Player Container.
 * Mounted once at app root to host the YouTube IFrame API instance.
 */
export function YouTubeBackgroundPlayer() {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      initYouTubePlayer('youtube-bgm-player-target');
    }
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '200px',
        height: '200px',
        opacity: 0.001,
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      <div id="youtube-bgm-player-target" />
    </div>
  );
}
