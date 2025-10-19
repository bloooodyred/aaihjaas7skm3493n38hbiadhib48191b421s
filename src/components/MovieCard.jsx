// src/components/MovieCard/MovieCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { StarIcon } from './icons';
import { ClockIcon } from '@heroicons/react/24/outline';

const MOVIE_GENRES = {
  28: 'Akcja', 12: 'Przygodowy', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny', 14: 'Fantasy', 36: 'Historyczny', 27: 'Horror', 10402: 'Muzyczny',
  9648: 'Tajemniczy', 10749: 'Romans', 878: 'Sci‑Fi', 10770: 'Film TV', 53: 'Thriller',
  10752: 'Wojenny', 37: 'Western'
};
const TV_GENRES = {
  10759: 'Akcja i przygoda', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat',
  10751: 'Familijny', 10762: 'Dla dzieci', 9648: 'Tajemniczy', 10763: 'Wiadomości', 10764: 'Reality show', 10765: 'Sci‑Fi i fantasy',
  10766: 'Telenowela', 10767: 'Talk‑show', 10768: 'Wojna i polityka', 37: 'Western'
};

const MovieCard = ({ item, mediaType, rank, hoverScaleClass = 'group-hover:scale-110', hideRatingOnHover = false, showTypeOnHover = false, showTypeBottomRightOnHover = false, disableGenreBadge = false, markReleasedAsWaiting = false }) => {
  const { getImageUrl } = useAppContext();
  const type = mediaType || item.media_type; // item.media_type comes from trending/multi-search

  if (!item) return null;

  const handleImageError = (e) => {
    e.target.onerror = null; // Prevents future error triggers for this img
    e.target.src = 'https://placehold.co/400x600';
  };

  const rating = typeof item.vote_average === 'number' && !isNaN(item.vote_average)
    ? item.vote_average.toFixed(1)
    : '—';

  const getPrimaryGenreName = () => {
    const ids = Array.isArray(item?.genre_ids) ? item.genre_ids : [];
    const type = (mediaType || item.media_type) === 'tv' ? 'tv' : 'movie';
    const map = type === 'tv' ? TV_GENRES : MOVIE_GENRES;

    if (!ids.length) return null;

    // Preferuj pierwszy gatunek różny od Animacji (id: 16)
    const firstNonAnimationId = ids.find((id) => id !== 16 && map[id]);
    if (firstNonAnimationId) return map[firstNonAnimationId];

    // Jeśli dostępna jest tylko Animacja, pokaż ją
    if (ids.includes(16) && map[16]) return map[16];

    // W przeciwnym razie pierwszy dostępny z mapy
    const firstAvailable = ids.find((id) => map[id]);
    return firstAvailable ? map[firstAvailable] : null;
  };
  const genreName = getPrimaryGenreName();
  const todayStr = new Date().toISOString().slice(0, 10);
  const releaseDateStr = (item?.release_date || item?.first_air_date || '') + '';
  const isReleased = releaseDateStr && releaseDateStr <= todayStr;
  const rel = releaseDateStr ? new Date(releaseDateStr) : null;
  const today = new Date(todayStr);
  const diffDays = rel ? Math.floor((today - rel) / (1000 * 60 * 60 * 24)) : null;
  // Czerwony zegar: dzień premiery (0) oraz dzień później (1)
  const isWaiting = markReleasedAsWaiting && isReleased && (diffDays === 0 || diffDays === 1);
  // Zielony badge "nowość": od dnia 2 do dnia 6 po premierze (2,3,4,5,6)
  const isNewSeven = isReleased && diffDays >= 2 && diffDays <= 6;
  // Wyklucz określone tytuły (np. Black Phone) z odznak
  const titleLower = ((item?.title || item?.name || '') + '').toLowerCase();
  const excludeBadges = titleLower.includes('black phone');
  const showWaiting = isWaiting && !excludeBadges;
  const showNewSeven = !isWaiting && isNewSeven && !excludeBadges;

  return (
    <Link to={`/${type}/${item.id}`} className="block group">
      {/* Outer scaling wrapper keeps rounded corners intact */}
      <div className={`relative rounded-lg transform-gpu transition-transform duration-300 ${hoverScaleClass} hover:shadow-2xl z-0 group-hover:z-20`}>
        {/* Inner masked container defines aspect and rounded clipping */}
        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-brand-card shadow-lg">
          {typeof rank === 'number' && (
            <div className="absolute -left-4 md:-left-5 top-2 md:top-2 z-0 text-4xl md:text-5xl lg:text-6xl font-extrabold text-zinc-800/80 select-none">
              {rank}
            </div>
          )}
          <img
            src={getImageUrl(item.poster_path, 'w500') || 'https://placehold.co/400x600'}
            alt={item.title || item.name}
            className="absolute inset-0 w-full h-full object-cover transform scale-[1.02]"
            onError={handleImageError}
            loading="lazy"
          />
          {genreName && !disableGenreBadge && (
            <div className="genre-badge absolute top-1.5 left-1.5 z-20 bg-zinc-800/90 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span>{genreName}</span>
            </div>
          )}
          {/* Rating usunięty globalnie */}
          {showTypeOnHover && (
            <>
              {/* Rating na hover usunięty */}
              <div className={`absolute top-1.5 right-1.5 z-20 bg-zinc-800/90 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-1 transition-opacity duration-200 pointer-events-none ${hideRatingOnHover ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-0'}`}>
                <span>{(mediaType || item.media_type) === 'tv' ? 'Serial' : 'Film'}</span>
              </div>
            </>
          )}
          {showWaiting && (
            <div className="absolute top-1.5 right-1.5 z-20 bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-1 pointer-events-none transition-opacity duration-200 opacity-100 group-hover:opacity-0">
              <ClockIcon className="w-3.5 h-3.5" />
            </div>
          )}
          {showNewSeven && (
            <div className="absolute top-1.5 right-1.5 z-20 bg-green-400 text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md pointer-events-none transition-opacity duration-200 opacity-100 group-hover:opacity-0">
              new
            </div>
          )}
          {showTypeBottomRightOnHover && (
            <div className="absolute bottom-1.5 right-1.5 z-20 bg-zinc-800/90 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span>{type === 'tv' ? 'Serial' : 'Film'}</span>
            </div>
          )}
          {/* Tytuł usunięty na prośbę użytkownika */}
        </div>
      </div>
      {/* If you want title below the card instead of overlay */}
      {/* <h3 className="mt-2 text-sm font-medium text-brand-text-primary truncate group-hover:text-brand-yellow">
        {item.title || item.name}
      </h3>
      <p className="text-xs text-brand-text-secondary">
        {new Date(item.release_date || item.first_air_date).getFullYear()}
      </p> */}
    </Link>
  );
};

export default MovieCard;
