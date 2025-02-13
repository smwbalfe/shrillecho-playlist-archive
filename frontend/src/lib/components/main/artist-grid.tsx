"use client"
import { FC, useState } from 'react'
import { api } from '@/src/lib/services/api'

interface Artist {
    id: string
    profile?: {
        name: string
    }
    visuals?: {
        avatarImage?: {
            sources?: Array<{
                url: string
            }>
        }
    }
    uri: string
}

export const ArtistGrid: FC = () => {
    const [artist, setArtist] = useState("")
    const [depth, setDepth] = useState("2")
    const [isScraping, setIsScraping] = useState(false)
    const [artistData, setArtistData] = useState<Artist[]>([])

    const scrapeArtists = async () => {
        try {
            setIsScraping(true)
            const response = await api.post('/scrape/artists', {
                artist,
                depth: parseInt(depth)
            })
            const artistsArray = response.artists?.filter((artist: any) => artist.id && artist.profile?.name) || [];
            setArtistData(artistsArray)
            console.log('Processed artist data:', artistsArray)
        } catch (error) {
            console.error('Error scraping artists:', error)
            setArtistData([]) 
        } finally {
            setIsScraping(false)
        }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-col gap-3 w-full max-w-xs mb-8">
                <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Enter Artist ID"
                    className="px-3 py-2 border rounded"
                />
                <input
                    type="number"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value)}
                    placeholder="Depth"
                    min="1"
                    max="15"
                    className="px-3 py-2 border rounded"
                />
                <button
                    onClick={scrapeArtists}
                    disabled={isScraping || !artist}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 transition-colors"
                >
                    {isScraping ? 'Scraping...' : 'Scrape Artists'}
                </button>
            </div>

            {artistData.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No artists found
                </div>
            ) : (
                <div className="container mx-auto p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {artistData.map((artist) => {
                            const avatarUrl = artist.visuals?.avatarImage?.sources?.[0]?.url || '/api/placeholder/100/100';
                            const artistName = artist.profile?.name || 'Unknown Artist';

                            return (
                                <div
                                    key={artist.id}
                                    className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                                >
                                    <div className="w-32 h-32 mb-4 overflow-hidden rounded-full">
                                        <img
                                            src={avatarUrl}
                                            alt={artistName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-800 text-center">
                                        {artistName}
                                    </h3>
                                    <a
                                        href={artist.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 text-sm text-blue-500 hover:text-blue-600"
                                    >
                                        View on Spotify
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}