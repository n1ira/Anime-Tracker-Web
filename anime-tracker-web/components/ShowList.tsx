"use client";

import { Show } from "../lib/types";

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
  return (
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
  );
} 