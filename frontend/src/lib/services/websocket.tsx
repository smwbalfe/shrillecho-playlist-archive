'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/src/lib/context/app-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/lib/components/ui/table';
import { Button } from '@/src/lib/components/ui/button';
import { Checkbox } from '@/src/lib/components/ui/checkbox';
import env from '../config/env';

export default function WebSocketListener() {
    const [status, setStatus] = useState('Disconnected');
    const { app, setApp } = useApp();

    useEffect(() => {
        if (!app.activeScrapes) {
            setApp(prev => ({ ...prev, activeScrapes: [] }));
        }
    }, [app, setApp]);

    useEffect(() => {
        const socket = new WebSocket(env.NEXT_PUBLIC_WEBSOCKET_API);

        socket.addEventListener('open', () => setStatus('Connected'));

        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.id) {
                    setApp(prev => {
                        const exists = prev.scrapes.some(response => response.id === data.id);
                        if (!exists) {
                            return { ...prev, scrapes: [...prev.scrapes, data] };
                        }
                        return prev;
                    });
                }
            } catch (e) {}
        });

        socket.addEventListener('close', () => setStatus('Disconnected'));
        socket.addEventListener('error', () => setStatus('Error'));
        
        return () => socket.close();
    }, [setApp]);

    const handleCheckboxChange = (id: any, isChecked: any) => {
        setApp(prev => {
            const activeScrapes = prev.activeScrapes || [];
            return {
                ...prev,
                activeScrapes: isChecked 
                    ? [...activeScrapes, id]
                    : activeScrapes.filter(scrapeId => scrapeId !== id)
            };
        });
    };

    return (
        <div className="space-y-4 max-w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Artist Responses</h2>
                <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${status === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-500">Status: {status}</span>
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12" />
                        <TableHead>Response ID</TableHead>
                        <TableHead>Seed Artist</TableHead>
                        <TableHead>Total Artists</TableHead>
                        <TableHead>Depth</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {app.scrapes?.length > 0 ? (
                        app.scrapes.map(response => (
                            <TableRow key={`artist-response-${response.id}`}>
                                <TableCell>
                                    <Checkbox
                                        checked={app.activeScrapes?.includes(response.id)}
                                        onCheckedChange={checked => handleCheckboxChange(response.id, checked)}
                                    />
                                </TableCell>
                                <TableCell>{response.id}</TableCell>
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
    );
}