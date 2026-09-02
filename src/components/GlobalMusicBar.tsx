import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Youtube,
  Sparkles,
  Link2,
  Check,
  X,
  Disc,
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
  toggleYouTubeAudio,
  playYouTubeAudio,
  pauseYouTubeAudio,
  extractYouTubeVideoId,
  YOUTUBE_PRESETS,
  type YouTubeAudioSettings,
} from '@/lib/youtubePlayer';

export function GlobalMusicBar() {
  const [settings, setSettings] = useState(getAudioSettings);
  const [ytSettings, setYtSettings] = useState<YouTubeAudioSettings>(getYouTubeSettings);
  const [showPanel, setShowPanel] = useState(false);
  const [inputUrl, setInputUrl] = useState(ytSettings.youtubeUrl);
  const [urlError, setUrlError] = useState('');
  const [applySuccess, setApplySuccess] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number; bottom?: number; left?: number }>({
    top: 0,
    right: 0,
  });

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

  const isYouTubeMode = ytSettings.bgmSource === 'youtube';
  const isPlaying = isYouTubeMode ? ytSettings.isPlaying : !settings.bgmMuted;

  const handleTogglePlay = () => {
    playCardClickSound();
    if (isYouTubeMode) {
      toggleYouTubeAudio();
    } else {
      if (settings.bgmMuted) {
        updateAudioSettings({ bgmMuted: false });
        startBGM();
      } else {
        updateAudioSettings({ bgmMuted: true });
        stopBGM();
      }
    }
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
      setUrlError('Link YouTube không hợp lệ. Vui lòng kiểm tra lại!');
      return;
    }

    // Try to find if it matches a preset name, else default
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

  const togglePanel = () => {
    if (!showPanel && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const rightPos = Math.max(16, window.innerWidth - rect.right);
      const adjustedRight = Math.min(rightPos, window.innerWidth - popupWidth - 16);

      setCoords({
        top: Math.max(16, rect.top - 420),
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

  return (
    <div className="bg-slate-950/70 rounded-2xl p-3 border border-slate-800 text-slate-200">
      <div className="flex items-center justify-between gap-2.5">
        {/* Disc / Icon & Track Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isPlaying
                ? isYouTubeMode
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isYouTubeMode ? (
              <Youtube className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
            ) : (
              <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isYouTubeMode ? 'YouTube BGM' : 'Nhạc Game'}
              </span>
              {isPlaying && (
                <span className="flex items-center gap-0.5">
                  <span className={`w-0.5 h-2 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                  <span className={`w-0.5 h-3 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                  <span className={`w-0.5 h-1.5 rounded-full animate-pulse ${isYouTubeMode ? 'bg-rose-400' : 'bg-indigo-400'}`} />
                </span>
              )}
            </div>
            <p
              className="text-xs font-semibold text-slate-200 truncate leading-tight mt-0.5"
              title={isYouTubeMode ? ytSettings.trackName : 'Giai điệu ngũ cung thư giãn'}
            >
              {isYouTubeMode ? ytSettings.trackName : 'Giai điệu ngũ cung'}
            </p>
          </div>
        </div>

        {/* Action Buttons: Play/Pause & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? isYouTubeMode
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <button
            ref={buttonRef}
            type="button"
            onClick={togglePanel}
            title="Đổi bài / Dán link YouTube / Chỉnh âm lượng"
            className={`p-2 rounded-xl border transition-all ${
              showPanel
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Modal / Popover */}
      {showPanel &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] bg-slate-950/40 backdrop-blur-[2px]"
              onClick={() => setShowPanel(false)}
            />
            <div
              style={{
                top: `${coords.top}px`,
                right: `${coords.right}px`,
              }}
              className="fixed w-84 max-w-[calc(100vw-32px)] bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-700 z-[9999] animate-in fade-in zoom-in-95 duration-150 space-y-3.5 text-xs text-slate-300 max-h-[85vh] overflow-y-auto text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between font-bold text-white border-b border-slate-800 pb-2.5">
                <span className="flex items-center gap-1.5 text-sm">
                  <Music className="w-4 h-4 text-indigo-400" />
                  Nhạc Nền Toàn Website
                </span>
                <button
                  type="button"
                  onClick={() => setShowPanel(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Source Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nguồn phát nhạc nền
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSourceChange('synth')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      !isYouTubeMode
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Nhạc Game Mặc định
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSourceChange('youtube')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                      isYouTubeMode
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    Từ YouTube
                  </button>
                </div>
              </div>

              {/* YouTube Configuration */}
              {isYouTubeMode && (
                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-900/40 space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-rose-400" />
                      Dán Link YouTube phát liên tục:
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
                        className="flex-1 min-w-0 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold rounded-lg text-xs transition-colors shrink-0 shadow-sm"
                      >
                        Phát
                      </button>
                    </form>
                    {urlError && <p className="text-[10px] text-rose-400 font-medium leading-tight">{urlError}</p>}
                    {applySuccess && (
                      <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đang phát nhạc YouTube thành công!
                      </p>
                    )}
                  </div>

                  {/* YouTube Presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Chọn nhanh bản nhạc hay:
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
                                ? 'bg-rose-900/60 border-rose-500/60 text-white font-semibold'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Play className={`w-2.5 h-2.5 shrink-0 ${isCurrent ? 'text-rose-400 fill-current' : 'text-slate-500'}`} />
                            <span className="truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Volume Slider Section */}
              <div className="space-y-3 pt-1 border-t border-slate-800">
                {/* BGM Volume */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      {isYouTubeMode ? (
                        <Youtube className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      Âm lượng Nhạc nền
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {settings.bgmMuted ? 'Tắt' : `${Math.round((settings.bgmVolume / 0.8) * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.02"
                    value={settings.bgmMuted ? 0 : settings.bgmVolume}
                    onChange={handleBgmVolume}
                    className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
                      isYouTubeMode ? 'accent-rose-500' : 'accent-indigo-500'
                    }`}
                  />
                </div>

                {/* SFX Volume */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      Âm lượng Hiệu ứng (SFX)
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {settings.sfxMuted ? 'Tắt' : `${Math.round(settings.sfxVolume * 100)}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.sfxMuted ? 0 : settings.sfxVolume}
                    onChange={handleSfxVolume}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
