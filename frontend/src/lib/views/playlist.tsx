"use client"

import Image from 'next/image';
import { useParams } from "next/navigation";
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/src/lib/components/ui/alert';

interface Track {
    playcount: number;
    coverArtUrl: string;
    name: string;
    uri: string;
}

const LoadingSkeleton = () => (
    <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="relative w-full aspect-square mb-4">
            <div className="absolute inset-0 bg-gray-200 rounded" />
        </div>
        <div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
    </div>
);

const LoadingGrid = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 gap-1">
        {[...Array(12)].map((_, index) => (
            <LoadingSkeleton key={index} />
        ))}
    </div>
);

export const PlaylistView = () => {
    const params = useParams();
    const { playlist_id } = params;
    const [playlist, setPlaylist] = useState<Track[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const res = await fetch(`http://localhost:8000/spotify/playlist?id=${playlist_id}`, {
                    cache: 'no-store',
                    credentials: 'include'
                });

                if (!res.ok) {
                    throw new Error(
                        res.status === 404
                            ? 'Playlist not found'
                            : 'Failed to load playlist'
                    );
                }

                const data = await res.json();
                setPlaylist(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaylist();
    }, [playlist_id]);

    const handleClick = async (uri: string) => {
        window.location.href = uri;
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
                <LoadingGrid />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (!playlist || playlist.length === 0) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No tracks found in this playlist
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Playlist Tracks</h1>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 gap-1">
                {playlist.map((track) => (
                    <div
                        key={track.uri}
                        className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                    >
                        <div
                            className="relative w-full aspect-square mb-4 cursor-pointer"
                            onClick={() => handleClick(track.uri)}
                        >
                            <Image
                                src={track.coverArtUrl || "/api/placeholder/400/400"}
                                alt={track.name}
                                fill
                                className="object-cover rounded"
                            />
                        </div>
                        <div>
                            <h2 className="font-semibold truncate">{track.name}</h2>
                            <p className="text-sm text-gray-600">
                                Plays: {track.playcount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlaylistView;