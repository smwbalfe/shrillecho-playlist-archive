'use client';
import { useEffect, useState } from 'react';
import { ScrapeResponse, useApp } from '@/src/lib/context/app-state';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/src/lib/components/ui/table';
import { Button } from '@/src/lib/components/ui/button';
import { Checkbox } from '@/src/lib/components/ui/checkbox';

import env from '../config/env';

// Debug logger utility
const debugLog = (area: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${area}] ${message}`, data ? data : '');
};

export default function WebSocketListener() {
    const [status, setStatus] = useState('Disconnected');
    const { app, setApp } = useApp();
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);

    // Log app state changes
    useEffect(() => {
        debugLog('AppState', 'Scrapes updated', {
            count: app.scrapes.length,
            scrapes: app.scrapes
        });
    }, [app.scrapes]);

    // Initialize activeScrapes if needed
    useEffect(() => {
        if (!app.activeScrapes) {
            debugLog('AppState', 'Initializing activeScrapes array');
            setApp(prevState => ({
                ...prevState,
                activeScrapes: []
            }));
        }
    }, [app, setApp]);

    // WebSocket connection and event handling
    useEffect(() => {
        debugLog('WebSocket', 'Initializing WebSocket connection', {
            url: env.NEXT_PUBLIC_WEBSOCKET_API,
            attempt: connectionAttempts + 1
        });

        const socket = new WebSocket(env.NEXT_PUBLIC_WEBSOCKET_API);
        setConnectionAttempts(prev => prev + 1);

        socket.addEventListener('open', (event) => {
            debugLog('WebSocket', 'Connection established', {
                attempt: connectionAttempts,
                readyState: socket.readyState
            });
            setStatus('Connected');
        });

        socket.addEventListener('message', (event) => {
            const now = new Date();
            setLastMessageTime(now);

            debugLog('WebSocket', 'Raw message received', {
                timestamp: now.toISOString(),
                data: event.data,
                timeSinceLastMessage: lastMessageTime
                    ? `${now.getTime() - lastMessageTime.getTime()}ms`
                    : 'First message'
            });

            try {
                const data: ScrapeResponse = JSON.parse(event.data);
                debugLog('WebSocket', 'Parsed message data', {
                    id: data.id,
                    seedArtist: data.seed_artist,
                    totalArtists: data.total_artists
                });

                if (data.id) {
                    setApp(prevState => {
                        const exists = prevState.scrapes.some(
                            response => response.id === data.id
                        );

                        debugLog('AppState', exists ? 'Duplicate scrape detected' : 'New scrape received', {
                            scrapeId: data.id,
                            exists,
                            currentScrapeCount: prevState.scrapes.length
                        });

                        if (!exists) {
                            return {
                                ...prevState,
                                scrapes: [...prevState.scrapes, data]
                            };
                        }
                        return prevState;
                    });
                } else {
                    debugLog('WebSocket', 'Invalid message format - missing ID', data);
                }
            } catch (e) {
                debugLog('WebSocket', 'Message parsing error', {
                    error: e instanceof Error ? e.message : 'Unknown error',
                    rawData: event.data
                });
            }
        });

        socket.addEventListener('close', (event) => {
            debugLog('WebSocket', 'Connection closed', {
                code: event.code,
                reason: event.reason,
                wasClean: event.wasClean,
                attempt: connectionAttempts
            });
            setStatus('Disconnected');
        });

        socket.addEventListener('error', (event) => {
            debugLog('WebSocket', 'Connection error', {
                error: event instanceof Error ? event.message : 'Unknown error',
                readyState: socket.readyState,
                attempt: connectionAttempts
            });
            setStatus('Error');
        });

        // Cleanup function
        return () => {
            debugLog('WebSocket', 'Cleaning up connection', {
                readyState: socket.readyState,
                lastMessageReceived: lastMessageTime?.toISOString()
            });
            socket.close();
        };
    }, [setApp, connectionAttempts, lastMessageTime]);

    const handleCheckboxChange = (id: number, isChecked: boolean) => {
        debugLog('UserAction', 'Checkbox state changed', {
            scrapeId: id,
            newState: isChecked
        });

        setApp(prevState => {
            const activeScrapes = prevState.activeScrapes || [];

            if (isChecked) {
                if (!activeScrapes.includes(id)) {
                    debugLog('AppState', 'Adding scrape to active list', {
                        scrapeId: id,
                        currentActiveCount: activeScrapes.length
                    });
                    return {
                        ...prevState,
                        activeScrapes: [...activeScrapes, id]
                    };
                }
            } else {
                debugLog('AppState', 'Removing scrape from active list', {
                    scrapeId: id,
                    currentActiveCount: activeScrapes.length
                });
                return {
                    ...prevState,
                    activeScrapes: activeScrapes.filter(scrapeId => scrapeId !== id)
                };
            }
            return prevState;
        });
    };

    return (
        <div className="space-y-4 max-w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Artist Responses</h2>
                <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-500">
                        Status: {status} {connectionAttempts > 1 ? `(Attempt: ${connectionAttempts})` : ''}
                    </span>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Response ID</TableHead>
                            <TableHead>Seed Artist</TableHead>
                            <TableHead>Total Artists</TableHead>
                            <TableHead>Depth</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {app.scrapes && app.scrapes.length > 0 ? (
                            app.scrapes.map((response) => (
                                <TableRow key={`artist-response-${response.id}`}>
                                    <TableCell>
                                        <Checkbox
                                            checked={app.activeScrapes?.includes(response.id) || false}
                                            onCheckedChange={(checked) =>
                                                handleCheckboxChange(response.id, checked === true)
                                            }
                                            aria-label={`Select scrape ${response.id}`}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{response.id}</TableCell>
                                    <TableCell>{response.seed_artist}</TableCell>
                                    <TableCell>{response.total_artists}</TableCell>
                                    <TableCell>{response.depth}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                    No artist responses received yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}