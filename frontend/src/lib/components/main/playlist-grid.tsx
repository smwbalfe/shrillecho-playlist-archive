"use client"
import { FC, useState } from 'react'
import { api } from '@/src/lib/services/api'
import { Music2, Loader2, ListMusic } from 'lucide-react'
import { useApp } from '@/src/lib/context/app-state'
import { parseSpotifyId } from '../../utils/utils'

import { toast } from "sonner"

interface Playlist {
    name: string
    cover_art: string
    uri: string
    saves: number
}

interface SimpleTrack {
    name: string;
    id: string;
    artists: ArtistSimple[];
    playcount: string;
    coverArt: CoverArt;
}

interface ArtistSimple {
    name: string;
}

interface CoverArt {
    sources: Source[];
}

interface Source {
    url: string;
    height: number;
    width: number;
}

type ViewState = 'playlists' | 'tracks';

export const PlaylistGrid: FC = () => {
    const [isScraping, setIsScraping] = useState(false)
    const [isLoadingTracks, setIsLoadingTracks] = useState(false)
    const [playlistData, setPlaylistData] = useState<Playlist[]>([])
    const [tracks, setTracks] = useState<SimpleTrack[]>([])
    const [limit, setLimit] = useState(5)
    const [filterError, setFilterError] = useState<string>('')
    const [activeView, setActiveView] = useState<ViewState>('playlists')
    const { app } = useApp();

    const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value)
        if (!isNaN(value) && value > 0) {
            setLimit(value)
        }
    }

    const scrapePlaylists = async () => {
        try {
            setIsScraping(true)
            const data = await api.get(`/scrape/playlists?limit=${limit}&pool=${app.activeScrapes[0]}`)
            setPlaylistData(data)
            setActiveView('playlists')
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setIsScraping(false)
        }
    }
   
    const fetchTracks = async () => {
        try {
            setIsLoadingTracks(true)
            setFilterError('')
            const data = await api.post('/spotify/playlist/filter', {
                genres: app.selectedGenres,
                playlists_to_filter: playlistData.map(p => p.uri.split(':')[2]),
                playlists_to_remove: app.playlists.map(p => parseSpotifyId(p)),
                apply_unique: true,
                track_limit: 99
            });
            console.log("setting tracks", data.tracks)
            setTracks(data.tracks)
            setActiveView('tracks')
        } catch (error) {
            console.error('Error fetching tracks:', error)
        } finally {
            setIsLoadingTracks(false)
        }
    }

    const createPlaylist = async () => {
        const data = await api.post('/spotify/playlist/create', {
            tracks: tracks.map(track => track.id)
        })

        const spotifyAppUri = data.link.replace('https://open.spotify.com/', 'spotify:').replace(/\//g, ':');

        toast("Playlist created", {
            description: "Your new playlist is ready",
            action: {
                label: "View on Spotify",
                onClick: () => window.open(spotifyAppUri, "_self"),
            },
        })
    }

    const PlaylistView = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {playlistData.map((playlist) => (
                <div key={playlist.uri} className="bg-white rounded shadow">
                    <img
                        src={playlist.cover_art || '/api/placeholder/400/400'}
                        alt={playlist.name}
                        className="w-full aspect-square object-cover"
                    />
                    <div className="p-2">
                        <h3 className="font-medium truncate">{playlist.name}</h3>
                        <a
                            href={playlist.uri}
                            className="text-blue-600"
                        >
                            Open in Spotify
                        </a>
                    </div>
                </div>
            ))}
        </div>
    )
    const TracksView = () => {
        const openSpotify = (trackId: string) => {
            window.location.href = `spotify:track:${trackId}`;
        };


        if (tracks.length === 0) {
            return (
                <div className="text-center p-8">
                    <ListMusic className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>no tracks match your filter</p>
                </div>
            );
        } 

        const sortedTracks = [...tracks].sort((a, b) => (Number(a.playcount) - Number(b.playcount)));

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button onClick={createPlaylist}>
                    create playlist
                </button>
                {sortedTracks.map((track) => (
                    <div
                        key={track.id}
                        className="bg-white p-3 rounded shadow flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => openSpotify(track.id)}
                    >
                        <img
                            src={track?.coverArt?.sources?.[0]?.url ?? '/api/placeholder/64/64'}
                            alt={track?.name ?? 'Track artwork'}
                            className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                            <h4 className="font-medium">{track.name}</h4>
                            <p className="text-sm text-gray-600">
                                {track.artists?.map(artist => artist.name).join(', ')}
                            </p>
                            <p className="text-xs text-gray-500">Plays: {track.playcount}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 bg-gray-50">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl mb-4">Music Discovery</h2>
                    <div className="flex gap-4 items-center flex-wrap mb-6">
                        <div className="flex items-center gap-2">
                            <label htmlFor="limit" className="text-sm">
                                Number of playlists:
                            </label>
                            <input
                                id="limit"
                                type="number"
                                min="1"
                                value={limit}
                                onChange={handleLimitChange}
                                className="w-20 border rounded px-2 py-1"
                            />
                        </div>
                        <button
                            onClick={scrapePlaylists}
                            disabled={isScraping}
                            className="bg-blue-600 text-white p-2 rounded disabled:opacity-50"
                        >
                            {isScraping ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Music2 className="w-4 h-4 inline mr-2" />
                                    Find Playlists
                                </>
                            )}
                        </button>
                        <button
                            onClick={fetchTracks}
                            disabled={isLoadingTracks}
                            className="bg-green-600 text-white p-2 rounded disabled:opacity-50"
                        >
                            {isLoadingTracks ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                    Loading Tracks...
                                </>
                            ) : (
                                <>
                                    <ListMusic className="w-4 h-4 inline mr-2" />
                                    Load Tracks
                                </>
                            )}
                        </button>
                    </div>

                    {/* Tabs */}
             
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveView('playlists')}
                                className={`pb-2 px-1 ${activeView === 'playlists'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Music2 className="w-4 h-4 inline mr-2" />
                                Playlists {playlistData.length > 0 && `(${playlistData.length})`}
                            </button>
                            <button
                                onClick={() => setActiveView('tracks')}
                                className={`pb-2 px-1 ${activeView === 'tracks'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ListMusic className="w-4 h-4 inline mr-2" />
                                Tracks {tracks.length > 0 && `(${tracks.length})`}
                            </button>
                        </div>
                    </div>

                    {activeView === 'playlists' && (
                        playlistData.length === 0 ? (
                            <div className="text-center p-8">
                                <Music2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Start your search to discover playlists</p>
                            </div>
                        ) : (
                            <PlaylistView />
                        )
                    )}

                    {activeView === 'tracks' && (
                        <TracksView />
                    )}
                </div>
            </div>
        </div>
    )
}

export default PlaylistGrid