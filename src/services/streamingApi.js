export const STREAMING_PROVIDERS = [
  {
    id: 'vidsrc',
    name: 'VidSrc',
    getMovieUrl: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    getTvUrl: (id, season, episode) =>
      `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  {
    id: 'GodDrive',
    name: 'GodDrive',
    getMovieUrl: (id) => `https://godriveplayer.com/player.php?imdb=${id}`,
    getTvUrl: (id, season, episode) =>
      `https://godriveplayer.com/player.php?imdb=${id}&s=${season}&e=${episode}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id, season, episode) =>
      `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  },
];