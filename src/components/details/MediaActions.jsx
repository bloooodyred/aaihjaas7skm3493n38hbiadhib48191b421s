import React from 'react';
import { PlayIcon, PlusIcon } from '@heroicons/react/24/outline';

const MediaActions = ({ onPlayStream, onPlayTrailer, hasStreamUrl }) => {
  return (
    <div className="flex items-center flex-wrap gap-3 md:gap-4 lg:mt-4">
      <button
        onClick={onPlayStream}
        className="bg-red-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-md font-semibold flex items-center space-x-2 hover:bg-red-500 transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!hasStreamUrl}
      >
        <PlayIcon className="w-5 h-5" />
        <span>Odtwórz</span>
      </button>
      
      <button
        className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 md:px-6 md:py-2.5 rounded-md font-semibold flex items-center space-x-2 hover:bg-white/20 transition-colors text-sm md:text-base"
        onClick={() => alert('Add to watchlist (not implemented)')}
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MediaActions;