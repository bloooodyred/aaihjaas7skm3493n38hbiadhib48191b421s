// src/components/ContentRow/ContentRow.jsx
import React, { useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import MovieCard from './MovieCard';
import useFetch from '../hooks/useFetch';
import { useAppContext } from '../context/AppContext';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const ContentRow = ({
  title,
  fetchFunction,
  apiParams = [],
  mediaType,
  limit,
  showRank = false,
  slideWidthClass,
  spaceBetween = 16,
  titleClass,
  showRankInGap = false,
  gapSlideWidthClass = "!w-[48px]",
  posterOverlapClass = "",
  hideRatingOnHover = false,
  showTypeOnHover = false,
  hoverScaleClass,
  showTypeBottomRightOnHover = false,
  disableGenreBadge = false,
  markReleasedAsWaiting = true,
  showEdgeFade = true,
  edgeFadeLeft = true,
  edgeFadeRight = true,
  edgeFadeLeftClass = "pointer-events-none absolute top-[-12px] bottom-[-12px] left-[-20px] w-18 sm:w-24 bg-gradient-to-r from-black/85 via-black/50 to-transparent z-30",
  edgeFadeRightClass = "pointer-events-none absolute top-[-12px] bottom-[-12px] right-[-40px] w-22 sm:w-30 bg-gradient-to-l from-black/85 via-black/50 to-transparent z-30",
}) => {
  const { loadingConfig } = useAppContext();
  const { data, loading, error } = useFetch(fetchFunction, ...apiParams);
  const swiperRef = useRef(null);
  if (loadingConfig || loading) {
    return (
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-brand-yellow">
          {title}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] bg-brand-card rounded-lg animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <p>
          Error loading {title}: {error}
        </p>
      </div>
    );
  }

  let items = data?.results || [];
  if (limit && Number.isInteger(limit)) {
    items = items.slice(0, limit);
  }
  if (!items.length) {
    return (
      <div className="mb-8 md:mb-12 relative overflow-visible px-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className={(titleClass || "text-xl md:text-2xl font-semibold")}>
            {title}
          </h2>
        </div>
        <div className="px-6 text-sm text-zinc-400">No items to display.</div>
      </div>
    );
  }

  return (
    <div className="mb-8 md:mb-12 relative overflow-visible px-0 -ml-[20px]">
      <div className="flex items-center justify-between mb-4 pl-3 pr-2 sm:px-2">
        <h2 className={(titleClass || "text-xl md:text-2xl font-semibold")}>
          {title}
        </h2>
        <div className="flex items-center space-x-2">
          <button className="bg-zinc-700/60 hover:bg-zinc-600/80 rounded-full text-white text-sm md:text-base p-1.5 md:p-2 cursor-pointer disabled:opacity-20 flex items-center justify-center backdrop-blur-sm" onClick={() => swiperRef.current?.swiper.slidePrev()} disabled={swiperRef.current?.swiper.isBeginning}>
            <ChevronLeftIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
          </button>
          <button className="bg-zinc-700/60 hover:bg-zinc-600/80 rounded-full text-white text-sm md:text-base p-1.5 md:p-2 cursor-pointer disabled:opacity-20 flex items-center justify-center backdrop-blur-sm" onClick={() => swiperRef.current?.swiper.slideNext()} disabled={swiperRef.current?.swiper.isEnd}>
            <ChevronRightIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Custom Navigation Buttons */}
      {/* <div className="custom-swiper-button-prev absolute top-1/2 -left-2 transform -translate-y-1/2 z-10 cursor-pointer p-1 bg-brand-card/60 hover:bg-brand-card/80 rounded-full text-white text-base md:text-lg  mt-5 p-2">
        <ChevronLeftIcon className="size-6" />
      </div>
      <div className="custom-swiper-button-next absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 cursor-pointer p-1 bg-brand-card/60 hover:bg-brand-card/80 rounded-full text-white text-base md:text-lg mt-5 p-2">
        <ChevronRightIcon className="size-6 " />
      </div> */}

      <div className="relative pl-2 sm:pl-0">
        <Swiper
          modules={[Navigation]}
          navigation={false}
          spaceBetween={showRankInGap ? 0 : spaceBetween}
          slidesPerGroup={showRankInGap ? 2 : 1}
          slidesPerView={'auto'}
          ref={swiperRef}
          className="px-0 py-3 overflow-visible content-row-swiper"
        >
          {items.flatMap((item, index) => {
            const slides = [];
            if (showRankInGap) {
              slides.push(
                <SwiperSlide key={`rank-${item.id}`} className={gapSlideWidthClass}>
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-zinc-700/90 select-none">
                      {index + 1}
                    </span>
                  </div>
                </SwiperSlide>
              );
            }
            slides.push(
              <SwiperSlide
                key={item.id}
                className={(slideWidthClass || "!w-[110px] sm:!w-[120px] md:!w-[140px]") + (showRankInGap && posterOverlapClass ? ` ${posterOverlapClass}` : "") + " overflow-visible"}
              >
                <MovieCard
                  item={item}
                  mediaType={mediaType || item.media_type}
                  rank={showRank && !showRankInGap ? index + 1 : undefined}
                  hideRatingOnHover={hideRatingOnHover}
                  showTypeOnHover={showTypeOnHover}
                  hoverScaleClass={hoverScaleClass}
                  showTypeBottomRightOnHover={showTypeBottomRightOnHover}
                  disableGenreBadge={disableGenreBadge}
                  markReleasedAsWaiting={markReleasedAsWaiting}
                />
              </SwiperSlide>
            );
            return slides;
          })}
        </Swiper>
        {showEdgeFade && (
          <>
            {edgeFadeLeft && <div className={edgeFadeLeftClass} />}
            {edgeFadeRight && <div className={edgeFadeRightClass} />}
          </>
        )}
      </div>
    </div>
  );
};

export default ContentRow;
