"use client";
import { useState } from "react";
import { useAuth } from "@/src/lib/features/login/hooks/use-auth";
import { AppProvider } from "@/src/lib/context/app-state";
import { Welcome } from "@/src/lib/features/login/login";
import { Header } from "@/src/lib/features/home/components/header";
import { ArtistGrid, PlaylistSeed } from "../artist_scraping/artist-grid";
import { WebSocketListener } from "../artist_scraping/websocket";
import { PlaylistGridContainer } from "@/src/lib/features/playlist_mining/playlist-grid";
import { LoadedPlaylists } from "../loaded_playlists/loaded-playlists";
import { PlaylistGrid } from "../playlist_mining/playlist-grid-ui";

export const Index = (): JSX.Element => {
  const { isLoading, hasSession, registerAnomUser } = useAuth();
  const [showArtists, setShowArtists] = useState(true);

  const content = hasSession ? (
    <main className="min-h-screen bg-gray-50">
      <AppProvider>
        <Header showArtists={showArtists} setShowArtists={setShowArtists} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-6">
            <aside className="space-y-6">
              <LoadedPlaylists />
            </aside>
            <section>
              {showArtists ? <ArtistGrid /> : <PlaylistGridContainer />}
              <PlaylistSeed />
            </section>
          </div>
        </div>
        <div className="fixed bottom-4 right-4 max-w-sm">
          <WebSocketListener />
        </div>
      </AppProvider>
    </main>
  ) : (
    <Welcome isLoading={isLoading} registerAnomUser={registerAnomUser} />
  );

  return content;
};
