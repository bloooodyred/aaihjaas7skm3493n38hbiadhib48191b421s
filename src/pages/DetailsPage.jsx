import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import useFetch from "../hooks/useFetch";
import { fetchDetails, getImageUrl, fetchCollection } from "../services/tmdbApi";
import VideoPlayerModal from "../components/VideoPlayerModal";
import Spinner from "../components/Spinner";
import MediaHeader from "../components/details/MediaHeader";
import MediaInfo from "../components/details/MediaInfo";
import StreamPlayer from "../components/details/StreamPlayer";
import TrailerPlayer from "../components/details/TrailerPlayer";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { STREAMING_PROVIDERS } from "../services/streamingApi";

const DetailsPage = () => {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { loadingConfig } = useAppContext();
  const [selectedVideoKey, setSelectedVideoKey] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState(
    STREAMING_PROVIDERS[0]?.id || ""
  );
  const [streamError, setStreamError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showStreamPlayer, setShowStreamPlayer] = useState(false);
  const [collectionData, setCollectionData] = useState(null);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const type = mediaType === "anime" ? "tv" : mediaType; 
  const {
    data: details,
    loading: detailsLoading,
    error: detailsError,
  } = useFetch(fetchDetails, type, id);

  // Process item details
  const itemDetails = useMemo(() => {
    if (!details) return null;
    const avgEpisode = Array.isArray(details.episode_run_time) && details.episode_run_time.length
      ? Math.round(details.episode_run_time.reduce((a, b) => a + (Number(b) || 0), 0) / details.episode_run_time.length)
      : 0;
    const translations = Array.isArray(details?.translations?.translations)
      ? details.translations.translations
      : [];
    const englishTranslation = translations.find((t) => t?.iso_639_1 === 'en' && t?.data);
    const fallbackTitle = details.title || details.name || details.original_title || details.original_name;
    const englishTitle = englishTranslation?.data?.title
      || englishTranslation?.data?.name
      || englishTranslation?.data?.original_title
      || englishTranslation?.data?.original_name;
    const backdrops = Array.isArray(details?.images?.backdrops) ? details.images.backdrops : [];
    const candidateIndexes = [1, 2, 0];
    let preferredBackdrop = null;
    for (const idx of candidateIndexes) {
      const candidate = backdrops[idx];
      if (candidate?.file_path) {
        preferredBackdrop = candidate.file_path;
        break;
      }
    }
    if (!preferredBackdrop) {
      const firstAvailable = backdrops.find((bd) => bd?.file_path);
      if (firstAvailable?.file_path) preferredBackdrop = firstAvailable.file_path;
    }
    if (!preferredBackdrop) {
      preferredBackdrop = details.backdrop_path || null;
    }
    return {
      computedTitle: englishTitle || fallbackTitle || '',
      computedReleaseDate: details.release_date || details.first_air_date,
      computedRuntime: details.runtime || avgEpisode || 0,
      computedBackdropPath: preferredBackdrop,
      ...details,
    };
  }, [details]);

  useEffect(() => {
    const collectionId = itemDetails?.belongs_to_collection?.id;
    if (!collectionId || (type !== "movie" && type !== "tv")) {
      setCollectionData(null);
      setCollectionLoading(false);
      return;
    }

    let cancelled = false;
    setCollectionLoading(true);

    setCollectionData(null);

    fetchCollection(collectionId, { language: 'en-US', fallbackLanguage: 'pl-PL' })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data;
        setCollectionData(data && Array.isArray(data.parts) ? data : null);
      })
      .catch(() => {
        if (cancelled) return;
        setCollectionData(null);
      })
      .finally(() => {
        if (!cancelled) {
          setCollectionLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [type, itemDetails?.belongs_to_collection?.id]);

  const combinedFranchise = useMemo(() => {
    if (!collectionData?.parts?.length) return [];
    const todayStr = new Date().toISOString().slice(0, 10);
    return [...collectionData.parts]
      .filter((part) => part && part.id)
      .map((part) => {
        const releaseDate = part.release_date || part.first_air_date || "";
        const isReleased = releaseDate ? releaseDate <= todayStr : false;
        return {
          ...part,
          releaseDate,
          isReleased,
          media_type: part.media_type || "movie",
        };
      })
      .sort((a, b) => {
        const dateA = a.releaseDate;
        const dateB = b.releaseDate;
        if (!dateA && !dateB) {
          return (a.order || 0) - (b.order || 0);
        }
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
      });
  }, [collectionData]);

  // Handle image errors
  const handleImageError = (e, fallbackSrc) => {
    e.target.onerror = null;
    if (fallbackSrc) {
      e.target.src = fallbackSrc;
    }
  };

  // Handle stream URL
  const streamEmbedUrl = useMemo(() => {
    const provider =
      STREAMING_PROVIDERS.find((p) => p.id === selectedProvider) ||
      STREAMING_PROVIDERS[0];
    if (!provider) return null;

    if (type === "movie" && id) {
      return provider.getMovieUrl(id);
    } else if (
      type === "tv" &&
      id &&
      selectedSeason > 0 &&
      selectedEpisode > 0
    ) {
      return provider.getTvUrl(id, selectedSeason, selectedEpisode);
    }
    return null;
  }, [type, id, selectedSeason, selectedEpisode, selectedProvider]);

  // Handle episodes for selected season
  const episodesForSelectedSeason = useMemo(() => {
    if (type === "tv" && itemDetails?.seasons?.length) {
      const season = itemDetails.seasons.find(
        (s) => s.season_number === selectedSeason
      );
      return season?.episode_count
        ? Array.from({ length: season.episode_count }, (_, i) => i + 1)
        : [];
    }
    return [];
  }, [type, itemDetails, selectedSeason]);

  // Reset state when mediaType or id changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setShowStreamPlayer(false);
    setSelectedSeason(1);
    setSelectedEpisode(1);
  }, [type, id]);

  // Navigation handlers
  const handleGoBack = () => navigate(-1);

  const playTrailer = (key) => {
    setSelectedVideoKey(key);
    setShowVideoModal(true);
  };

  const handlePlayStream = () => {
    // Otwórz dedykowaną stronę odtwarzacza w nowej karcie
    if ((type === "movie" && id) || (type === "tv" && id)) {
      window.open(`/watch/${mediaType}/${id}` , "_blank");
    }
  };

  // Loading and error states
  if (loadingConfig || detailsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white">
        <Spinner />
        <p className="ml-4 text-xl">Loading Details...</p>
      </div>
    );
  }

  if (detailsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-red-500 text-xl p-8 text-center">
        Error loading details: {detailsError.message}
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white text-xl">
        No details available to display.
      </div>
    );
  }

  // Destructure item details
  const {
    computedTitle: itemTitle,
    backdrop_path,
    computedBackdropPath,
    poster_path,
    overview,
    genres = [],
    computedReleaseDate: itemReleaseDate,
    vote_average = 0,
    tagline,
    computedRuntime: itemRuntime,
    number_of_seasons,
    seasons = [],
    videos = { results: [] },
    credits = { cast: [] },
    recommendations = { results: [] },
  } = itemDetails;

  // Process videos and recommendations
  const youtubeVideos = Array.isArray(videos?.results)
    ? videos.results.filter((video) => video && video.site === "YouTube" && video.key)
    : [];

  const languagePriority = (lang) => {
    if (!lang) return 2;
    if (lang.toLowerCase() === "pl") return 0;
    if (lang.toLowerCase() === "en") return 1;
    return 2;
  };

  const typePriority = (type) => {
    switch (type) {
      case "Trailer":
        return 0;
      case "Teaser":
        return 1;
      case "Clip":
        return 2;
      case "Featurette":
        return 3;
      case "Behind the Scenes":
        return 4;
      default:
        return 5;
    }
  };

  const uniqueVideos = [];
  const seenKeys = new Set();
  youtubeVideos.forEach((video) => {
    if (!video || seenKeys.has(video.key)) return;
    seenKeys.add(video.key);
    uniqueVideos.push(video);
  });

  uniqueVideos.sort((a, b) => {
    const langDiff = languagePriority(a.iso_639_1) - languagePriority(b.iso_639_1);
    if (langDiff !== 0) return langDiff;
    const typeDiff = typePriority(a.type) - typePriority(b.type);
    if (typeDiff !== 0) return typeDiff;
    const dateA = a.published_at ? Date.parse(a.published_at) : 0;
    const dateB = b.published_at ? Date.parse(b.published_at) : 0;
    return dateB - dateA;
  });

  const officialTrailers = uniqueVideos;
  const trailerVideoKey = officialTrailers[0]?.key;

  // Similar and Cast removed

  return (
    <div className="bg-brand-bg text-white min-h-screen pb-16 md:pb-8">
      {/* Header + Back Button overlay (scrolls with page, not fixed) */}
      <div className="relative">
        {/* Media Header with overlayed MediaInfo */}
        <MediaHeader
          backdropPath={getImageUrl(computedBackdropPath || backdrop_path, "original")}
          title={itemTitle}
          onImageError={(e) => handleImageError(e, getImageUrl(null, "original"))}
        >
          <>
            <MediaInfo
              posterPath={getImageUrl(poster_path || computedBackdropPath, "w500")}
              title={itemTitle}
              tagline={tagline}
              genres={genres}
              mediaType={mediaType}
              voteAverage={vote_average}
              releaseDate={itemReleaseDate}
              runtime={itemRuntime}
              numberOfSeasons={number_of_seasons}
              overview={overview}
              onPlayStream={handlePlayStream}
              onPlayTrailer={
                officialTrailers[0]
                  ? () => playTrailer(officialTrailers[0].key)
                  : null
              }
              hasStreamUrl={!!streamEmbedUrl}
              onImageError={(e) => handleImageError(e, getImageUrl(null, "w500"))}
              inHeader={true}
            />
            {(officialTrailers[0] || !collectionLoading) && (
              <div className="mt-4 w-full flex flex-col lg:flex-row gap-4">
                {officialTrailers[0] && (
                  <TrailerPlayer videoKey={trailerVideoKey} title={itemTitle} />
                )}
                {(!collectionLoading) && (
                  <div className="flex-1">
                    <div className="bg-black/45 backdrop-blur-sm border border-white/10 rounded-2xl p-3 md:p-4 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Kolekcja</h3>
                        {collectionData?.name && (
                          <span className="text-xs text-white/70">{collectionData.name}</span>
                        )}
                      </div>
                      {combinedFranchise.length > 1 ? (
                        <div className="mt-3 flex flex-col divide-y divide-white/10 max-h-[220px] overflow-y-auto pr-1">
                          {combinedFranchise.map((part, index) => {
                            const targetPath = `/${(part.media_type || (type === "tv" ? "tv" : "movie"))}/${part.id}`;
                            const releaseDisplay = part.releaseDate
                              ? new Date(part.releaseDate).toLocaleDateString('pl-PL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : '—';
                            const posterUrl = part.poster_path
                              ? getImageUrl(part.poster_path, "w92")
                              : part.backdrop_path
                                ? getImageUrl(part.backdrop_path, "w300")
                                : null;
                            const titleText = part.title || part.name || part.original_title || part.original_name || "Bez tytułu";
                            const isCurrentItem = String(part.id) === String(id);
                            const isInteractive = !isCurrentItem && part.isReleased;
                            const baseColorClasses = isCurrentItem ? 'text-red-500' : 'text-white/60 hover:text-white';
                            const disabledClasses = isInteractive ? '' : (isCurrentItem ? 'pointer-events-none cursor-default' : 'pointer-events-none opacity-70 cursor-not-allowed');
                            const linkClasses = `group flex items-center justify-between py-2 text-sm transition-colors ${baseColorClasses} ${disabledClasses}`;
                            const hoverTextClass = isInteractive ? 'group-hover:text-white' : '';
                            return (
                              <Link
                                key={`${part.media_type || type}:${part.id}:${index}`}
                                to={isInteractive ? targetPath : '#'}
                                onClick={(e) => { if (!isInteractive) e.preventDefault(); }}
                                className={linkClasses}
                                title={!isInteractive ? (isCurrentItem ? 'Obecnie oglądane' : 'Tytuł jeszcze niewydany') : undefined}
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`text-xs text-white/60 w-5 text-right transition-colors ${hoverTextClass}`}>
                                    {String(index + 1).padStart(2, '0')}.
                                  </span>
                                  <div className="w-10 h-14 rounded-md overflow-hidden bg-black flex items-center justify-center">
                                    {posterUrl ? (
                                      <img
                                        src={posterUrl}
                                        alt={titleText}
                                        className="w-full h-full object-cover"
                                        onError={(e) => handleImageError(e, getImageUrl(null, "w92"))}
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-black"></div>
                                    )}
                                  </div>
                                  <span className={`font-medium line-clamp-2 leading-snug transition-colors ${hoverTextClass}`}>
                                    {titleText}
                                  </span>
                                </div>
                                <span className={`text-xs text-white/50 transition-colors ${hoverTextClass}`}>
                                  {releaseDisplay}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-3 flex-1 flex items-center justify-center">
                          <p className="text-sm text-white/70 text-center">
                            Brak dodatkowych pozycji w kolekcji dla tego tytułu.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        </MediaHeader>
      </div>

      {/* Spacer below header to separate following sections */}
      <div className="h-[48px] sm:h-[60px] md:h-[72px]"></div>

      {/* Stream Player */}
      {showStreamPlayer && streamEmbedUrl && (
        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
          
          {/* Error Message */}
          {streamError && (
            <div className="bg-red-900/50 text-red-200 p-3 flex justify-between items-center">
              <span>{streamError}</span>
              <button
                onClick={() => {
                  setStreamError(null);
                  setRetryKey((prev) => prev + 1);
                }}
                className="ml-4 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stream Player */}
          <StreamPlayer
            key={`${streamEmbedUrl}-${retryKey}`}
            mediaType={mediaType}
            title={itemTitle}
            streamEmbedUrl={streamEmbedUrl}
            seasons={seasons}
            selectedSeason={selectedSeason}
            selectedEpisode={selectedEpisode}
            onSeasonChange={(season) => {
              setSelectedSeason(season);
              setSelectedEpisode(1);
            }}
            onEpisodeChange={setSelectedEpisode}
            episodesForSelectedSeason={episodesForSelectedSeason}
            onClose={() => {
              setShowStreamPlayer(false);
              setStreamError(null);
            }}
            onError={(error) => {
              console.error("Stream error:", error);
              setStreamError(
                `Failed to load stream from ${
                  STREAMING_PROVIDERS.find((p) => p.id === selectedProvider)
                    ?.name || "provider"
                }. Trying another source...`
              );

              // Auto-switch to next provider on error
              const currentIndex = STREAMING_PROVIDERS.findIndex(
                (p) => p.id === selectedProvider
              );
              if (currentIndex < STREAMING_PROVIDERS.length - 1) {
                setSelectedProvider(STREAMING_PROVIDERS[currentIndex + 1].id);
              }
            }}
          />
          {/* Provider Selection */}
          {/* <div className="text-center text-sm text-yellow-500 bg-yellow-500/30 border border-yellow-500 rounded-lg p-2 w-fit mx-auto px-4 mb-2 flex items-center justify-between">
            use adblocker for better watching experience 
            <span>
              <XMarkIcon className="w-4 h-4"/>
            </span>
          </div> */}
          <div className="flex flex-wrap gap-2 p-4 bg-zinc-900/80 rounded-t-lg">
            {STREAMING_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                onClick={() => {
                  setSelectedProvider(provider.id);
                  setStreamError(null);
                  setRetryKey((prev) => prev + 1);
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedProvider === provider.id
                    ? "bg-brand-yellow text-black"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                }`}
              >
                {provider.name}
              </button>
            ))}
          </div>

        </div>
      )}

      <VideoPlayerModal
        videoKey={selectedVideoKey}
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  );
};

export default DetailsPage;
