import { Button } from "@/src/lib/components/ui/button";

interface HeaderProps {
  showArtists: boolean;
  setShowArtists: (value: React.SetStateAction<boolean>) => void;
}

export const Header = ({ showArtists, setShowArtists }: HeaderProps) => {
  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-sm">
      <div className="container max-w-4xl mx-auto py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-gray-400"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <h1 className="text-lg font-medium tracking-tight text-white">
            shrillecho
          </h1>
        </div>

        <Button
          onClick={() => setShowArtists((prev) => !prev)}
          className="bg-gray-700 hover:bg-gray-600 text-gray-200 rounded px-3 py-1 text-sm transition-colors"
        >
          {showArtists ? "Playlist" : "Artists"}
        </Button>
      </div>
    </header>
  );
};
