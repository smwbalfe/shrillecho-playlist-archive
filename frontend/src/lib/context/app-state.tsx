import React, { createContext, useContext, useState } from "react";
import { AppContextType, AppProviderProps, AppState } from "./types";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useSources must be used within a SourceProvider");
  }
  return context;
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [app, setApp] = useState<AppState>({
    playlists: [],
    genres: [],
    selectedGenres: [],
    scrapes: [],
    activeScrapes: [],
  });

  return (
    <AppContext.Provider value={{ app, setApp }}>
      {children}
    </AppContext.Provider>
  );
};
