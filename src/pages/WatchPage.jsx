import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import { fetchDetails } from '../services/tmdbApi';
import { STREAMING_PROVIDERS } from '../services/streamingApi';
import StreamPlayer from '../components/details/StreamPlayer';

const WatchPage = () => {
  const { mediaType: rawMediaType, id } = useParams();
  const navigate = useNavigate();
  const mediaType = rawMediaType === 'anime' ? 'tv' : rawMediaType;

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState(
    STREAMING_PROVIDERS[0]?.id || ''
  );
  const [streamError, setStreamError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleBack = useCallback(() => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(`/${rawMediaType}/${id}`);
    }
  }, [navigate, rawMediaType, id]);

  const { data: details, loading, error } = useFetch(fetchDetails, mediaType, id);

  const itemDetails = useMemo(() => {
    if (!details) return null;
    return {
      title: details.title || details.name,
      seasons: details.seasons || [],
      ...details,
    };
  }, [details]);

  const episodesForSelectedSeason = useMemo(() => {
    if (mediaType === 'tv' && itemDetails?.seasons?.length) {
      const season = itemDetails.seasons.find(
        (s) => s.season_number === selectedSeason
      );
      return season?.episode_count
        ? Array.from({ length: season.episode_count }, (_, i) => i + 1)
        : [];
    }
    return [];
  }, [mediaType, itemDetails, selectedSeason]);

  const streamEmbedUrl = useMemo(() => {
    const provider =
      STREAMING_PROVIDERS.find((p) => p.id === selectedProvider) ||
      STREAMING_PROVIDERS[0];
    if (!provider) return null;

    if (mediaType === 'movie' && id) {
      return provider.getMovieUrl(id);
    } else if (
      mediaType === 'tv' &&
      id &&
      selectedSeason > 0 &&
      selectedEpisode > 0
    ) {
      return provider.getTvUrl(id, selectedSeason, selectedEpisode);
    }
    return null;
  }, [mediaType, id, selectedSeason, selectedEpisode, selectedProvider]);

  useEffect(() => {
    // Reset na zmianę tytułu/typu
    setSelectedSeason(1);
    setSelectedEpisode(1);
  }, [mediaType, id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white">
        <p>Loading stream...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-red-500 text-xl p-8 text-center">
        Error loading details: {error.message}
      </div>
    );
  }

  if (!itemDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg text-white text-xl">
        No details available.
      </div>
    );
  }

  const { title, seasons = [] } = itemDetails;

  return (
    <div className="bg-brand-bg text-white min-h-screen">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-1">
        <button
          onClick={handleBack}
          className="mb-3 inline-flex items-center space-x-1.5 text-sm rounded-full px-3 py-2 bg-zinc-800/25 hover:bg-zinc-800/60 backdrop-blur-sm border border-zinc-800"
        >
          <span>Back</span>
        </button>

        {/* Player */}
        {streamEmbedUrl && (
          <StreamPlayer
            key={`${streamEmbedUrl}-${retryKey}`}
            mediaType={rawMediaType}
            title={title}
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
            layout="inline"
            onError={(e) => {
              console.error('Stream error:', e);
              setStreamError('Failed to load stream. Trying another source...');
              const currentIndex = STREAMING_PROVIDERS.findIndex(
                (p) => p.id === selectedProvider
              );
              if (currentIndex < STREAMING_PROVIDERS.length - 1) {
                setSelectedProvider(STREAMING_PROVIDERS[currentIndex + 1].id);
              }
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
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
                      ? 'bg-brand-yellow text-black'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </StreamPlayer>
        )}

        {/* Komunikat o błędzie */}
        {streamError && (
          <div className="bg-red-900/50 text-red-200 p-3 flex justify-between items-center rounded mb-2">
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

        {/* Wybór providera przeniesiony obok playera */}
      </div>
    </div>
  );
};

export default WatchPage;
