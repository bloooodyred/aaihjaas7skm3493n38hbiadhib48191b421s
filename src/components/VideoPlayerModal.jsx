// src/components/VideoPlayerModal/VideoPlayerModal.jsx
import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const VideoPlayerModal = ({ videoKey, isOpen, onClose }) => {
  if (!isOpen || !videoKey) return null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Compute pixel-perfect size to avoid "strip" effect
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const R = 16 / 9;
    const recompute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const heightLimit = vh * 0.99; // keep a small margin to edges
      const widthFitHeight = (vw * 0.98) / R; // taller when constrained by width
      const minTall = vh * 0.93; // ensure much taller on ultrawide
      const h = Math.min(heightLimit, Math.max(minTall, widthFitHeight));
      const w = h * R;
      setSize({ width: w, height: h });
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, []);
  const containerStyle = { width: `${size.width}px`, height: `${size.height}px` };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-0" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      {/* Modal container */}
      <div
        className="relative bg-black/10 overflow-hidden"
        style={containerStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 z-10 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors shadow-md"
          aria-label="Close video player"
        >
          <XMarkIcon className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${videoKey}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          frameBorder="0"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 w-full h-full"
          style={{ transform: 'translateZ(0)' }}
        />
      </div>
    </div>
  );
};

export default VideoPlayerModal;
