import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGenres,
  fetchGenreMovies,
  fetchGenreTVShows,
  fetchAnimeTV,
  fetchPopular,
  fetchPopularAnimeTV,
  POPULAR_STREAMING_PROVIDER_IDS,
} from '../services/tmdbApi';

const defaultGenres = {
  movie: 28,
  tv: 10759,
  anime: 16,
};

const MOVIES_PER_PAGE = 20;

// Simple in-memory cache to keep genres between navigations
const genresCache = {
  movie: null,
  tv: null,
};

const filterByGenre = (items, genreId) => {
  if (!genreId) return Array.isArray(items) ? items.slice(0, MOVIES_PER_PAGE) : [];
  const idNumber = Number(genreId);
  return (Array.isArray(items) ? items : [])
    .filter((item) => Array.isArray(item?.genre_ids) && item.genre_ids.includes(idNumber))
    .slice(0, MOVIES_PER_PAGE);
};

const fetchPopularMoviesEnsuringCount = async (targetPage = 1) => {
  const perPage = MOVIES_PER_PAGE;
  const collected = [];
  const seen = new Set();
  let apiPage = 1;
  let totalPages = 1;
  const safetyExtraPages = 4; // fetch a few extra pages to compensate for filtered results

  while (
    apiPage <= Math.min(500, targetPage + safetyExtraPages) &&
    collected.length < targetPage * perPage + perPage
  ) {
    const res = await fetchPopular('movie', apiPage);
    const results = Array.isArray(res?.data?.results) ? res.data.results : [];
    totalPages = res?.data?.total_pages || totalPages;

    for (const item of results) {
      if (item?.id != null && !seen.has(item.id)) {
        seen.add(item.id);
        collected.push(item);
      }
    }

    if (apiPage >= totalPages) {
      break;
    }

    apiPage += 1;
  }

  const startIndex = Math.max(0, (targetPage - 1) * perPage);
  const pageItems = collected.slice(startIndex, startIndex + perPage);

  return {
    results: pageItems,
    totalPages: Math.min(totalPages || 1, 500),
  };
};

const isValidGenre = (genreId, genresList) => genresList.some((g) => g.id === genreId);

export const useExplore = (query = 'movie', options = {}) => {
  const { initialGenre = null, initialPage = 1 } = options || {};
  const [page, setPage] = useState(initialPage || 1);
  const [activeGenre, setActiveGenre] = useState(initialGenre || null);
  const [genres, setGenres] = useState([]);
  const [data, setData] = useState({ results: [], total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const requestId = useRef(0);
  const isInitializingGenres = useRef(false); // Flag to prevent race conditions
  const currentQuery = useRef(query);

  // Get the default genre ID for the current query
  const getDefaultGenreId = (mediaType) => {
    if (mediaType === 'movie') return defaultGenres.movie;
    if (mediaType === 'anime') return defaultGenres.anime;
    return defaultGenres.tv;
  };

  // Handle query changes
  useEffect(() => {
    // Check if query actually changed
    const hasQueryChanged = currentQuery.current !== query;
    currentQuery.current = query;
    
    let isMounted = true;
    const thisRequest = ++requestId.current;
    const controller = new AbortController();
    const signal = controller.signal;

    const loadInitialData = async () => {
      // Set flag to prevent second effect from running during initialization
      isInitializingGenres.current = true;
      
      setLoading(true);
      setError(null);
      setData({ results: [], total_pages: 0 });

      try {
        // 1. First fetch genres
        const mediaType = query === 'anime' ? 'tv' : query;

        // Use cached genres immediately to avoid empty category list
        const cachedGenres = genresCache[query];
        if (Array.isArray(cachedGenres) && cachedGenres.length) {
          setGenres(cachedGenres);
        }

        const genresRes = await fetchGenres(mediaType, { signal });
        
        if (!isMounted || thisRequest !== requestId.current) return;
        
        const fetchedGenres = genresRes.data.genres || [];
        setGenres(fetchedGenres);
        // Update cache
        if (query === 'movie' || query === 'tv') {
          genresCache[query] = fetchedGenres;
        }

        if (fetchedGenres.length === 0) {
          setError('No genres found.');
          setLoading(false);
          isInitializingGenres.current = false;
          return;
        }

        // If initialGenre/page are provided (from URL), fetch by-genre immediately
        if (initialGenre) {
          const genreId = Number(initialGenre);
          const valid = !Number.isNaN(genreId) && isValidGenre(genreId, fetchedGenres);
          const effectiveGenre = valid ? genreId : fetchedGenres[0]?.id;
          const desiredPage = Number(initialPage) > 0 ? Number(initialPage) : 1;

          setActiveGenre(effectiveGenre);
          setPage(desiredPage);

          let res;
          if (query === 'movie') {
            res = await fetchGenreMovies(effectiveGenre, desiredPage, { signal });
          } else if (query === 'tv') {
            res = await fetchGenreTVShows(effectiveGenre, desiredPage, signal);
          }

          if (!isMounted || thisRequest !== requestId.current) return;

          const results = Array.isArray(res?.data?.results) ? res.data.results : [];
          const filtered = filterByGenre(results, effectiveGenre);
          setData({
            results: filtered,
            total_pages: Math.min(res?.data?.total_pages || 1, 500),
          });

          setLoading(false);
          isInitializingGenres.current = false;
          return;
        }

        // 2. For each tab, show popular by default (no genre preselected)
        if (!initialGenre && query === 'movie') {
          const popularPage = await fetchPopularMoviesEnsuringCount(1, { perPage: 20 });
          if (!isMounted || thisRequest !== requestId.current) return;
          setData({
            results: popularPage.results || [],
            total_pages: popularPage.totalPages,
          });
          setActiveGenre(null);
        } else if (!initialGenre && query === 'tv') {
          const popularRes = await fetchPopular('tv', 1);
          if (!isMounted || thisRequest !== requestId.current) return;
          setData({
            results: popularRes.data.results || [],
            total_pages: Math.min(popularRes.data.total_pages || 1, 500),
          });
          setActiveGenre(null);
        } else if (!initialGenre && query === 'anime') {
          // Always show only animated content (TV + Movies) for Anime tab
          const [tvRes, movieRes] = await Promise.all([
            fetchAnimeTV(16, 1, { providerIds: POPULAR_STREAMING_PROVIDER_IDS, signal }), // TV anime (JP origin)
            fetchGenreMovies(16, 1, { providerIds: POPULAR_STREAMING_PROVIDER_IDS, signal }), // Animated movies
          ]);
          if (!isMounted || thisRequest !== requestId.current) return;
          const tv = Array.isArray(tvRes?.data?.results) ? tvRes.data.results.map(r => ({ ...r, media_type: 'tv' })) : [];
          const movies = Array.isArray(movieRes?.data?.results) ? movieRes.data.results.map(r => ({ ...r, media_type: 'movie' })) : [];
          const merged = filterByGenre([...tv, ...movies], 16)
            .sort((a,b) => (b.popularity||0) - (a.popularity||0));
          setData({
            results: merged,
            total_pages: 1,
          });
          setActiveGenre(null);
        }

      } catch (err) {
        if (!signal.aborted && isMounted && thisRequest === requestId.current) {
          setError(err.response?.data?.status_message || 'Failed to load data');
          setData({ results: [], total_pages: 0 });
        }
      } finally {
        if (isMounted && thisRequest === requestId.current) {
          setLoading(false);
          isInitializingGenres.current = false; // Reset flag
        }
      }
    };

    // Only run if query changed or it's the initial load
    if (hasQueryChanged || activeGenre === null) {
      loadInitialData();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [query]);

  // Handle data fetching when activeGenre or page changes (but NOT during initialization)
  useEffect(() => {
    // Skip if no active genre, or if we're initializing genres, or if it's page 1 and we just set the genre
    if (!activeGenre || isInitializingGenres.current) return;

    let isMounted = true;
    const thisRequest = ++requestId.current;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData({ results: [], total_pages: 0 });

      try {
        // Anime: always show only animated content, ignore activeGenre
        if (query === 'anime') {
          const animeGenreId = activeGenre || 16;
          const includeMovies = animeGenreId === 16;
          const [tvRes, movieRes] = await Promise.all([
            fetchAnimeTV(animeGenreId, page, { providerIds: POPULAR_STREAMING_PROVIDER_IDS, signal }),
            includeMovies ? fetchGenreMovies(16, page, { providerIds: POPULAR_STREAMING_PROVIDER_IDS, signal }) : Promise.resolve({ data: { results: [] } }),
          ]);
          if (!isMounted || thisRequest !== requestId.current) return;
          const tv = Array.isArray(tvRes?.data?.results) ? tvRes.data.results.map(r => ({ ...r, media_type: 'tv' })) : [];
          const movies = Array.isArray(movieRes?.data?.results) ? movieRes.data.results.map(r => ({ ...r, media_type: 'movie' })) : [];
          const merged = filterByGenre([...tv, ...movies], animeGenreId)
            .sort((a,b) => (b.popularity||0) - (a.popularity||0));
          setData({
            results: merged,
            total_pages: Math.min(Math.max(tvRes?.data?.total_pages || 1, movieRes?.data?.total_pages || 1), 500),
          });
          return;
        }

        // Movies/TV: if no genre selected, show popular; otherwise fetch by genre
        if (!activeGenre) {
          if (query === 'movie') {
            const popularPage = await fetchPopularMoviesEnsuringCount(page, { perPage: 20 });
            if (!isMounted || thisRequest !== requestId.current) return;
            setData({
              results: popularPage.results || [],
              total_pages: popularPage.totalPages,
            });
          } else {
            const popularRes = await fetchPopular(query === 'tv' ? 'tv' : 'movie', page);
            if (!isMounted || thisRequest !== requestId.current) return;
            setData({
              results: popularRes.data.results || [],
              total_pages: Math.min(popularRes.data.total_pages || 1, 500),
            });
          }
          return;
        }

        // By-genre fetch for Movies/TV when a genre is selected
        let res;
        if (query === 'movie') {
          res = await fetchGenreMovies(activeGenre, page, { signal });
        } else {
          res = await fetchGenreTVShows(activeGenre, page, signal);
        }

        if (!isMounted || thisRequest !== requestId.current) return;

        const results = Array.isArray(res?.data?.results) ? res.data.results : [];
        const filtered = filterByGenre(results, activeGenre);

        setData({
          results: filtered,
          total_pages: Math.min(res.data.total_pages || 1, 500),
        });
      } catch (err) {
        if (!signal.aborted && isMounted && thisRequest === requestId.current) {
          setError(err.response?.data?.status_message || 'Failed to fetch data');
          setData({ results: [], total_pages: 0 });
        }
      } finally {
        if (isMounted && thisRequest === requestId.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeGenre, page, query]);

  // Handle genre change
  const handleGenreChange = useCallback((genreId) => {
    if (genreId === activeGenre) return;
    setPage(1);
    setActiveGenre(genreId);
    setData({ results: [], total_pages: 0 });
  }, [activeGenre]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > (data.total_pages || 1)) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [data.total_pages]);

  return {
    page,
    setPage: handlePageChange,
    setPageImmediate: setPage,
    activeGenre,
    setActiveGenre: handleGenreChange,
    setActiveGenreImmediate: setActiveGenre,
    genres,
    data,
    loading,
    error,
  };
};