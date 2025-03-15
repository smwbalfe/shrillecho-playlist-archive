import { Plus } from "lucide-react";

export const PlaylistInput = ({
  inputValue,
  handleInputChange,
  handleKeyPress,
  handleAddPlaylist,
}: {
  inputValue: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAddPlaylist: () => void;
}) => {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500">
        Add Playlist
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Spotify playlist URL or ID"
          className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 
                  focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
        />
        <button
          onClick={handleAddPlaylist}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 
                  transition-colors border border-zinc-700 flex items-center justify-center"
          aria-label="Add playlist"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
