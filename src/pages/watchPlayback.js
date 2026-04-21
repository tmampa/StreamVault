export function getPlayerRouteSyncTarget({ isMovie, currentSeason, currentEpisode, playerEvent }) {
  if (isMovie) {
    return null;
  }

  const playerSeason = Number(playerEvent?.season);
  const playerEpisode = Number(playerEvent?.episode);

  if (!Number.isInteger(playerSeason) || playerSeason < 1) {
    return null;
  }

  if (!Number.isInteger(playerEpisode) || playerEpisode < 1) {
    return null;
  }

  if (playerSeason === currentSeason && playerEpisode === currentEpisode) {
    return null;
  }

  return {
    season: playerSeason,
    episode: playerEpisode,
  };
}
