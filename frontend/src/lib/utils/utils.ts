import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseSpotifyId = (url: string): string => {
  try {
    const playlistPath = url.split("/playlist/")[1];
    if (!playlistPath) return "";
    const id = playlistPath.split("?")[0];
    return id || "";
  } catch {
    return "";
  }
};
