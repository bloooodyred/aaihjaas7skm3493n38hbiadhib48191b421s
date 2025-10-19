// MediaInfo.jsx
import React from 'react';
 
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import RatingCircle from '../RatingCircle';
import MediaActions from './MediaActions';

// Simple PL genre maps for details view (fallback to original name)
const MOVIE_GENRES_PL = {
  28: 'Akcja', 12: 'Przygodowy', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny', 14: 'Fantasy', 36: 'Historyczny', 27: 'Horror', 10402: 'Muzyczny', 9648: 'Tajemniczy', 10749: 'Romans', 878: 'Sci‑Fi', 10770: 'Film TV', 53: 'Thriller', 10752: 'Wojenny', 37: 'Western'
};
const TV_GENRES_PL = {
  10759: 'Akcja i przygoda', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny', 10762: 'Dla dzieci', 9648: 'Tajemniczy', 10763: 'Wiadomości', 10764: 'Reality show', 10765: 'Sci‑Fi i fantasy', 10766: 'Telenowela', 10767: 'Talk‑show', 10768: 'Wojna i polityka', 37: 'Western'
};

const translateGenreName = (genre, mediaType) => {
  if (!genre || typeof genre.id !== 'number') return genre?.name || '';
  const map = (mediaType === 'tv') ? TV_GENRES_PL : MOVIE_GENRES_PL;
  return map[genre.id] || genre.name || '';
};

const seasonLabelPl = (n) => {
  if (n === 1) return 'sezon';
  if ([2,3,4].includes(n % 100 >= 10 && n % 100 <= 20 ? 0 : n % 10)) return 'sezony';
  // fallback
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return 'sezony';
  return 'sezonów';
};

const MediaInfo = ({ 
  posterPath, 
  title, 
  tagline, 
  genres, 
  mediaType,
  voteAverage, 
  releaseDate, 
  runtime, 
  numberOfSeasons,
  overview,
  onPlayStream,
  onPlayTrailer,
  hasStreamUrl,
  onImageError,
  inHeader = false,
}) => {
  const rootCardClass = inHeader
    ? 'relative z-20 flex flex-col md:flex-row gap-4 md:gap-6 bg-black/40 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/10 overflow-hidden'
    : 'relative z-20 -mt-[95px] md:-mt-[335px] flex flex-col md:flex-row gap-6 md:gap-10 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10 overflow-hidden';
  return (
    <div className={rootCardClass}>
      <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 md:-mt-8">
        <img
          src={posterPath}
          alt={`${title} poster`}
          className="rounded-xl shadow-2xl w-[60%] md:w-full mx-auto md:mx-0 object-cover aspect-[2/3]"
          onError={onImageError}
        />
      </div>

      <div className="md:w-2/3 lg:w-3/4 pt-0 md:pt-2 mt-4 lg:mt-0 md:mt-0">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">
          {title}
        </h1>
        {tagline && (
          <p className="text-md md:text-lg text-brand-text-secondary italic mb-3 md:mb-4">
            {tagline}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-5">
          {genres?.map((genre) => (
            <span
              key={genre.id}
              className="bg-zinc-700 text-xs md:text-sm px-3 py-1 rounded-full text-white cursor-default pointer-events-none"
            >
              {translateGenreName(genre, mediaType)}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-4 md:space-x-6 mb-4 md:mb-6">
          {voteAverage > 0 && <RatingCircle rating={voteAverage} size={60} />}
          <div className="flex flex-col space-y-1">
            {releaseDate && (
              <span className="text-sm text-brand-text-secondary flex items-center">
                <CalendarDaysIcon className="w-4 h-4 mr-1.5" />
                {new Date(releaseDate).toLocaleDateString("pl-PL", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            <span className="text-sm text-brand-text-secondary flex items-center">
              <ClockIcon className="w-4 h-4 mr-1.5" />
              {mediaType === "tv"
                ? (
                    runtime && runtime > 0
                      ? `${runtime} min • średni czas odcinka`
                      : null
                  )
                : (runtime != null ? `${runtime} min` : null)
              }
              {mediaType === "tv" && numberOfSeasons ? ` • ${numberOfSeasons} ${seasonLabelPl(Number(numberOfSeasons))}` : ''}
            </span>
          </div>
        </div>

        {overview && (
          <p className="text-sm md:text-base text-brand-text-secondary leading-relaxed mb-6 md:mb-8">
            {overview}
          </p>
        )}
        <MediaActions
          onPlayStream={onPlayStream}
          onPlayTrailer={onPlayTrailer}
          hasStreamUrl={hasStreamUrl}
        />
      </div>
    </div>
  );
};

export default MediaInfo;