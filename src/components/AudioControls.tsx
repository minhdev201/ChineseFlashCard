import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Music,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  X,
  Youtube,
  Sparkles,
  Link2,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';
import {
  getAudioSettings,
  updateAudioSettings,
  subscribeAudioSettings,
  playCardClickSound,
  startBGM,
  stopBGM,
} from '@/lib/soundEffects';
import {
  getYouTubeSettings,
  updateYouTubeSettings,
  subscribeYouTubeSettings,
  playYouTubeAudio,
  pauseYouTubeAudio,
  extractYouTubeVideoId,
  YOUTUBE_PRESETS,
  type YouTubeAudioSettings,
} from '@/lib/youtubePlayer';

interface AudioControlsProps {
  variant?: 'compact' | 'full';
  className?: string;
  isBgmPlaying?: boolean;
}

export function AudioControls({ variant = 'compact', className = '', isBgmPlaying = false }: AudioControlsProps) {
  const [settings, setSettings] = useState(getAudioSettings);
  const [ytSettings, setYtSettings] = useState<YouTubeAudioSettings>(getYouTubeSettings);
  const [showPanel, setShowPanel] = useState(false);
  const [inputUrl, setInputUrl] = useState(ytSettings.youtubeUrl);
  const [urlError, setUrlError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  useEffect(() => {
    const unsubAudio = subscribeAudioSettings(setSettings);
    const unsubYT = subscribeYouTubeSettings((newYt) => {
      setYtSettings(newYt);
      setInputUrl(newYt.youtubeUrl);
    });

    return () => {
      unsubAudio();
      unsubYT();
    };
  }, []);

  const toggleBgm = () => {
    playCardClickSound();
    updateAudioSettings({ bgmMuted: !settings.bgmMuted });
  };

  const toggleSfx = () => {
    const nextMuted = !settings.sfxMuted;
    updateAudioSettings({ sfxMuted: nextMuted });
    if (!nextMuted) {
      playCardClickSound();
    }
  };

  const togglePanel = () => {
    if (!showPanel && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const rightPos = Math.max(16, window.innerWidth - rect.right);
      const adjustedRight = Math.min(rightPos, window.innerWidth - popupWidth - 16);

      setCoords({
        top: rect.bottom + 8,
        right: Math.max(16, adjustedRight),
      });
    }
    setShowPanel((p) => !p);
  };

  const handleBgmVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateAudioSettings({ bgmVolume: val, bgmMuted: val === 0 });
  };

  const handleSfxVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateAudioSettings({ sfxVolume: val, sfxMuted: val === 0 });
  };

  const handleSourceChange = (source: 'synth' | 'youtube') => {
    playCardClickSound();
    if (source === 'youtube') {
      stopBGM();
      if (settings.bgmMuted) {
        updateAudioSettings({ bgmMuted: false });
      }
      updateYouTubeSettings({ bgmSource: 'youtube', isPlaying: true });
      playYouTubeAudio();
    } else {
      pauseYouTubeAudio();
      updateYouTubeSettings({ bgmSource: 'synth', isPlaying: false });
      if (settings.bgmMuted) {
        updateAudioSettings({ bgmMuted: false });
      }
      startBGM();
    }
  };

  const handleApplyCustomUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUrlError('');

    const extractedId = extractYouTubeVideoId(inputUrl);
    if (!extractedId) {
      setUrlError('Link YouTube không hợp lệ. Vui lòng nhập link chuẩn (vd: https://youtube.com/watch?v=...)');
      return;
    }

    const matchedPreset = YOUTUBE_PRESETS.find((p) => p.id === extractedId);
    const trackName = matchedPreset ? matchedPreset.name : 'Nhạc YouTube tùy chỉnh';

    stopBGM();
    if (settings.bgmMuted) {
      updateAudioSettings({ bgmMuted: false });
    }

    updateYouTubeSettings({
      bgmSource: 'youtube',
      youtubeUrl: inputUrl.trim(),
      youtubeVideoId: extractedId,
      trackName,
      isPlaying: true,
    });

    playYouTubeAudio();
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 2000);
  };

  const handleSelectPreset = (preset: typeof YOUTUBE_PRESETS[0]) => {
    playCardClickSound();
    const videoId = extractYouTubeVideoId(preset.url) || preset.id;
    setInputUrl(preset.url);
    setUrlError('');

    stopBGM();
    if (settings.bgmMuted) {
      updateAudioSettings({ bgmMuted: false });
    }

    updateYouTubeSettings({
      bgmSource: 'youtube',
      youtubeUrl: preset.url,
      youtubeVideoId: videoId,
      trackName: preset.name,
      isPlaying: true,
    });

    playYouTubeAudio();
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 2000);
  };

  const isYouTubeMode = ytSettings.bgmSource === 'youtube';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* BGM Toggle Button */}
      <button
        type="button"
        onClick={toggleBgm}
        title={settings.bgmMuted ? 'Bật nhạc nền' : 'Tắt nhạc nền'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none ${
          !settings.bgmMuted
            ? isYouTubeMode
              ? 'bg-rose-50 border-rose-200/80 text-rose-700 shadow-sm hover:bg-rose-100'
              : 'bg-indigo-50 border-indigo-200/80 text-indigo-700 shadow-sm hover:bg-indigo-100'
            : 'bg-white/80 border-slate-200/80 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        {isYouTubeMode ? (
          <Youtube className={`w-3.5 h-3.5 ${!settings.bgmMuted && isBgmPlaying ? 'animate-pulse text-rose-600' : ''}`} />
        ) : (
          <Music className={`w-3.5 h-3.5 ${!settings.bgmMuted && isBgmPlaying ? 'animate-bounce text-indigo-600' : ''}`} />
        )}
        <span className="hidden sm:inline">{isYouTubeMode ? 'YouTube BGM' : 'Nhạc'}</span>
        {!settings.bgmMuted && isBgmPlaying && (
          <span className="flex items-center gap-0.5 ml-0.5">
            <span
              className={`w-0.5 h-2 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ animationDuration: '0.6s' }}
            />
            <span
              className={`w-0.5 h-3 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ animationDuration: '0.4s' }}
            />
            <span
              className={`w-0.5 h-1.5 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ animationDuration: '0.8s' }}
            />
          </span>
        )}
      </button>

      {/* SFX Toggle Button */}
      <button
        type="button"
        onClick={toggleSfx}
        title={settings.sfxMuted ? 'Bật hiệu ứng âm thanh' : 'Tắt hiệu ứng âm thanh'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all select-none ${
          !settings.sfxMuted
            ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700 shadow-sm hover:bg-emerald-100'
            : 'bg-white/80 border-slate-200/80 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        {!settings.sfxMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Hiệu ứng</span>
      </button>

      {/* Settings Panel Toggle Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePanel}
        title="Cài đặt nguồn nhạc & âm lượng"
        className={`p-1.5 rounded-xl border transition-all ${
          showPanel
            ? 'bg-slate-200/90 text-slate-800 border-slate-300 shadow-inner'
            : 'bg-white/80 text-slate-500 border-slate-200/80 hover:bg-slate-100'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </button>

      {/* Popover Settings Panel (rendered via Portal) */}
      {showPanel &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-slate-900/10 backdrop-blur-[1px]"
              onClick={() => setShowPanel(false)}
            />
            <div
              style={{
                top: `${coords.top}px`,
                right: `${coords.right}px`,
              }}
              className="fixed w-80 max-w-[calc(100vw-32px)] bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/90 z-[9999] animate-in fade-in zoom-in-95 duration-150 space-y-3.5 text-xs text-slate-700 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-2.5">
                <span className="flex items-center gap-1.5 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                  Cài đặt Âm thanh & Nhạc nền
                </span>
                <button
                  type="button"
                  onClick={() => setShowPanel(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source Mode Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Nguồn nhạc nền (BGM)
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => handleSourceChange('synth')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      !isYouTubeMode
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Nhạc Game Mặc định
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSourceChange('youtube')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      isYouTubeMode
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5 text-rose-500" />
                    Từ YouTube
                  </button>
                </div>
              </div>

              {/* YouTube Config Section (when YouTube source is active) */}
              {isYouTubeMode && (
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2.5 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-rose-900 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-rose-500" />
                      Dán Link hoặc Video ID YouTube:
                    </label>
                    <form onSubmit={handleApplyCustomUrl} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={inputUrl}
                        onChange={(e) => {
                          setInputUrl(e.target.value);
                          setUrlError('');
                        }}
                        className="flex-1 min-w-0 px-2.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-sm"
                      >
                        Áp dụng
                      </button>
                    </form>
                    {urlError && <p className="text-[10px] text-rose-600 font-medium leading-tight">{urlError}</p>}
                    {applySuccess && (
                      <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã cập nhật nhạc YouTube thành công!
                      </p>
                    )}
                  </div>

                  {/* YouTube Curated Presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Gợi ý nhạc nền hay:
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {YOUTUBE_PRESETS.map((preset) => {
                        const isCurrent = ytSettings.youtubeVideoId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-1.5 text-left rounded-lg text-[11px] border transition-all truncate flex items-center gap-1 ${
                              isCurrent
                                ? 'bg-rose-100/80 border-rose-300 text-rose-900 font-semibold'
                                : 'bg-white/80 border-slate-200/80 text-slate-700 hover:bg-white hover:border-rose-200'
                            }`}
                          >
                            <Play className={`w-2.5 h-2.5 shrink-0 ${isCurrent ? 'text-rose-600 fill-current' : 'text-slate-400'}`} />
                            <span className="truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Sliders */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                {/* BGM Volume Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      {isYouTubeMode ? (
                        <Youtube className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      Âm lượng Nhạc nền
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {settings.bgmMuted ? 'Đang tắt' : `${Math.round((settings.bgmVolume / 0.8) * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.02"
                    value={settings.bgmMuted ? 0 : settings.bgmVolume}
                    onChange={handleBgmVolume}
                    className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${
                      isYouTubeMode ? 'accent-rose-600' : 'accent-indigo-600'
                    }`}
                  />
                </div>

                {/* SFX Volume Slider */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                      Âm lượng Hiệu ứng (SFX)
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {settings.sfxMuted ? 'Đang tắt' : `${Math.round(settings.sfxVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxMuted ? 0 : settings.sfxVolume}
                    onChange={handleSfxVolume}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
