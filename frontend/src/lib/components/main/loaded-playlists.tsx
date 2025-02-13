"use client"
import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react'
import { useApp } from '@/src/lib/context/app-state'
import { api } from '@/src/lib/services/api'
import { parseSpotifyId } from '../../utils/utils'

// Define interfaces for the app context
interface AppState {
    playlists: string[]
    genres: string[]
    selectedGenres: string[]
    // Add other app state properties as needed
}

interface AppContext {
    app: AppState
    setApp: React.Dispatch<React.SetStateAction<AppState>>
}

export const LoadedPlaylists: React.FC = () => {
    const [playlists, setPlaylists] = useState<string[]>([])
    const [inputValue, setInputValue] = useState<string>('')
    const [genres, setGenres] = useState<string[]>([])
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const { app, setApp } = useApp() as AppContext

    useEffect(() => {
        setApp(prev => ({
            ...prev,
            playlists,
            genres,
            selectedGenres
        }))
    }, [playlists, genres, selectedGenres, setApp])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void =>
        setInputValue(e.target.value)

    const handleAddPlaylist = (): void => {
        if (inputValue.trim()) {
            setPlaylists(prev => [...prev, inputValue.trim()])
            setInputValue('')
        }
    }

    const handleRemovePlaylist = (index: number): void => {
        setPlaylists(prev => prev.filter((_, i) => i !== index))
    }

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') handleAddPlaylist()
    }

    const getGenres = async (): Promise<void> => {
        try {
            if (!playlists.length) return
            const genreData: string[] = await api.get(`/spotify/playlists/genres?id=${parseSpotifyId(playlists[0])}`)
            setGenres(genreData)
            setSelectedGenres([])
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const toggleGenre = (genre: string): void => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header Section */}
                <div className="bg-slate-800 p-6">
                    <h2 className="text-xl font-semibold text-white">Load Playlists</h2>
                    <p className="text-slate-400 mt-1">Genre filtering & Duplicate removal</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Input Section */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-700">Add New Playlist</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                placeholder="Paste Spotify playlist URL or ID"
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleAddPlaylist}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Playlists Section */}
                    {playlists.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-slate-700">Your Playlists</h3>
                            <div className="space-y-2">
                                {playlists.map((playlist, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-slate-600 text-sm break-all">{playlist}</span>
                                        <button
                                            onClick={() => handleRemovePlaylist(index)}
                                            className="opacity-0 group-hover:opacity-100 ml-2 text-slate-400 hover:text-red-500 px-2 py-1 rounded transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={getGenres}
                                className="w-full mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                                Analyze Genres
                            </button>
                        </div>
                    )}
                    {genres.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-slate-700">Select Genres</h3>
                            <div className="relative w-full">
                                <div className="max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {genres.map((genre, index) => (
                                            <button
                                                key={index}
                                                onClick={() => toggleGenre(genre)}
                                                className={`px-4 py-2 rounded-full text-sm transition-all ${selectedGenres.includes(genre)
                                                        ? 'bg-blue-100 text-blue-600 border border-blue-500'
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-300 border border-slate-200'
                                                    }`}
                                            >
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LoadedPlaylists