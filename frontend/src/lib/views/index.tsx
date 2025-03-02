"use client"

import { useState } from 'react'
import { useAuth } from '@/src/lib/hooks/use-auth'
import { ArtistGridContainer } from '@/src/lib/components/main/artist-grid'
import { PlaylistGrid } from '@/src/lib/components/main/playlist-grid'
import { LoadedPlaylists } from '@/src/lib/components/main/loaded-playlists'
import { AppProvider } from '../context/app-state'
import Welcome from '../components/main/login'
import WebSocketListener from '../services/websocket'
import { Header } from '@/src/lib/components/main/header'

export const Index = (): JSX.Element => {
    const { isLoading, hasSession, registerAnomUser } = useAuth()
    const [showArtists, setShowArtists] = useState(true)

    if (!hasSession) {
        return <Welcome isLoading={isLoading} registerAnomUser={registerAnomUser} />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AppProvider>

            <Header showArtists={showArtists} setShowArtists={setShowArtists} />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-6">
                    <aside className="space-y-6">
                        <LoadedPlaylists />
                    </aside>
                    <section>
                        {showArtists ? <ArtistGridContainer /> : <PlaylistGrid />}
                    </section>
                </div>
            </main>
            <div className="fixed bottom-4 right-4 max-w-sm">
                <WebSocketListener />
            </div>
            </AppProvider>
        </div>
    )
}

export default Index