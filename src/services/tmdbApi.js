// src/services/tmdbApi.js
import axios from "axios";

const BASE_URL = "https://api.themoviedb.org/3";

const TMDB_API_KEY = import.meta.env.VITE_APP_TMDB_API_KEY;

const api = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Helper: remove adult items and hide unrated items unless they are future releases
const cleanResults = (results) => {
  if (!Array.isArray(results)) return results;
  const todayStr = new Date().toISOString().slice(0, 10);
  return results.filter((it) => {
    if (it?.adult) return false;
    const hasRating = typeof it?.vote_average === 'number' && it.vote_average > 0 && (typeof it?.vote_count !== 'number' || it.vote_count > 0);
    if (hasRating) return true;
    const dateStr = (it?.release_date || it?.first_air_date || '') + '';
    // Keep unrated only if release/first_air_date is in the future
    return dateStr && dateStr > todayStr;
  });
};

export const POPULAR_STREAMING_PROVIDER_IDS = [
  8,    // Netflix
  9,    // Amazon Prime Video
  337,  // Disney+
  119,  // Crunchyroll
  384,  // HBO Max / Max
  531,  // Player
  1899, // Apple TV+
  438,  // Canal+
  592,  // Viaplay
  743,  // SkyShowtime
];

export const fetchTrending = (mediaType = "all", timeWindow = "day", page = 1) =>
  api
    .get(`/trending/${mediaType}/${timeWindow}`, { params: { page } })
    .then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

export const fetchPopular = (mediaType = "movie", page = 1) =>
  api.get(`/${mediaType}/popular`, { params: { page } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

export const fetchPopularMoviesEnsuringCount = async (
  targetPage = 1,
  { perPage = 20, filterFn = null, safetyExtraPages = 6 } = {}
) => {
  const collected = [];
  const seen = new Set();
  let apiPage = 1;
  let totalPages = 1;

  const maxApiPage = Math.min(500, targetPage + safetyExtraPages);
  const requiredCount = targetPage * perPage;

  while (apiPage <= maxApiPage && collected.length < requiredCount) {
    const res = await api.get(`/movie/popular`, { params: { page: apiPage } });
    const results = Array.isArray(res?.data?.results) ? res.data.results : [];
    totalPages = res?.data?.total_pages || totalPages;

    for (const item of results) {
      if (!item || item.id == null || item.adult || seen.has(item.id)) continue;
      if (filterFn && !filterFn(item)) continue;
      seen.add(item.id);
      collected.push(item);
      if (collected.length >= requiredCount) break;
    }

    apiPage += 1;
    if (apiPage > totalPages) {
      break;
    }
  }

  const startIndex = Math.max(0, (targetPage - 1) * perPage);
  const pageItems = collected.slice(startIndex, startIndex + perPage);

  return {
    results: pageItems,
    totalPages: Math.min(totalPages || 1, 500),
  };
};

export const fetchTopRated = (mediaType = "movie", page = 1) =>
  api.get(`/${mediaType}/top_rated`, { params: { page } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

// Now Playing (Movies) or Airing Today (TV)
export const fetchNowPlaying = (mediaType = "movie", page = 1) => {
  if (mediaType === "tv") {
    return api.get(`/tv/airing_today`, { params: { page } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
  }
  return api.get(`/movie/now_playing`, { params: { page, include_adult: false } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// Upcoming (Movies) or On The Air (TV)
export const fetchUpcoming = (mediaType = "movie", page = 1) => {
  if (mediaType === "tv") {
    return api.get(`/tv/on_the_air`, { params: { page } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
  }
  return api.get(`/movie/upcoming`, { params: { page, include_adult: false } }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// Upcoming movies sorted by popularity desc (no brand/network filters, global)
export const fetchUpcomingMoviesPopular = async (page = 1) => {
  const res = await api.get(`/movie/upcoming`, { params: { page, include_adult: false } });
  const results = Array.isArray(res?.data?.results) ? res.data.results : [];
  const cleaned = cleanResults(results);
  const sorted = cleaned.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return { ...res, data: { ...res.data, results: sorted } };
};

// Upcoming movies (future only) sorted by popularity desc using Discover with primary_release_date.gte
export const fetchUpcomingMoviesFuturePopular = async (page = 1, region) => {
  const today = new Date().toISOString().slice(0, 10);
  const params = {
    sort_by: 'popularity.desc',
    include_adult: false,
    page,
    'primary_release_date.gte': today,
    // include all release types: 1(Premiere),2(Theatrical limited),3(Theatrical),4(Digital),5(Physical),6(TV)
    with_release_type: '1|2|3|4|5|6',
  };
  if (region) params.region = region;
  const res = await api.get(`/discover/movie`, { params });
  const results = Array.isArray(res?.data?.results) ? res.data.results : [];
  const futureOnly = results.filter((it) => {
    const dateStr = (it?.release_date || it?.primary_release_date || '').trim();
    return dateStr && dateStr >= today;
  });
  const cleaned = cleanResults(futureOnly);
  const sorted = cleaned.sort((a, b) => {
    const da = (a?.release_date || a?.primary_release_date || '').trim();
    const db = (b?.release_date || b?.primary_release_date || '').trim();
    if (da && db && da !== db) return da.localeCompare(db);
    if (!da && db) return 1;
    if (da && !db) return -1;
    return (b.popularity || 0) - (a.popularity || 0);
  });
  return { ...res, data: { ...res.data, results: sorted } };
};

// Stricter upcoming: future releases only (uses Discover)
export const fetchUpcomingStrict = (page = 1, region) => {
  const today = new Date().toISOString().slice(0, 10);
  const params = {
    sort_by: "primary_release_date.asc",
    include_adult: false,
    page,
    'primary_release_date.gte': today,
  };
  if (region) params.region = region;
  return api.get(`/discover/movie`, { params }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// Preferred: strict upcoming movies (future dates only) with default region for better accuracy
export const fetchUpcomingMoviesStrict = (page = 1, region = 'PL') => {
  const today = new Date().toISOString().slice(0, 10);
  return api.get(`/discover/movie`, {
    params: {
      // Use release_date fields to respect regional releases
      sort_by: 'release_date.asc',
      include_adult: false,
      page,
      region,
      // Only future releases from today onward
      'release_date.gte': today,
      // Limit to Theatrical (3) and Theatrical (limited) (2)
      with_release_type: '2|3',
    }
  }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// Strict upcoming TV (future first_air_date only)
export const fetchUpcomingTVStrict = (page = 1, region = 'PL') => {
  const today = new Date().toISOString().slice(0, 10);
  return api.get(`/discover/tv`, {
    params: {
      sort_by: 'first_air_date.asc',
      include_adult: false,
      page,
      'first_air_date.gte': today,
      // region isn't officially used for TV discover filtering, but keep signature consistent
    }
  }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// Combined: Upcoming Movies + TV (future only), merged and sorted by popularity desc
export const fetchUpcomingCombinedPopular = async (opts = {}) => {
  // Back-compat: if called with a string, treat it as region
  const region = typeof opts === 'string' ? opts : (opts.region || 'PL');
  const companyIds = Array.isArray(opts.companyIds) ? opts.companyIds : [];
  const networkIds = Array.isArray(opts.networkIds) ? opts.networkIds : [];
  const page = typeof opts.page === 'number' ? opts.page : 1;

  const today = new Date().toISOString().slice(0, 10);
  const movieParams = {
    sort_by: 'popularity.desc',
    include_adult: false,
    region,
    'release_date.gte': today,
    with_release_type: '2|3',
    page,
  };
  if (companyIds.length) movieParams.with_companies = companyIds.join('|');

  const tvParams = {
    sort_by: 'popularity.desc',
    include_adult: false,
    'first_air_date.gte': today,
    page,
  };
  if (networkIds.length) tvParams.with_networks = networkIds.join('|');

  const [moviesRes, tvRes] = await Promise.all([
    api.get(`/discover/movie`, { params: movieParams }),
    api.get(`/discover/tv`, { params: tvParams }),
  ]);

  const movies = (moviesRes?.data?.results || []).map((s) => ({ ...s, media_type: 'movie' }));
  const tv = (tvRes?.data?.results || []).map((s) => ({ ...s, media_type: 'tv' }));
  const combinedRaw = [...movies, ...tv].filter(Boolean);
  const combined = cleanResults(combinedRaw).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  // Return axios-like response shape for useFetch compatibility
  return { data: { results: combined } };
};

export const fetchDetails = (mediaType, id) =>
  api.get(`/${mediaType}/${id}`, {
    params: {
      language: 'pl-PL',
      include_video_language: 'pl,en,null',
      include_image_language: 'pl,en,null',
      append_to_response:
        // Include release_dates for movies to choose regional premieres
        (mediaType === 'movie'
          ? 'videos,credits,recommendations,release_dates,translations,images'
          : 'videos,credits,recommendations,seasons,translations,images'),
    },
  });

export const fetchCollection = (collectionId, { language = 'pl-PL', fallbackLanguage = 'en-US' } = {}) => {
  return api
    .get(`/collection/${collectionId}`, {
      params: { language },
    })
    .catch((error) => {
      if (!fallbackLanguage || language === fallbackLanguage) {
        throw error;
      }
      return api.get(`/collection/${collectionId}`, {
        params: { language: fallbackLanguage },
      });
    });
};
export const searchMulti = (query, page = 1) =>
  api
    .get("/search/multi", { params: { query, page, include_adult: false } })
    .then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

// Search helpers
export const searchCompanies = (query, page = 1) =>
  api.get('/search/company', { params: { query, page } });

// TMDB v3 does not expose /search/network. Use company search as a best-effort fallback to avoid 404 noise.
export const searchNetworks = (query, page = 1) =>
  api.get('/search/company', { params: { query, page } });

// Resolve brand names to IDs, then fetch combined upcoming filtered by those IDs
export const fetchUpcomingCombinedByBrands = async ({
  companyNames = [],
  networkNames = [],
  region = 'PL',
  page = 1,
} = {}) => {
  // Lookup company IDs
  const companyPromises = companyNames.map(async (name) => {
    try {
      const res = await searchCompanies(name);
      const id = res?.data?.results?.[0]?.id;
      return id || null;
    } catch (e) {
      return null;
    }
  });
  // Lookup network IDs
  const networkPromises = networkNames.map(async (name) => {
    try {
      const res = await searchNetworks(name);
      const id = res?.data?.results?.[0]?.id;
      return id || null;
    } catch (e) {
      return null;
    }
  });

  const [companyIds, networkIds] = await Promise.all([
    Promise.all(companyPromises),
    Promise.all(networkPromises),
  ]);

  const filteredCompanyIds = companyIds.filter(Boolean);
  const filteredNetworkIds = networkIds.filter(Boolean);

  return fetchUpcomingCombinedPopular({
    region,
    page,
    companyIds: filteredCompanyIds,
    networkIds: filteredNetworkIds,
  });
};

// Helper to get full image URL
export const getImageUrl = (path, size = "original") => {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
};

// Fetch genres - useful for filtering or displaying
export const fetchGenres = (mediaType = "movie") => {
  const type = mediaType === "anime" ? "tv" : mediaType;
  return api.get(`/genre/${type}/list`);
};


export const fetchGenreMovies = (genreId, page = 1, options = {}) => {
  const { providerIds, watchRegion = 'PL', companyIds, signal } = options || {};
  const params = {
    with_genres: genreId,
    page,
    include_adult: false,
  };

  if (Array.isArray(providerIds) && providerIds.length) {
    params.watch_region = watchRegion;
    params.with_watch_providers = providerIds.join('|');
  }

  if (Array.isArray(companyIds) && companyIds.length) {
    params.with_companies = companyIds.join('|');
  }

  return api.get("/discover/movie", { params, signal })
    .then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

export const fetchGenreTVShows = (genreId, page = 1) =>
  api.get("/discover/tv", {
    params: {
      with_genres: genreId,
      page,
    },
  }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

export const fetchAnimeTV = (genreId = 16, page = 1, options = {}) => {
  const { providerIds = POPULAR_STREAMING_PROVIDER_IDS, watchRegion = 'PL', signal } = options || {};
  const params = {
    with_genres: genreId,
    with_origin_country: "JP",
    page,
    include_adult: false,
  };

  if (Array.isArray(providerIds) && providerIds.length) {
    params.watch_region = watchRegion;
    params.with_watch_providers = providerIds.join('|');
  }

  return api.get("/discover/tv", { params, signal });
};

// Popular Anime TV (JP origin) without selecting a specific genre
export const fetchPopularAnimeTV = (page = 1, options = {}) => {
  const { providerIds = POPULAR_STREAMING_PROVIDER_IDS, watchRegion = 'PL', signal } = options || {};
  const params = {
    with_origin_country: "JP",
    sort_by: "popularity.desc",
    page,
    include_adult: false,
  };

  if (Array.isArray(providerIds) && providerIds.length) {
    params.watch_region = watchRegion;
    params.with_watch_providers = providerIds.join('|');
  }

  return api.get("/discover/tv", { params, signal })
    .then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));
};

// TV by network (e.g., Netflix = 213)
export const fetchTVByNetwork = (networkId = 213, page = 1) =>
  api.get('/discover/tv', {
    params: {
      with_networks: networkId,
      sort_by: 'popularity.desc',
      page,
    },
  }).then((res) => ({ ...res, data: { ...res.data, results: cleanResults(res?.data?.results) } }));

export default api;
