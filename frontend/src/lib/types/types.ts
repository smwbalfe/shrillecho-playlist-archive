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