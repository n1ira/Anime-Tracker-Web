"use client";

import { useState } from "react";
import { Show } from "../lib/types";
import { useAppContext } from "../lib/context";

interface EpisodeListProps {
  selectedShow: Show | null;
}

export function EpisodeList({ selectedShow }: EpisodeListProps) {
  const { refreshData, addActivityLog } = useAppContext();
  const [isToggling, setIsToggling] = useState(false);

  if (!selectedShow) {
    return (
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 text-center text-gray-400">
          Select a show to view episodes
        </div>
      </div>
    );
  }

  // Handle toggling episode status
  const handleToggleEpisode = async (season: number, episode: number) => {
    if (isToggling) return; // Prevent multiple clicks

    try {
      setIsToggling(true);
      const response = await fetch(`/api/shows/${selectedShow.id}/toggle-episode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season, episode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle episode status');
      }

      // Refresh the data to get the updated episode lists
      await refreshData();
    } catch (error) {
      console.error('Error toggling episode status:', error);
      addActivityLog({
        message: `Error toggling episode status: ${(error as Error).message}`,
        level: 'error',
      });
    } finally {
      setIsToggling(false);
    }
  };

  // Combine downloaded and needed episodes for display
  const allEpisodes = [
    ...selectedShow.downloaded_episodes.map((ep) => ({
      season: ep[0],
      episode: ep[1],
      is_downloaded: true,
    })),
    ...selectedShow.needed_episodes.map((ep) => ({
      season: ep[0],
      episode: ep[1],
      is_downloaded: false,
    })),
  ].sort((a, b) => {
    // Sort by season, then by episode
    if (a.season !== b.season) {
      return a.season - b.season;
    }
    return a.episode - b.episode;
  });

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-medium">
          {selectedShow.names[0]} - Episodes
        </h3>
      </div>
      {allEpisodes.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          No episodes to display
        </div>
      ) : (
        <div className="divide-y divide-gray-700">
          {allEpisodes.map((ep) => (
            <div
              key={`${ep.season}-${ep.episode}`}
              className="p-3 flex justify-between items-center hover:bg-gray-700 cursor-pointer"
              onClick={() => handleToggleEpisode(ep.season, ep.episode)}
            >
              <div className="flex items-center">
                <span className="text-sm">
                  S{ep.season.toString().padStart(2, "0")}E
                  {ep.episode.toString().padStart(2, "0")}
                </span>
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    ep.is_downloaded
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {ep.is_downloaded ? "Downloaded" : "Needed"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 