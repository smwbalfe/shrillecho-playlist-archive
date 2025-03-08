export interface Artist {
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

export interface ArtistGridUIProps {
    artist: string;
    depth: string;
    isScraping: boolean;
    onArtistChange: (value: string) => void;
    onDepthChange: (value: string) => void;
    onCollectClick: () => void;
}

export interface Playlist {
    name: string
    cover_art: string
    uri: string
    saves: number
}

export interface SimpleTrack {
    name: string;
    id: string;
    artists: ArtistSimple[];
    playcount: string;
    coverArt: CoverArt;
}

export interface ArtistSimple {
    name: string;
}

export interface CoverArt {
    sources: Source[];
}

export interface Source {
    url: string;
    height: number;
    width: number;
}


export type ViewState = 'playlists' | 'tracks';

export interface HeaderProps {
    showArtists: boolean;
    setShowArtists: (value: React.SetStateAction<boolean>) => void;
}

export interface Track {
    playcount: number;
    coverArtUrl: string;
    name: string;
    uri: string;
}
