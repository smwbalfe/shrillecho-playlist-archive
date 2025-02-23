"use client"

import { useState } from 'react';
import { api } from '@/src/lib/services/api';
import { Artist } from '../../types/types';
import { ArtistGridUI } from './artist-ui';

export const ArtistGridContainer = () => {
    const [artist, setArtist] = useState("");
    const [depth, setDepth] = useState("2");
    const [isScraping, setIsScraping] = useState(false);
    const [artistData, setArtistData] = useState<Artist[]>([]);
    
    const scrapeArtists = async () => {
        try {
            setIsScraping(true);
            const response = await api.post('/scrape/artists', {
                artist,
                depth: parseInt(depth)
            });
            const artistsArray = response.artists?.filter((artist: any) => artist.id && artist.profile?.name) || [];
            setArtistData(artistsArray);
            console.log('Processed artist data:', artistsArray);
        } catch (error) {
            console.error('Error scraping artists:', error);
            setArtistData([]);
        } finally {
            setIsScraping(false);
        }
    };

    return (
        <ArtistGridUI
            artist={artist}
            depth={depth}
            isScraping={isScraping}
            onArtistChange={setArtist}
            onDepthChange={setDepth}
            onCollectClick={scrapeArtists}
        />
    );
};