import { useParams, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { fetchTrending } from "../services/tmdbApi";
import MovieCard from "../components/MovieCard";
import Spinner from "../components/Spinner";
import { useExplore } from "../hooks/useExplore";
import { useEffect, useState, useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const ExplorePage = () => {
  const { query: routeQuery } = useParams();
  const query = routeQuery === 'tv' ? 'tv' : 'movie';
  const shouldRedirect = routeQuery !== query;
  const [showCategories, setShowCategories] = useState(false);
  const [popularResults, setPopularResults] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGenreParam = searchParams.get('genre');
  const initialPageParam = searchParams.get('page');
  const initialGenre = initialGenreParam ? Number(initialGenreParam) : null;
  const initialPage = initialPageParam ? Number(initialPageParam) : 1;
  const {
    page,
    setPage,
    setPageImmediate,
    activeGenre,
    setActiveGenre,
    setActiveGenreImmediate,
    genres,
    data = { results: [], total_pages: 0 },
    loading,
    error,
  } = useExplore(query, { initialGenre, initialPage });

  // When no category selected, force page to 1 (we treat it as a single page of popular content)
  useEffect(() => {
    if (!activeGenre && page !== 1) {
      setPage(1);
    }
  }, [activeGenre]);

  // Fetch popular recent content (approx. last month -> trending week) when no category selected
  useEffect(() => {
    let cancelled = false;
    const todayStr = new Date().toISOString().slice(0, 10);
    const notFuture = (it) => {
      const d = (it?.release_date || it?.first_air_date || '') + '';
      return d && d <= todayStr;
    };
    const load = async () => {
      if (activeGenre) return; // only when no category
      setPopularLoading(true);
      try {
        if (query === 'movie' || query === 'tv') {
          const res = await fetchTrending(query, 'week');
          const list = (res?.data?.results || []).filter(notFuture);
          if (!cancelled) setPopularResults(list);
        } else {
          const res = await fetchTrending('all', 'week');
          const list = (res?.data?.results || [])
            .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
            .filter(notFuture);
          if (!cancelled) setPopularResults(list);
        }
      } catch (e) {
        if (!cancelled) setPopularResults([]);
      } finally {
        if (!cancelled) setPopularLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [query, activeGenre]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [query]);

  // Przywracanie stanu odbywa się przez initialGenre/initialPage w useExplore

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (activeGenre) {
      params.set('genre', String(activeGenre));
    } else {
      params.delete('genre');
    }
    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [activeGenre, page, setSearchParams]);

  if (shouldRedirect) {
    return <Navigate to={`/explore/${query}`} replace />;
  }

  // Show loading state
  if (loading && !data?.results?.length) {
    return (
      <div className="container mx-auto p-4 py-6 min-h-screen text-white pb-16">
        <div className="text-center min-h-[550px] flex items-center justify-center w-full">
          <p className="text-lg animate-pulse m-4 flex items-center gap-2">
            <Spinner />
            Loading {query === 'movie' ? 'Movies' : 'TV Shows'}...
          </p>
        </div>
      </div>
    );
  }


  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4 py-6 min-h-screen text-white pb-16">
        <div className="text-center min-h-[250px] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Content</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Polish labels for TMDB genres
  const MOVIE_GENRES_PL = {
    28: 'Akcja', 12: 'Przygodowy', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny', 14: 'Fantasy', 36: 'Historyczny', 27: 'Horror', 10402: 'Muzyczny',
    9648: 'Tajemniczy', 10749: 'Romans', 878: 'Sci‑Fi', 10770: 'Film TV', 53: 'Thriller', 10752: 'Wojenny', 37: 'Western'
  };
  const TV_GENRES_PL = {
    10759: 'Akcja i przygoda', 16: 'Animacja', 35: 'Komedia', 80: 'Kryminalny', 99: 'Dokumentalny', 18: 'Dramat', 10751: 'Familijny', 10762: 'Dla dzieci', 9648: 'Tajemniczy', 10763: 'Wiadomości', 10764: 'Reality show', 10765: 'Sci‑Fi i fantasy', 10766: 'Telenowela', 10767: 'Talk‑show', 10768: 'Wojna i polityka', 37: 'Western'
  };

  // Fallback genre lists when API list not yet available
  const MOVIE_GENRES_STATIC = Object.entries(MOVIE_GENRES_PL).map(([id, name]) => ({ id: Number(id), name }));
  const TV_GENRES_STATIC = Object.entries(TV_GENRES_PL).map(([id, name]) => ({ id: Number(id), name }));

  // Build and filter unique genres
  const baseGenres = (Array.isArray(genres) && genres.length)
    ? genres
    : (query === 'movie' ? MOVIE_GENRES_STATIC : TV_GENRES_STATIC);
  const uniqueGenres = (baseGenres.filter((genre, index, self) =>
    index === self.findIndex((g) => g.id === genre.id)
  ) || []).filter((g) => {
    if (query === 'tv') return ![16, 99, 10763, 10764, 10766, 10767].includes(g.id);
    if (query === 'movie') return g.id !== 16;
    return true;
  });
  const getGenreLabel = (g) => {
    const id = g?.id;
    if (!id) return g?.name || '';
    if (query === 'tv') return TV_GENRES_PL[id] || g.name;
    if (query === 'movie') return MOVIE_GENRES_PL[id] || g.name;
    return g.name;
  };

  return (
    <div className="container mx-auto px-4 pt-0 -mt-4 sm:-mt-6 md:-mt-8 min-h-screen text-white pb-16">
      {/* Main + Sidebar */}
      <div className="mt-0 flex gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex sm:flex-row justify-between items-center sm:items-center mb-1 gap-2">
            <div>
              <h2 className="text-xl font-semibold text-gray-200">
                {(() => {
                  const g = uniqueGenres?.find((gx) => gx.id === activeGenre);
                  if (g) return getGenreLabel(g);
                  if (activeGenre) {
                    const map = query === 'tv' ? TV_GENRES_PL : MOVIE_GENRES_PL;
                    return map[activeGenre] || 'Popularne';
                  }
                  return 'Popularne';
                })()}
              </h2>
            </div>
            <div className="flex items-center gap-2 relative">
              {data?.total_pages > 0 && (
                <div className="flex items-center space-x-2 bg-zinc-900/50 rounded-lg p-2">
                  <span className="text-sm text-gray-300 min-w-[88px]">
                    {`Strona ${page} z ${!activeGenre ? 1 : Math.min(500, data.total_pages || 1)}`}
                  </span>
                  <div className="h-5 w-px bg-zinc-700 mx-1"></div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!activeGenre || page === 1 || loading}
                      className="p-1.5 rounded-md hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ArrowLeftIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!activeGenre || !data?.total_pages || page >= Math.min(500, data.total_pages || 1) || loading}
                      className="p-1.5 rounded-md hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowCategories((s) => !s)}
                className="inline-flex items-center justify-center rounded-md bg-transparent text-white/80 hover:text-white p-1.5 md:p-2 cursor-pointer"
                aria-label="Pokaż kategorie"
              >
                <Bars3Icon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              {/* Anchored dropdown panel */}
              <div className={`absolute z-50 top-full right-0 mt-2 w-[240px] sm:w-[280px] bg-zinc-900/95 backdrop-blur border border-white/10 rounded-lg shadow-xl transform transition-all duration-200 origin-top-right ${showCategories ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <div className="flex items-center justify-start py-2 pl-[20px] pr-2 border-b border-white/10">
                  <h3 className="text-xs md:text-sm text-gray-300 font-semibold">Kategorie</h3>
                </div>
                <div className="p-2 max-h-[60vh] overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    {uniqueGenres?.map((genre) => (
                      <button
                        key={genre.id}
                        className={`text-sm bg-zinc-800 border border-zinc-800 px-2 py-[10px] rounded-md font-semibold w-full text-left text-gray-200 transition-colors cursor-pointer hover:bg-zinc-700 ${
                          activeGenre === genre.id ? '!bg-white !text-black !border-white hover:!bg-white' : ''
                        }`}
                        onClick={() => { setActiveGenre(genre.id); setShowCategories(false); }}
                      >
                        {getGenreLabel(genre)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          {(!activeGenre ? popularLoading : loading) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-zinc-800 rounded-lg h-60 md:h-50 animate-pulse"></div>
              ))}
            </div>
          ) : (!activeGenre ? popularResults.length > 0 : (data?.results?.length > 0)) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {(!activeGenre ? popularResults : data.results).map((item) => (
                <MovieCard key={item.id} item={item} mediaType={query} markReleasedAsWaiting={true} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No results found. Try a different genre or check back later.</p>
            </div>
          )}
          {/* Removed fixed slide-out; now anchored dropdown is used */}
        </div>
        {/* No static sidebar; categories available via hamburger menu */}
      </div>
    </div>
  );
};

export default ExplorePage;
