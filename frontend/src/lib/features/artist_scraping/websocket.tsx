import React, { useEffect, useState } from "react";
import { useApp } from "@/src/lib/context/app-state";
import { Card } from "@/src/lib/components/ui/card";
import { Checkbox } from "@/src/lib/components/ui/checkbox";
import { Music } from "lucide-react";
import env from "@/src/lib/config/env";

export const WebSocketListener = () => {
  const [status, setStatus] = useState("Disconnected");
  const { app, setApp } = useApp();

  useEffect(() => {
    if (!app.activeScrapes) setApp((prev) => ({ ...prev, activeScrapes: [] }));

    const socket = new WebSocket(env.NEXT_PUBLIC_WEBSOCKET_API);

    socket.addEventListener("open", () => setStatus("Connected"));
    socket.addEventListener("close", () => setStatus("Disconnected"));
    socket.addEventListener("error", () => setStatus("Error"));

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id) {
          setApp((prev) => {
            const exists = prev.scrapes.some(
              (response) => response.id === data.id,
            );
            return exists
              ? prev
              : { ...prev, scrapes: [...prev.scrapes, data] };
          });
        }
      } catch (e) {}
    });

    return () => socket.close();
  }, [setApp]);

  const toggleScrape = (id: any, checked: any) => {
    setApp((prev) => ({
      ...prev,
      activeScrapes: checked
        ? [...(prev.activeScrapes || []), id]
        : prev.activeScrapes.filter((scrapeId) => scrapeId !== id),
    }));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Artist Pools</h2>
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1">
          <div
            className={`h-2 w-2 rounded-full ${status === "Connected" ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-xs text-gray-500">{status}</span>
        </div>
      </div>

      {app.scrapes?.length ? (
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {app.scrapes.map(({ id, seed_artist, total_artists, depth }) => (
            <Card key={id} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium truncate">{seed_artist}</span>
                <Checkbox
                  checked={app.activeScrapes?.includes(id)}
                  onCheckedChange={(checked) => toggleScrape(id, checked)}
                />
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>ID: {id}</div>
                <div className="flex justify-between">
                  <span>{total_artists} Artists</span>
                  <span>Depth {depth}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No responses yet</p>
        </Card>
      )}
    </div>
  );
};
