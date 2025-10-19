// src/components/HeroBanner/HeroBanner.jsx
import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide, useSwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";

import { useAppContext } from "../context/AppContext";
import { fetchTrending, fetchPopular } from "../services/tmdbApi";
import { PlayIcon } from "../components/icons"; // Create these simple SVG icons
import { Link } from "react-router-dom"; // For navigation
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

// TMDB genre ID maps (Polish)
const MOVIE_GENRES = {
  28: "Akcja",
  12: "Przygodowy",
  16: "Animacja",
  35: "Komedia",
  80: "Kryminalny",
  99: "Dokumentalny",
  18: "Dramat",
  10751: "Familijny",
  14: "Fantasy",
  36: "Historyczny",
  27: "Horror",
  10402: "Muzyczny",
  9648: "Tajemniczy",
  10749: "Romans",
  878: "Sci‑Fi",
  10770: "Film TV",
  53: "Thriller",
  10752: "Wojenny",
  37: "Western",
};

const TV_GENRES = {
  10759: "Akcja i przygoda",
  16: "Animacja",
  35: "Komedia",
  80: "Kryminalny",
  99: "Dokumentalny",
  18: "Dramat",
  10751: "Familijny",
  10762: "Dla dzieci",
  9648: "Tajemniczy",
  10763: "Wiadomości",
  10764: "Reality show",
  10765: "Sci‑Fi i fantasy",
  10766: "Telenowela",
  10767: "Talk‑show",
  10768: "Wojna i polityka",
  37: "Western",
};

const getPrimaryGenreName = (slide) => {
  const ids = slide?.genre_ids || [];
  const map = (slide?.media_type === "tv") ? TV_GENRES : MOVIE_GENRES;
  for (const id of ids) {
    if (map[id]) return map[id];
  }
  return null;
};

// Disable pointer events on inactive slides so buttons always refer to the visible (active) slide
const ActiveLayer = ({ children }) => {
  const { isActive } = useSwiperSlide() || {};
  return <div className={isActive ? '' : 'pointer-events-none'}>{children}</div>;
};

function HeroBanner() {
  const [heroSlides, setHeroSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getImageUrl, loadingConfig, apiConfig } = useAppContext();
  const [activeIndex, setActiveIndex] = useState(0);

  // Use fixed TMDB base and allow 'original' for highest quality when needed
  const safeHeroUrl = (path, size) => {
    const validSizes = ['w300', 'w780', 'w1280', 'original'];
    const chosenSize = validSizes.includes(size) ? size : 'w1280';
    return path ? `https://image.tmdb.org/t/p/${chosenSize}${path}` : `https://placehold.co/1280x720`;
  };

  useEffect(() => {
    if (loadingConfig) return; // Wait for API config

    Promise.all([fetchPopular("movie"), fetchPopular("tv")])
      .then(([moviesRes, tvRes]) => {
        const movies = (moviesRes?.data?.results || []).map((s) => ({ ...s, media_type: "movie" }));
        const tv = (tvRes?.data?.results || []).map((s) => ({ ...s, media_type: "tv" }));
        const combined = [...movies, ...tv]
          .filter(Boolean)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 10);
        setHeroSlides(combined);
        // Ensure overlay starts at the first slide
        setActiveIndex(0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch hero slides:", err);
        setLoading(false);
      });
  }, [loadingConfig]);

  if (loading || loadingConfig) {
    return (
      <div className="h-[70vh] md:h-[85vh] lg:h-screen bg-zinc-800 animate-pulse flex items-center justify-center">
        <p></p>
      </div>
    );
  }

  if (!heroSlides.length) {
    return (
      <div className="relative h-[70vh] md:h-[85vh] lg:h-screen w-full">
        <img
          src={`https://placehold.co/1280x720${import.meta.env.DEV ? `?v=${Date.now()}` : ''}`}
          alt="Placeholder hero"
          className="w-full h-full object-cover"
        />
        {/* Debug overlay in dev */}
        {import.meta.env.DEV && (
          <div className="absolute top-2 left-2 z-50 text-[10px] text-white bg-black/80 px-2 py-1 rounded">
            <div>src: https://placehold.co/1280x720</div>
            <div>Size: 1280x720</div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/30 to-transparent md:w-2/3"></div>
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full">
            <div className="px-0 pb-[30px] text-white text-left w-full">
              <div className="flex flex-col items-start gap-3 md:gap-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-left select-none cursor-default">
                  Polecane
                </h1>
                <div className="flex items-center mb-2 md:mb-4">
                  <div className="flex items-center space-x-4 text-xs md:text-sm text-brand-text-secondary select-none">
                    <span>Film</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-auto absolute right-4 md:right-6 bottom-4 md:bottom-6 z-30 flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm md:text-base cursor-pointer"
            onClick={() => alert('Add to watchlist (not implemented)')}
          >
            <PlusIcon className="w-5 h-5 flex-shrink-0" />
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white text-sm md:text-base"
          >
            <PlayIcon className="w-5 h-5 flex-shrink-0" />
            <span>Odtwórz</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] md:h-[85vh] lg:h-screen w-full max-w-full overflow-hidden">
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        modules={[Autoplay, EffectFade, Navigation]}
        pagination={false}
        navigation={{
          nextEl: ".swiper-next-hero",
          prevEl: ".swiper-prev-hero",
        }}
        effect="fade"
        onInit={(swiper) => setActiveIndex(swiper.realIndex)}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        onRealIndexChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="h-full w-full max-w-full"
      >
        {heroSlides.map((slide) => (
          <SwiperSlide key={slide.id} className="relative">
            {/** dev cache-busting to bypass stale SW/cache */}
            {/** eslint-disable-next-line no-unused-vars */}
            {(() => {})()}
            <div
              className="absolute inset-0 -z-10 bg-cover bg-center"
              style={{
                backgroundImage: `url(${safeHeroUrl(slide.backdrop_path, 'original')})`
              }}
              role="img"
              aria-label={slide.title || slide.name}
            />
            {/* Bottom gradient: responsive height for better legibility */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[180px] md:h-[240px] lg:h-[280px] z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent"></div>

            {/* Left-to-right gradient behind text block */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-full md:w-3/4 lg:w-2/3 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

            <></>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* Single overlay bound to activeIndex */}
      {heroSlides[activeIndex] && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-start">
          <div className="w-full">
            <div className="px-4 md:px-6 lg:px-8 pt-[80px] md:pt-[120px] lg:pt-[145px] pb-8 md:pb-12 lg:pb-16 text-white text-left w-full">
              <div className="max-w-[min(92vw,1100px)] md:max-w-4xl lg:max-w-5xl flex flex-col items-start gap-1.5 md:gap-2 min-w-[280px]">
                <h1 className="text-2xl md:text-3xl lg:text-4xl leading-tight font-bold text-left select-none cursor-default break-words">
                  {heroSlides[activeIndex].title || heroSlides[activeIndex].name}
                </h1>
                <div className="flex items-center mb-1">
                  <div className="flex items-center space-x-3 text-xs md:text-sm text-brand-text-secondary select-none">
                    <span>{getPrimaryGenreName(heroSlides[activeIndex]) || (heroSlides[activeIndex].media_type === 'tv' ? 'Serial' : 'Film')}</span>
                    <span>
                      {new Date(
                        heroSlides[activeIndex].release_date || heroSlides[activeIndex].first_air_date
                      ).getFullYear()}
                    </span>
                  </div>
                </div>
                <div className="pointer-events-auto flex items-center gap-1.5 md:gap-2 mt-0.5">
                  <Link
                    to={`/watch/${heroSlides[activeIndex].media_type || "movie"}/${heroSlides[activeIndex].id}`}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/70 text-black hover:bg-white/60 text-xs md:text-sm"
                  >
                    <PlayIcon className="w-5 h-5 flex-shrink-0" />
                    <span>Odtwórz</span>
                  </Link>
                  <Link
                    to={`/${heroSlides[activeIndex].media_type || "movie"}/${heroSlides[activeIndex].id}`}
                    aria-label="Więcej informacji"
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-zinc-700/60 text-white hover:bg-zinc-600/70 text-xs md:text-sm backdrop-blur-sm border border-white/10"
                  >
                    <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* nav already rendered above */}
    </div>
  );
}

export default HeroBanner;
