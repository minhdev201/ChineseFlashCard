/**
 * Global Site-wide YouTube Background Music Controller via YouTube IFrame API.
 * Allows uninterrupted background music playback across the entire website.
 */

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

const DEFAULT_YOUTUBE_ID = 'v8BTIHP-Mys'; // Study lofi

export interface YouTubeAudioSettings {
  bgmSource: 'synth' | 'youtube';
  youtubeUrl: string;
  youtubeVideoId: string;
  isPlaying: boolean;
  trackName: string;
}

export const YOUTUBE_PRESETS = [
  {
    name: 'Study lofi',
    id: 'v8BTIHP-Mys',
    url: 'https://www.youtube.com/watch?v=v8BTIHP-Mys',
  },
  {
    name: 'Handpan music',
    id: 'NSKxvLWqyOY',
    url: 'https://www.youtube.com/watch?v=NSKxvLWqyOY',
  },
  {
    name: 'Rain and piano',
    id: 'N2m4RFhCqKg',
    url: 'https://www.youtube.com/watch?v=N2m4RFhCqKg',
  },
  {
    name: 'Soothing rain',
    id: '0dcFWLV_OlI',
    url: 'https://www.youtube.com/watch?v=0dcFWLV_OlI',
  },
];

const STORAGE_KEY_YT = 'chinese_flashcard_youtube_audio_settings';

export function extractYouTubeVideoId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (!trimmed) return null;

  // Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function getInitialVolumePercent(): number {
  try {
    const raw = localStorage.getItem('chinese_flashcard_audio_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.bgmMuted) return 0;
      if (typeof parsed.bgmVolume === 'number') {
        return Math.round((parsed.bgmVolume / 0.8) * 100);
      }
    }
  } catch {
    // ignore
  }
  return 35;
}

function loadYTSettings(): YouTubeAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_YT);
    if (raw) {
      const parsed = JSON.parse(raw);
      const url = parsed.youtubeUrl || YOUTUBE_PRESETS[0].url;
      const extracted = extractYouTubeVideoId(url) || parsed.youtubeVideoId || YOUTUBE_PRESETS[0].id;
      return {
        bgmSource: parsed.bgmSource || 'youtube',
        youtubeUrl: url,
        youtubeVideoId: extracted,
        isPlaying: true, // Default playing on entry
        trackName: parsed.trackName || YOUTUBE_PRESETS[0].name,
      };
    }
  } catch {
    // fallback
  }

  return {
    bgmSource: 'youtube',
    youtubeUrl: YOUTUBE_PRESETS[0].url,
    youtubeVideoId: YOUTUBE_PRESETS[0].id,
    isPlaying: true, // Default playing on entry
    trackName: YOUTUBE_PRESETS[0].name,
  };
}

function saveYTSettings(s: YouTubeAudioSettings) {
  try {
    const toSave = {
      bgmSource: s.bgmSource,
      youtubeUrl: s.youtubeUrl,
      youtubeVideoId: s.youtubeVideoId,
      trackName: s.trackName,
    };
    localStorage.setItem(STORAGE_KEY_YT, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

let currentYTSettings: YouTubeAudioSettings = loadYTSettings();
const ytListeners = new Set<(s: YouTubeAudioSettings) => void>();

let playerInstance: YTPlayerInstance | null = null;
let isApiLoaded = false;
let isPlayerReady = false;
let pendingPlay = false;

function notifyListeners() {
  ytListeners.forEach((fn) => fn({ ...currentYTSettings }));
}

export function getYouTubeSettings(): YouTubeAudioSettings {
  return { ...currentYTSettings };
}

export function updateYouTubeSettings(partial: Partial<YouTubeAudioSettings>) {
  const prevId = currentYTSettings.youtubeVideoId;
  currentYTSettings = { ...currentYTSettings, ...partial };
  saveYTSettings(currentYTSettings);

  if (partial.youtubeVideoId && playerInstance && isPlayerReady) {
    try {
      playerInstance.unMute();
      const vol = getInitialVolumePercent();
      playerInstance.setVolume(vol > 0 ? vol : 35);

      if (currentYTSettings.isPlaying || partial.youtubeVideoId !== prevId) {
        playerInstance.loadVideoById(partial.youtubeVideoId);
        playerInstance.playVideo();
      } else {
        playerInstance.cueVideoById(partial.youtubeVideoId);
      }
    } catch (e) {
      console.warn('updateYouTubeSettings error:', e);
    }
  }

  notifyListeners();
}

export function subscribeYouTubeSettings(fn: (s: YouTubeAudioSettings) => void) {
  ytListeners.add(fn);
  return () => {
    ytListeners.delete(fn);
  };
}

/**
 * Initializes the YouTube IFrame API script and mounts the player in the given element ID.
 */
export function initYouTubePlayer(elementId: string, onReadyCallback?: () => void) {
  if (typeof window === 'undefined') return;

  function createPlayer() {
    if (!window.YT || !window.YT.Player) return;

    if (playerInstance) {
      try {
        playerInstance.destroy();
      } catch {
        // ignore
      }
    }

    playerInstance = new window.YT.Player(elementId, {
      height: '200',
      width: '200',
      videoId: currentYTSettings.youtubeVideoId || DEFAULT_YOUTUBE_ID,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        loop: 1,
        playlist: currentYTSettings.youtubeVideoId || DEFAULT_YOUTUBE_ID,
        playsinline: 1,
        modestbranding: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          isPlayerReady = true;
          try {
            event.target.unMute();
            const vol = getInitialVolumePercent();
            event.target.setVolume(vol > 0 ? vol : 35);
          } catch {
            // ignore
          }
          onReadyCallback?.();
          if (pendingPlay || currentYTSettings.isPlaying) {
            pendingPlay = false;
            try {
              event.target.playVideo();
            } catch {
              // ignore
            }
          }
        },
        onStateChange: (event) => {
          if (!window.YT) return;
          if (event.data === window.YT.PlayerState.PLAYING) {
            if (!currentYTSettings.isPlaying) {
              currentYTSettings.isPlaying = true;
              notifyListeners();
            }
          } else if (
            event.data === window.YT.PlayerState.PAUSED ||
            event.data === window.YT.PlayerState.UNSTARTED
          ) {
            if (currentYTSettings.isPlaying) {
              currentYTSettings.isPlaying = false;
              notifyListeners();
            }
          } else if (event.data === window.YT.PlayerState.ENDED) {
            // Infinite loop
            try {
              playerInstance?.playVideo();
            } catch {
              // ignore
            }
          }
        },
        onError: (err) => {
          console.warn('YouTube Player error:', err);
        },
      },
    });
  }

  if (window.YT && window.YT.Player) {
    createPlayer();
  } else if (!isApiLoaded) {
    isApiLoaded = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      createPlayer();
    };
  }
}

export function playYouTubeAudio() {
  currentYTSettings.isPlaying = true;
  notifyListeners();

  if (playerInstance && isPlayerReady) {
    try {
      playerInstance.unMute();
      const vol = getInitialVolumePercent();
      playerInstance.setVolume(vol > 0 ? vol : 35);
      playerInstance.playVideo();
    } catch (e) {
      console.warn('playYouTubeAudio error:', e);
    }
  } else {
    pendingPlay = true;
  }
}

export function pauseYouTubeAudio() {
  pendingPlay = false;
  currentYTSettings.isPlaying = false;
  notifyListeners();

  if (playerInstance && isPlayerReady) {
    try {
      playerInstance.pauseVideo();
    } catch {
      // ignore
    }
  }
}

export function toggleYouTubeAudio() {
  if (currentYTSettings.isPlaying) {
    pauseYouTubeAudio();
  } else {
    playYouTubeAudio();
  }
}

export function setYouTubeAudioVolume(volPercent: number) {
  const vol = Math.max(0, Math.min(100, Math.round(volPercent)));
  if (playerInstance && isPlayerReady) {
    try {
      if (vol <= 0) {
        playerInstance.mute();
      } else {
        playerInstance.unMute();
        playerInstance.setVolume(vol);
      }
    } catch {
      // ignore
    }
  }
}

export function muteYouTubeAudio(muted: boolean) {
  if (playerInstance && isPlayerReady) {
    try {
      if (muted) {
        playerInstance.mute();
      } else {
        playerInstance.unMute();
      }
    } catch {
      // ignore
    }
  }
}

// Global auto-unlock on first user interaction in case browser policy delayed autoplay
if (typeof window !== 'undefined') {
  let hasUnlocked = false;
  const unlockAudio = () => {
    if (hasUnlocked) return;
    hasUnlocked = true;
    if (currentYTSettings.bgmSource === 'youtube' && currentYTSettings.isPlaying) {
      playYouTubeAudio();
    }
  };
  window.addEventListener('click', unlockAudio, { once: true, passive: true });
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
}
