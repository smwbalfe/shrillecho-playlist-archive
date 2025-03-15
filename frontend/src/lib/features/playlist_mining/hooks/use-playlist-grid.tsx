import { useState } from "react";
import { toast } from "sonner";
import {
  Playlist,
  SimpleTrack,
  ViewState,
} from "@/src/lib/features/playlist_mining/types/types";
import { useApp } from "@/src/lib/context/app-state";
import { api } from "@/src/lib/services/api";
import { parseSpotifyId } from "@/src/lib/utils/utils";

export const usePlaylistGrid = () => {
  const [isScraping, setIsScraping] = useState(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState(false);
  const [playlistData, setPlaylistData] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<SimpleTrack[]>([]);
  const [limit, setLimit] = useState(5);
  const [filterError, setFilterError] = useState<string>("");
  const [activeView, setActiveView] = useState<ViewState>("playlists");
  // New state for popup management
  const [activeTrackPopup, setActiveTrackPopup] = useState<string | null>(null);

  const { app } = useApp();

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setLimit(value);
    }
  };

  const scrapePlaylists = async () => {
    try {
      setIsScraping(true);
      const data = await api.get(
        `/scrape/playlists?limit=${limit}&pool=${app.activeScrapes[0]}`,
      );
      setPlaylistData(data);
      setActiveView("playlists");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsScraping(false);
    }
  };

 

  const fetchTracks = async () => {
    try {
      setIsLoadingTracks(true);
      setFilterError("");
      const data = await api.post("/spotify/playlist/filter", {
        genres: app.selectedGenres,
        playlists_to_filter: playlistData.map((p) => p.uri.split(":")[2]),
        playlists_to_remove: app.playlists.map((p) => parseSpotifyId(p)),
        apply_unique: true,
        track_limit: 99,
        monthly_listeners: {
          min: 0,
          max: 10000,
        },
      });
      console.log("setting tracks", data.tracks);
      setTracks(data.tracks);
      setActiveView("tracks");
    } catch (error: any) {
      console.error("Error fetching tracks:", error);
      setFilterError(error.message || "Failed to fetch tracks");
    } finally {
      setIsLoadingTracks(false);
    }
  };

  const createPlaylist = async () => {
    const shortTracks = tracks.slice(0, 99);
    const data = await api.post("/spotify/playlist/create", {
      tracks: shortTracks.map((track) => track.id),
    });
    const spotifyAppUri = data.link
      .replace("https://open.spotify.com/", "spotify:")
      .replace(/\//g, ":");
    toast("Playlist created", {
      description: "Your new playlist is ready",
      action: {
        label: "View on Spotify",
        onClick: () => window.open(spotifyAppUri, "_self"),
      },
    });
  };

  // Updated to handle both popup and Spotify navigation
  const openSpotify = (trackId: string) => {
    window.location.href = `spotify:track:${trackId}`;
  };

  // New functions for popup management
  const toggleTrackPopup = (trackId: string) => {
    setActiveTrackPopup((current) => (current === trackId ? null : trackId));
  };

  const closeAllPopups = () => {
    setActiveTrackPopup(null);
  };

  const sortedTracks = [...tracks].sort(
    (a, b) => Number(a.playcount) - Number(b.playcount),
  );

  return {
    isScraping,
    isLoadingTracks,
    playlistData,
    tracks: sortedTracks,
    limit,
    filterError,
    activeView,
    activeTrackPopup, // Added state
    handleLimitChange,
    scrapePlaylists,
    fetchTracks,
    createPlaylist,
    openSpotify,
    toggleTrackPopup, // Added function
    closeAllPopups, // Added function
    setActiveView,
  };
};
