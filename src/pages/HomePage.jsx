// src/pages/HomePage/HomePage.jsx
import React, { useState } from "react";
import HeroBanner from "../components/HeroBanner";
import TopNavBar from "../components/TopNavBar";
import ContentRow from "../components/ContentRow";
import {
  fetchTrending,
  fetchPopular,
  fetchTopRated,
  fetchNowPlaying,
  fetchUpcoming,
  fetchUpcomingMoviesStrict,
  fetchUpcomingTVStrict,
  fetchUpcomingCombinedPopular,
  fetchUpcomingCombinedByBrands,
  fetchUpcomingMoviesPopular,
  fetchUpcomingMoviesFuturePopular,
  fetchGenreMovies,
  fetchTVByNetwork,
} from "../services/tmdbApi";

const HomePage = ({ onMenuClick }) => {

  const [heroTitle, setHeroTitle] = useState("");

  return (
    <div className="pb-16 md:pb-4">
      <HeroBanner onTitleChange={setHeroTitle} />
      <div className="px-4 md:px-6 lg:px-8 -mt-[180px] md:-mt-[220px] relative z-[15]">
        {heroTitle && (
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-tight font-bold text-left select-none cursor-default break-words mb-4">
            {heroTitle}
          </h1>
        )}
        {/* Nowości */}
        <ContentRow
          title="Nowości"
          fetchFunction={fetchNowPlaying}
          apiParams={["movie"]}
          mediaType="movie"
          showTypeBottomRightOnHover={true}
          showEdgeFade={false}
        />
        {/* Nadchodzące */}
        <div className="h-[20px]"></div>
        <ContentRow
          title="Nadchodzące"
          fetchFunction={fetchUpcomingMoviesFuturePopular}
          apiParams={[]}
          mediaType="movie"
          hideRatingOnHover={true}
          showTypeBottomRightOnHover={true}
          slideWidthClass="!w-[130px] sm:!w-[145px] md:!w-[165px]"
        />
        {/* Seriale na Czasie */}
        <div className="h-[24px]"></div>
        <ContentRow
          title="Seriale na Czasie"
          fetchFunction={fetchTrending}
          apiParams={["tv", "day"]}
          mediaType="tv"
        />
        {/* Seriale Netflix (network: 213) */}
        <div className="h-[24px]"></div>
        <ContentRow
          title="Seriale Netflix"
          fetchFunction={fetchTVByNetwork}
          apiParams={[213]}
          mediaType="tv"
        />
        {/* Popularne filmy */}
        <div className="h-[24px]"></div>
        <ContentRow
          title="Popularne filmy"
          fetchFunction={fetchPopular}
          apiParams={["movie"]}
          mediaType="movie"
        />
        {/* Najwyżej oceniane seriale */}
        <div className="h-[24px]"></div>
        <ContentRow
          title="Najwyżej oceniane seriale"
          fetchFunction={fetchTopRated}
          apiParams={["tv"]}
          mediaType="tv"
        />
        {/* Duża przerwa przed Top 10 */}
        <div className="h-[64px]"></div>
        {/* TOP 10 Tygodnia */}
        <ContentRow
          title={<><span className="uppercase">TOP 10</span><span className="ml-2 align-baseline text-base md:text-lg lg:text-xl font-medium normal-case">Tygodnia</span></>}
          fetchFunction={fetchTrending}
          apiParams={["all", "week"]}
          mediaType={undefined}
          limit={10}
          showRank={true}
          slideWidthClass="!w-[180px] sm:!w-[200px] md:!w-[230px]"
          spaceBetween={56}
          titleClass="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight"
          showRankInGap={true}
          gapSlideWidthClass="!w-[72px] sm:!w-[88px] md:!w-[100px]"
          filterNoFuture={true}
          showTypeTopRightAlways={true}
          showRatingBottomRightOnHover={true}
          showTypeBottomRightOnHover={true}
          showEdgeFade={true}
          edgeFadeLeft={false}
          edgeFadeRightClass="pointer-events-none absolute top-[-8px] bottom-[-8px] right-[-42px] w-20 sm:w-32 bg-gradient-to-l from-black/75 via-black/35 to-transparent z-30"
        />
        
      </div>
    </div>
  );
}
;

export default HomePage;
