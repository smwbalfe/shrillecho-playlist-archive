import { HeaderProps } from "../../types/types"

export const Header = ({ showArtists, setShowArtists }: HeaderProps) => {
    return (
        <header className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        shrillecho playlist
                    </h1>
                    <button
                        onClick={() => setShowArtists(prev => !prev)}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-white shadow hover:bg-purple-700"
                    >
                        {showArtists ? 'Switch to Playlist Mining' : 'Switch to Artist Mining'}
                    </button>
                </div>
            </div>
        </header>
    )
}