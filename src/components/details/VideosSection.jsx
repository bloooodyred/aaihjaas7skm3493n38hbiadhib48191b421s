import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';

const VideosSection = ({ videos, onVideoSelect }) => {
  return (
    <section className="container mx-2 md:mx-auto lg:mx-auto px-4 md:px-8 lg:px-12 py-2 md:py-6 overflow-visible relative">
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-2xl md:text-3xl -ml-4 font-semibold mb-2 md:mb-4">
          Official Videos
        </h2>
        <div className="items-center gap-2 hidden md:flex lg:flex">
          <button 
            className="videos-prev bg-brand-card rounded-full p-2 hover:bg-brand-card/80 transition-colors" 
            aria-label="Previous videos"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button 
            className="videos-next bg-brand-card rounded-full p-2 hover:bg-brand-card/80 transition-colors" 
            aria-label="Next videos"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
      <Swiper
        modules={[Navigation, FreeMode]}
        navigation={{ prevEl: ".videos-prev", nextEl: ".videos-next" }}
        freeMode={true}
        spaceBetween={16}
        slidesPerView={"auto"}
        className="videos-swiper overflow-visible ml-[4px] md:ml-[-4px] lg:ml-[-12px] pl-0 pr-4 md:pr-6"
        style={{ overflow: 'visible' }}
      >
        {videos.map((video) => (
          <SwiperSlide
            key={video.id}
            className="!w-[280px] md:!w-[320px] overflow-visible"
          >
            <div className="relative transform-gpu transition-transform duration-300 hover:scale-105 hover:z-50">
              <div
                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer shadow-lg group"
                onClick={() => onVideoSelect(video.key)}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.key}/mqdefault.jpg`}
                  alt={video.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <PlayIcon className="w-12 h-12 text-white" />
                </div>
                <p className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded truncate">
                  {video.name}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default VideosSection;