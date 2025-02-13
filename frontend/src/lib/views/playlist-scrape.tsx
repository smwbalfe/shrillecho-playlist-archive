"use client"
import React, { useState } from 'react';
import { Card, CardContent } from '@/src/lib/components/ui/card';
import { Input } from '@/src/lib/components/ui/input';
import { Button } from '@/src/lib/components/ui/button';

interface Playlist {
    name: string;
    cover_art: string;
    uri: string;
}

export const PlaylistScrape = () => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [artist, setArtist] = useState('');
    const [depth, setDepth] = useState(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/scrape_playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artist, depth })
            });
            const data = await response.json();
            setPlaylists(data);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    };

    const openInSpotify = (uri: string) => {
        window.open(uri, '_self');
    };

    return (
        <div className="p-4">
            <div className="max-w-6xl mx-auto">
                <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
                    <Input
                        placeholder="Artist name"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        className="w-64"
                    />
                    <Input
                        type="number"
                        placeholder="Depth"
                        value={depth}
                        onChange={(e) => setDepth(Number(e.target.value))}
                        className="w-20"
                    />
                    <Button type="submit">Search</Button>
                </form>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map((playlist) => (
                        <Card
                            key={playlist.uri}
                            className="overflow-hidden cursor-pointer"
                            onClick={() => openInSpotify(playlist.uri)}
                        >
                            <CardContent className="p-4">
                                <div className="aspect-square mb-2 relative overflow-hidden rounded-md">
                                    <img
                                        src={playlist.cover_art}
                                        alt={playlist.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h3 className="font-semibold truncate">{playlist.name}</h3>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};