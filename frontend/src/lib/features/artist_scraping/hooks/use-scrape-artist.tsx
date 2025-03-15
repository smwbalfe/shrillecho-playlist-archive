import { api } from "@/src/lib/services/api";
import { Artist } from "@/src/lib/features/artist_scraping/types/types";
import { useState } from "react";
import { useApp } from "@/src/lib/context/app-state";

export const useScrapeArtists = () => {
  const [artist, setArtist] = useState<string>("");
  const [depth, setDepth] = useState("2");
  const [isScraping, setIsScraping] = useState(false);
  const [artistData, setArtistData] = useState<Artist[]>([]);

  const { app } = useApp();
  const playlists = app?.playlists || [];

  const scrapeArtists = async () => {
    try {
      setIsScraping(true);
      const response = await api.post("/scrape/artists", {
        artist: artist,
        depth: parseInt(depth),
      });
      const artistsArray =
        response.artists?.filter(
          (artist: any) => artist.id && artist.profile?.name,
        ) || [];
      setArtistData(artistsArray);
      console.log("Processed artist data:", artistsArray);
    } catch (error) {
      console.error("Error scraping artists:", error);
      setArtistData([]);
    } finally {
      setIsScraping(false);
    }
  };

  const scrapePlaylistSeed = async () => {
    try {
      setIsScraping(true);
      const response = await api.get(`/scrape/playlists_seed?id=${playlists[0]}"`);
      console.log(response);
    } catch (error) {
      console.error("Error scraping artists:", error);
      setArtistData([]);
    } finally {
      setIsScraping(false);
    }
  };

  return {
    artist,
    setArtist,
    depth,
    setDepth,
    isScraping,
    artistData,
    scrapeArtists,
    scrapePlaylistSeed,
    playlists,
  };
};
