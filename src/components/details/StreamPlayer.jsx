import React from 'react';
const StreamPlayer = ({
  mediaType,
  title,
  streamEmbedUrl,
  seasons,
  selectedSeason,
  selectedEpisode,
  onSeasonChange,
  onEpisodeChange,
  episodesForSelectedSeason,
  onError,
  layout = "stack",
  children = null,
}) => {
  mediaType = mediaType === 'anime' ? 'tv' : mediaType;
  const isTv = mediaType === "tv";

  const filteredSeasons = isTv && Array.isArray(seasons)
    ? seasons.filter((s) => s.season_number > 0 && s.episode_count > 0)
    : [];

  const commonSelectClasses =
    "bg-zinc-800 border border-zinc-600 text-white text-sm rounded-lg focus:ring-brand-yellow focus:border-brand-yellow px-2.5 py-2";

  const handleSeasonChange = (value) => {
    onSeasonChange(Number(value));
    onEpisodeChange(1);
  };

  const seasonInlineControl = isTv && filteredSeasons.length ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/70">Sezon</span>
      <select
        value={selectedSeason}
        onChange={(e) => handleSeasonChange(e.target.value)}
        className={commonSelectClasses}
      >
        {filteredSeasons.map((season) => (
          <option key={season.id} value={season.season_number}>
            {season.name || `S${season.season_number}`}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  const episodeInlineControl = isTv && episodesForSelectedSeason.length ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/70">Odc.</span>
      <select
        value={selectedEpisode}
        onChange={(e) => onEpisodeChange(Number(e.target.value))}
        className={commonSelectClasses}
      >
        {episodesForSelectedSeason.map((epNum) => (
          <option key={epNum} value={epNum}>
            {epNum}
          </option>
        ))}
      </select>
    </div>
  ) : null;

  const stackControls = isTv && filteredSeasons.length ? (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-brand-card rounded-lg">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="season-select"
          className="block text-sm font-medium text-brand-text-secondary"
        >
          Season:
        </label>
        <select
          id="season-select"
          value={selectedSeason}
          onChange={(e) => handleSeasonChange(e.target.value)}
          className="bg-zinc-700 border border-zinc-600 text-white text-sm rounded-lg focus:ring-brand-yellow focus:border-brand-yellow block w-full p-2.5"
        >
          {filteredSeasons.map((season) => (
            <option key={season.id} value={season.season_number}>
              {season.name || `Season ${season.season_number}`} ({season.episode_count} ep.)
            </option>
          ))}
        </select>
      </div>
      {episodesForSelectedSeason.length > 0 && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="episode-select"
            className="block text-sm font-medium text-brand-text-secondary"
          >
            Episode:
          </label>
          <select
            id="episode-select"
            value={selectedEpisode}
            onChange={(e) => onEpisodeChange(Number(e.target.value))}
            className="bg-zinc-700 border border-zinc-600 text-white text-sm rounded-lg focus:ring-brand-yellow focus:border-brand-yellow block w-full p-2.5"
          >
            {episodesForSelectedSeason.map((epNum) => (
              <option key={epNum} value={epNum}>
                Episode {epNum}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  ) : null;

  const playerFrame = (
    <div
      className="relative w-full max-w-6xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      style={{ aspectRatio: '16 / 9' }}
    >
      {streamEmbedUrl && (
        <iframe
          key={streamEmbedUrl}
          src={streamEmbedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          onError={onError}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );

  if (layout === "inline") {
    return (
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        <div className="w-full lg:flex-[4] xl:flex-[5]">{playerFrame}</div>
        <div className="w-full lg:flex-[2] xl:max-w-sm bg-zinc-900/80 rounded-lg p-3 flex flex-col gap-3">
          <h2 className="text-base font-semibold text-white/90 truncate" title={title}>{title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {seasonInlineControl}
            {episodeInlineControl}
          </div>
          {children ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto md:px-6 lg:px-10 py-3 md:py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-3 md:px-4 py-3 bg-black/40 rounded-t-xl md:rounded-t-2xl">
        <h2 className="text-lg md:text-xl font-semibold text-white/90 truncate" title={title}>{title}</h2>
        {(seasonInlineControl || episodeInlineControl) && (
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {seasonInlineControl}
            {episodeInlineControl}
          </div>
        )}
      </div>

      {stackControls && <div className="px-3 md:px-4">{stackControls}</div>}

      <div className="mt-4 md:mt-6 flex justify-center px-2 sm:px-4">
        {playerFrame}
      </div>

      {children && <div className="mt-5 md:mt-6 px-3 md:px-4">{children}</div>}
    </section>
  );
}
;

export default StreamPlayer;