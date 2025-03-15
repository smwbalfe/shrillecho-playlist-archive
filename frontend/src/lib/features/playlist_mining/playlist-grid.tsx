"use client";
import { FC } from "react";
import { PlaylistGrid } from "./playlist-grid-ui";
import { usePlaylistGrid } from "./hooks/use-playlist-grid";

export const PlaylistGridContainer: FC = () => {
  const {
    isScraping,
    isLoadingTracks,
    playlistData,
    tracks,
    limit,
    activeView,
    activeTrackPopup,
    handleLimitChange,
    scrapePlaylists,
    fetchTracks,
    createPlaylist,
    openSpotify,
    toggleTrackPopup,
    closeAllPopups,
    setActiveView,
  } = usePlaylistGrid();

  return (
    <PlaylistGrid
      isScraping={isScraping}
      isLoadingTracks={isLoadingTracks}
      playlistData={playlistData}
      tracks={tracks}
      limit={limit}
      activeView={activeView}
      activeTrackPopup={activeTrackPopup}
      handleLimitChange={handleLimitChange}
      scrapePlaylists={scrapePlaylists}
      fetchTracks={fetchTracks}
      createPlaylist={createPlaylist}
      openSpotify={openSpotify}
      toggleTrackPopup={toggleTrackPopup}
      closeAllPopups={closeAllPopups}
      setActiveView={setActiveView}
    />
  );
};
