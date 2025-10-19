import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/solid";

const TrailerPlayer = ({ videoKey, title }) => {
  const iframeRef = useRef(null);
  const playerContainerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [stopped, setStopped] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isVolumeHover, setIsVolumeHover] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const trailerSrc = useMemo(() => {
    if (!videoKey) return null;
    const base = `https://www.youtube.com/embed/${videoKey}`;
    const params = new URLSearchParams({
      rel: "0",
      controls: "0",
      modestbranding: "1",
      playsinline: "1",
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: videoKey,
      enablejsapi: "1",
      disablekb: "1",
      fs: "0",
      iv_load_policy: "3",
      showinfo: "0",
      cc_load_policy: "0",
      hl: "pl",
      vq: "hd1080",
    });
    if (origin) {
      params.set("origin", origin);
    }
    return `${base}?${params.toString()}`;
  }, [videoKey, origin]);

  useEffect(() => {
    setMuted(true);
    setStopped(false);
    setPlayerReady(false);
  }, [videoKey]);

  const sendPlayerCommand = useCallback((func, args = []) => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  }, []);

  useEffect(() => {
    if (!playerReady) return;
    if (stopped) {
      sendPlayerCommand("pauseVideo");
    } else {
      sendPlayerCommand("playVideo");
    }
  }, [playerReady, stopped, sendPlayerCommand]);

  useEffect(() => {
    if (!playerReady) return;
    if (muted) {
      sendPlayerCommand("mute");
    } else {
      sendPlayerCommand("unMute");
      sendPlayerCommand("setVolume", [volume]);
    }
  }, [playerReady, muted, volume, sendPlayerCommand]);

  const handleIframeLoad = useCallback(() => {
    setPlayerReady(true);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerContainerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleStop = useCallback(() => {
    setStopped((prev) => {
      const next = !prev;
      if (!next) {
        setMuted(false);
      }
      return next;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  const handleRestart = useCallback(() => {
    sendPlayerCommand("seekTo", [0, true]);
    sendPlayerCommand("playVideo");
    if (muted) {
      sendPlayerCommand("unMute");
      sendPlayerCommand("setVolume", [100]);
      setMuted(false);
    }
    setStopped(false);
  }, [muted, sendPlayerCommand]);

  const handleVolumeChange = useCallback((event) => {
    const value = Number(event.target.value);
    setVolume(value);
    if (!muted) {
      sendPlayerCommand("setVolume", [value]);
    }
  }, [muted, sendPlayerCommand]);

  const handleToggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (document.fullscreenElement === container) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    } else if (container.requestFullscreen) {
      container.requestFullscreen();
    }
  }, []);

  if (!videoKey || !trailerSrc) {
    return null;
  }

  return (
    <div className="flex justify-center lg:justify-start lg:w-[560px] group/trailer">
      <div
        ref={playerContainerRef}
        className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl"
        style={{ width: "560px", height: "315px" }}
      >
        <iframe
          ref={iframeRef}
          src={trailerSrc}
          title={`${title} trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: "100%", height: "100%" }}
          onLoad={handleIframeLoad}
        />
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/trailer:opacity-100">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1"></div>
            <div className="h-28 bg-gradient-to-t from-black/70 via-black/35 to-transparent"></div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-end justify-between pb-4 px-4 opacity-0 transition-opacity duration-300 group-hover/trailer:opacity-100">
          <div className="pointer-events-auto flex gap-2">
            <button
              type="button"
              onClick={handleToggleStop}
              className={`w-12 px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center justify-center ${stopped ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-white/15 text-white hover:bg-white/30'}`}
            >
              {stopped ? "Odtwórz" : "Stop"}
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="w-12 px-3 py-1 rounded-full text-xs transition-colors bg-white/15 text-white hover:bg-white/30 flex items-center justify-center"
              title="Restart"
            >
              <ArrowPathIcon className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="pointer-events-auto flex gap-2">
            <div
              className="relative"
              onMouseEnter={() => setIsVolumeHover(true)}
              onMouseLeave={() => setIsVolumeHover(false)}
            >
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-12 px-2 py-1 rounded-full text-[10px] font-semibold transition-colors bg-white/15 text-white hover:bg-white/30 flex items-center justify-center"
              >
                {muted ? (
                  <SpeakerXMarkIcon className="w-3.5 h-3.5 text-white" />
                ) : (
                  <SpeakerWaveIcon className="w-3.5 h-3.5 text-white" />
                )}
              </button>
              {(isVolumeHover || !muted) && (
                <div
                  className={`absolute top-1/2 right-full -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-1 shadow-lg backdrop-blur-sm transition-opacity duration-150 ${isVolumeHover ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                  <span className="text-[10px] text-white/80">{volume}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="h-1 w-16"
                    style={{ accentColor: '#ffffff' }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="w-12 px-3 py-1 rounded-full text-xs transition-colors bg-white/15 text-white hover:bg-white/30 flex items-center justify-center"
              title={isFullscreen ? "Zamknij pełny ekran" : "Pełny ekran"}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-4 h-4 text-white" />
              ) : (
                <ArrowsPointingOutIcon className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerPlayer;
