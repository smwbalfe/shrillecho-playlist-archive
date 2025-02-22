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

export default function WebSocketListener() {
    const [status, setStatus] = useState('Disconnected');
    const { app, setApp } = useApp();

    useEffect(() => {
        console.log('App artist responses updated:', app.scrapes);
    }, [app.scrapes]);

    useEffect(() => {
        if (!app.activeScrapes) {
            setApp(prevState => ({
                ...prevState,
                activeScrapes: []
            }));
        }
    }, [app, setApp]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8000/ws');

        socket.addEventListener('open', (event) => {
            console.log('Connected to WebSocket server');
            setStatus('Connected');
        });

        socket.addEventListener('message', (event) => {
            console.log('Message from server:', event.data);
            try {
                const data: ScrapeResponse = JSON.parse(event.data);
                console.log('Parsed data:', data);
                if (data.id) {
                    setApp(prevState => {
                        const exists = prevState.scrapes.some(
                            response => response.id === data.id
                        );

                        if (!exists) {
                            return {
                                ...prevState,
                                scrapes: [
                                    ...prevState.scrapes,
                                    data
                                ]
                            };
                        }
                        return prevState;
                    });
                } else {
                    console.log('Received message missing ID field');
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        });

        socket.addEventListener('close', (event) => {
            console.log('Disconnected from WebSocket server');
            setStatus('Disconnected');
        });

        socket.addEventListener('error', (event) => {
            console.error('WebSocket error:', event);
            setStatus('Error');
        });

        return () => {
            socket.close();
        };
    }, [setApp]);

    const handleCheckboxChange = (id: number, isChecked: boolean) => {
        setApp(prevState => {
            const activeScrapes = prevState.activeScrapes || [];

            if (isChecked) {
                // Add to activeScrapes if not already present
                if (!activeScrapes.includes(id)) {
                    return {
                        ...prevState,
                        activeScrapes: [...activeScrapes, id]
                    };
                }
            } else {
                // Remove from activeScrapes
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
                    <span className="text-sm text-gray-500">Status: {status}</span>
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