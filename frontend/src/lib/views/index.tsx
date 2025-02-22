"use client"
import { useState } from 'react'
import { useAuth } from '@/src/lib/hooks/use-auth'
import { ArtistGrid } from '@/src/lib/components/main/artist-grid'
import { PlaylistGrid } from '@/src/lib/components/main/playlist-grid'
import { LoadedPlaylists } from '@/src/lib/components/main/loaded-playlists'
import { AppProvider } from '../context/app-state'
import Welcome from '../components/main/login'
import WebSocketListener from '../services/websocket'

export const Index = (): JSX.Element => {
    const { isLoading, hasSession, registerAnomUser } = useAuth()
    const [showArtists, setShowArtists] = useState(true)

    if (!hasSession) {
        return <Welcome isLoading={isLoading} registerAnomUser={registerAnomUser} />
    }

    return (
        <AppProvider>
            <div className="min-h-screen bg-gray-50 text-red-500">
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                shrillecho playlist
                            </h1>
                            <button
                                onClick={() => setShowArtists(prev => !prev)}
                                className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow hover:bg-purple-700"
                            >
                                {showArtists ? 'Switch to Playlist Mining' : 'Switch to Artist Mining'}
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-[350px,1fr]">
                        <aside>
                            <LoadedPlaylists />
                        </aside>
                        <div>
                            <div>
                                {showArtists ? <ArtistGrid /> : <PlaylistGrid />}
                            </div>
                            <div>
                                <WebSocketListener />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppProvider>
    )
}

export default Index