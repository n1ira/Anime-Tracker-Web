"use client";

import { useState } from "react";
import { Show } from "../lib/types";
import { useAppContext } from "../lib/context";

interface ShowListProps {
  shows: Show[];
  onSelectShow: (show: Show) => void;
  onEditShow: (show: Show) => void;
  onDeleteShow: (showId: number) => void;
  onScanShow: (showId: number) => void;
  selectedShowId: number | null;
}

export function ShowList({
  shows,
  onSelectShow,
  onEditShow,
  onDeleteShow,
  onScanShow,
  selectedShowId,
}: ShowListProps) {
  const { addActivityLog } = useAppContext();
  const [isScanningAll, setIsScanningAll] = useState(false);

  // Handle scanning all shows
  const handleScanAll = async () => {
    if (shows.length === 0) return;
    
    try {
      setIsScanningAll(true);
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to start scan');
        } else {
          await response.text();
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: 'Scanning all shows',
        level: 'info',
      });
    } catch (error) {
      console.error('Error scanning all shows:', error);
      addActivityLog({
        message: `Error scanning all shows: ${(error as Error).message}`,
        level: 'error',
      });
    } finally {
      setIsScanningAll(false);
    }
  };

  return (
    <div>
      {shows.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={handleScanAll}
            disabled={isScanningAll}
          >
            {isScanningAll ? 'Starting Scan...' : 'Scan All Shows'}
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shows.length === 0 ? (
          <div className="col-span-full bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-gray-400">No shows added yet. Add a show to get started.</p>
          </div>
        ) : (
          shows.map((show) => (
            <div
              key={show.id}
              className={`bg-gray-800 p-4 rounded-lg shadow cursor-pointer transition-colors ${
                selectedShowId === show.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => onSelectShow(show)}
            >
              <div className="flex justify-between items-start">
                <h2 className="text-lg font-semibold">{show.names[0]}</h2>
                <div className="flex space-x-2">
                  <button
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditShow(show);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteShow(show.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                <p>
                  Season {show.start_season === show.end_season 
                    ? show.start_season 
                    : `${show.start_season}-${show.end_season}`}, 
                  Episodes {show.start_episode === show.end_episode 
                    ? show.start_episode 
                    : `${show.start_episode}-${show.end_episode}`}
                </p>
                <p>Quality: {show.quality}</p>
                <p>
                  Downloaded: {show.downloaded_episodes.length}/
                  {show.downloaded_episodes.length + show.needed_episodes.length} episodes
                </p>
                {show.last_checked && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last checked: {new Date(show.last_checked).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onScanShow(show.id);
                  }}
                >
                  Scan
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 