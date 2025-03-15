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

export interface Playlist {
  name: string;
  cover_art: string;
  uri: string;
  saves: number;
}

export interface SimpleTrack {
  name: string;
  id: string;
  artists: ArtistSimple[];
  playcount: string;
  coverArt: CoverArt;
  genres: string[];
}

export type ViewState = "playlists" | "tracks";
