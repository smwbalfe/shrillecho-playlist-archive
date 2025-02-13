// "use client"
// import { Button } from "@/src/lib/components/ui/button"
// import { useEffect, useState } from "react";
// import { Input } from "@/src/lib/components/ui/input";
// import { Search, Music2 } from "lucide-react";
// import { Card, CardContent } from "@/src/lib/components/ui/card";

// interface Track {
//     playcount: number;
//     coverArtUrl: string;
//     name: string;
//     uri: string;
// }

// interface ScrapeRequest {
//     artist: string;
//     depth: number;
// }

// export const Index = () => {
//     const [artist, setArtist] = useState('');
//     const [depth, setDepth] = useState(1);
//     const [tracks, setTracks] = useState<Track[]>([]);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     const handleSearch = async (e: { preventDefault: () => void }) => {
//         e.preventDefault();
//         if (!artist.trim()) return;

//         setIsLoading(true);
//         setError(null);

//         try {
//             const response = await fetch('http://localhost:8000/archive/playlistScrape', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({
//                     artist,
//                     depth
//                 } as ScrapeRequest)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to fetch tracks');
//             }

//             const data = await response.json();
//             setTracks(data);
//         } catch (error) {
//             console.error('Error fetching tracks:', error);
//             setError('Unable to fetch track data. Please try again.');
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const openInSpotify = (uri: string) => {
//         window.location.href = uri;
//     };

//     const renderEmptyState = () => {
//         if (!artist) {
//             return (
//                 <div className="text-center py-12">
//                     <Music2 className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
//                     <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
//                         Search for artist tracks
//                     </h3>
//                     <p className="text-zinc-600 dark:text-zinc-400">
//                         Enter an artist name to discover related tracks
//                     </p>
//                 </div>
//             );
//         }

//         if (isLoading) {
//             return (
//                 <div className="text-center py-12">
//                     <div className="animate-pulse">
//                         <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
//                         <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto mb-2" />
//                         <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto" />
//                     </div>
//                 </div>
//             );
//         }

//         if (error) {
//             return (
//                 <div className="text-center py-12">
//                     <h1 className="text-red-600">{error}</h1>
//                 </div>
//             );
//         }

//         if (tracks.length === 0) {
//             return (
//                 <div className="text-center py-12">
//                     <Search className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
//                     <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-100 mb-2">
//                         No tracks found
//                     </h3>
//                     <p className="text-zinc-600 dark:text-zinc-400">
//                         Try searching with a different artist name
//                     </p>
//                 </div>
//             );
//         }

//         return null;
//     };

//     return (
//         <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
//             <div className="container mx-auto px-6 py-8">
//                 <div className="max-w-3xl mb-16">
//                     <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-6">
//                         shrillecho
//                         <span className="font-normal text-zinc-500 dark:text-zinc-400"> playlist miner</span>
//                     </h1>

//                     <form onSubmit={handleSearch} className="relative">
//                         <div className="flex gap-3">
//                             <div className="flex-1 relative">
//                                 <Input
//                                     type="text"
//                                     placeholder="Enter a seed artist..."
//                                     value={artist}
//                                     onChange={(e) => setArtist(e.target.value)}
//                                     className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
//                                     disabled={isLoading}
//                                 />
//                                 <Search className="absolute right-4 top-3 h-5 w-5 text-zinc-400" />
//                             </div>
//                             <div className="w-24">
//                                 <Input
//                                     type="number"
//                                     placeholder="Depth"
//                                     value={depth}
//                                     onChange={(e) => setDepth(parseInt(e.target.value))}
//                                     min="1"
//                                     max="5"
//                                     className="w-full pl-3 pr-2 py-3 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500"
//                                     disabled={isLoading}
//                                 />
//                             </div>
//                             <Button
//                                 type="submit"
//                                 className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white rounded-xl transition-colors"
//                                 disabled={isLoading}
//                             >
//                                 {isLoading ? 'Searching...' : 'Search'}
//                             </Button>
//                         </div>
//                     </form>
//                 </div>

//                 {renderEmptyState()}

//                 {tracks.length > 0 && (
//                     <div className="grid grid-cols-1 gap-4">
//                         {tracks.map((track, index) => (
//                             <Card
//                                 key={track.uri}
//                                 className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300"
//                                 onClick={() => openInSpotify(track.uri)}
//                             >
//                                 <CardContent className="p-4">
//                                     <div className="flex items-center gap-4">
//                                         <div className="flex-shrink-0 w-16 h-16">
//                                             <img
//                                                 src={track.coverArtUrl || '/placeholder-album.png'}
//                                                 alt={track.name}
//                                                 className="w-full h-full object-cover rounded-md"
//                                             />
//                                         </div>
//                                         <div className="flex-1 min-w-0">
//                                             <div className="flex items-baseline justify-between">
//                                                 <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 truncate">
//                                                     {index + 1}. {track.name}
//                                                 </h3>
//                                                 <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
//                                                     {track.playcount.toLocaleString()} plays
//                                                 </span>
//                                             </div>
//                                         </div>
//                                         <Button
//                                             variant="default"
//                                             className="ml-4 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 openInSpotify(track.uri);
//                                             }}
//                                         >
//                                             Open in Spotify
//                                         </Button>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Index;