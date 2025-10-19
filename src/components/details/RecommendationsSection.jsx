import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import MovieCard from '../MovieCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const RecommendationsSection = ({ items, mediaType, title }) => {
  return (
    <section className="container mx-2 md:mx-auto lg:mx-auto px-0 pr-[100px] py-2 md:py-6 overflow-visible">
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-2xl md:text-3xl font-semibold mb-2 md:mb-4 pl-[25px]">
          {title}
        </h2>
        <div className="items-center gap-2 hidden md:flex lg:flex">
          <button
            className="recommendations-prev bg-brand-card rounded-full p-2 hover:bg-brand-card/80 transition-colors"
            aria-label="Previous recommendations"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            className="recommendations-next bg-brand-card rounded-full p-2 hover:bg-brand-card/80 transition-colors"
            aria-label="Next recommendations"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <div className="overflow-visible" style={{ maxWidth: 'calc(100% - 100px)' }}>
        <Swiper
          modules={[Navigation, FreeMode]}
          navigation={{ prevEl: '.recommendations-prev', nextEl: '.recommendations-next' }}
          freeMode={true}
          spaceBetween={16}
          slidesPerView={'auto'}
          className="recommendations-swiper overflow-visible ml-0 md:ml-[-8px] lg:ml-[-16px] pl-0 pr-4 md:pr-6"
          style={{ overflow: 'visible', paddingRight: '100px' }}
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className="!w-[100px] sm:!w-[120px] md:!w-[150px] overflow-visible">
              <div className="relative z-10 hover:z-30">
                <MovieCard item={item} mediaType={item.media_type || mediaType} hoverScaleClass="group-hover:scale-105" />
              </div>
            </SwiperSlide>
          ))}
          {/* Right gutter to keep 100px from screen edge */}
          <SwiperSlide className="!w-[100px] pointer-events-none" />
        </Swiper>
      </div>
    </section>
  );
};

export default RecommendationsSection;