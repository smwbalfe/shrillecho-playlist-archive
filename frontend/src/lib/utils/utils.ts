import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseSpotifyId = (url: string): string => {
  try {
    const playlistPath = url.split('/playlist/')[1];
    if (!playlistPath) return '';
    const id = playlistPath.split('?')[0];
    return id || '';
  } catch {
    return '';
  }
}

export const extractSpotifyId = (url: string): string | null  => {
  const regex = /open\.spotify\.com\/(?:artist|album|track|playlist|show|episode)\/([a-zA-Z0-9]{22})(?:\?|$)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
