import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ScrapeResponse {
    id: number;
    total_artists: number;
    seed_artist: string;
    depth: number;
}

interface AppState {
    playlists: string[]
    genres: string[]
    selectedGenres: string[]
    scrapes: ScrapeResponse[]
    activeScrapes: number[]
}

interface AppContextType {
    app: AppState;
    setApp: React.Dispatch<React.SetStateAction<AppState>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useSources must be used within a SourceProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [app, setApp] = useState<AppState>({
       playlists: [],
       genres: [],
       selectedGenres: [],
       scrapes: [],
       activeScrapes: []
    });

    return (
        <AppContext.Provider value={{ app, setApp }}>
            {children}
        </AppContext.Provider>
    );
};
