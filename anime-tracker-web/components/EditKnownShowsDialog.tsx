"use client";

import { useState, useEffect } from "react";
import { KnownShow } from "../lib/types";

interface EditKnownShowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddKnownShow: (showData: {
    show_name: string;
    episodes_per_season: number[];
  }) => Promise<void>;
  onUpdateKnownShow: (showId: number, showData: {
    show_name: string;
    episodes_per_season: number[];
  }) => Promise<void>;
  onDeleteKnownShow: (showId: number) => Promise<void>;
  knownShows: KnownShow[];
}

export function EditKnownShowsDialog({
  isOpen,
  onClose,
  onAddKnownShow,
  onUpdateKnownShow,
  onDeleteKnownShow,
  knownShows,
}: EditKnownShowsDialogProps) {
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [showName, setShowName] = useState("");
  const [episodesPerSeason, setEpisodesPerSeason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedShowId(null);
      setShowName("");
      setEpisodesPerSeason("");
    }
  }, [isOpen]);

  // Update form when selected show changes
  useEffect(() => {
    if (selectedShowId) {
      const show = knownShows.find((s) => s.id === selectedShowId);
      if (show) {
        setShowName(show.show_name);
        setEpisodesPerSeason(show.episodes_per_season.join(", "));
      }
    } else {
      setShowName("");
      setEpisodesPerSeason("");
    }
  }, [selectedShowId, knownShows]);

  const handleClose = () => {
    onClose();
  };

  const handleSelectShow = (showId: number) => {
    setSelectedShowId(showId);
  };

  const handleNewShow = () => {
    setSelectedShowId(null);
    setShowName("");
    setEpisodesPerSeason("");
  };

  const parseEpisodesPerSeason = (input: string): number[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showName.trim()) return;

    const parsedEpisodes = parseEpisodesPerSeason(episodesPerSeason);
    if (parsedEpisodes.length === 0) {
      alert("Please enter at least one valid episode count");
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedShowId) {
        // Update existing show
        await onUpdateKnownShow(selectedShowId, {
          show_name: showName.trim(),
          episodes_per_season: parsedEpisodes,
        });
      } else {
        // Add new show
        await onAddKnownShow({
          show_name: showName.trim(),
          episodes_per_season: parsedEpisodes,
        });
      }
      handleNewShow();
    } catch (error) {
      console.error("Failed to save known show:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShowId) return;
    
    if (!confirm("Are you sure you want to delete this known show?")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDeleteKnownShow(selectedShowId);
      handleNewShow();
    } catch (error) {
      console.error("Failed to delete known show:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl p-6">
        <h2 className="text-xl font-semibold mb-4">Manage Known Shows</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Shows List */}
          <div className="md:col-span-1 bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Shows</h3>
              <button
                type="button"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                onClick={handleNewShow}
              >
                New Show
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {knownShows.length === 0 ? (
                <div className="text-center text-gray-400 py-4">
                  No known shows added yet
                </div>
              ) : (
                <ul className="space-y-1">
                  {knownShows.map((show) => (
                    <li key={show.id}>
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                          selectedShowId === show.id
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-700 text-gray-300"
                        }`}
                        onClick={() => handleSelectShow(show.id)}
                      >
                        {show.show_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          {/* Edit Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Show Name *
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={showName}
                  onChange={(e) => setShowName(e.target.value)}
                  placeholder="Enter show name"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Episodes Per Season *
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={episodesPerSeason}
                  onChange={(e) => setEpisodesPerSeason(e.target.value)}
                  placeholder="e.g. 12, 24, 13"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Enter the number of episodes for each season, separated by commas.
                  For example, &ldquo;12, 24, 13&rdquo; means Season 1 has 12 episodes, Season 2 has 24, and Season 3 has 13.
                </p>
              </div>
              
              <div className="flex justify-between">
                {selectedShowId && (
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
                    onClick={handleDelete}
                    disabled={isDeleting || isSubmitting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Show"}
                  </button>
                )}
                
                <div className="flex space-x-3 ml-auto">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
                    onClick={handleClose}
                    disabled={isSubmitting || isDeleting}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
                    disabled={isSubmitting || isDeleting || !showName.trim() || !episodesPerSeason.trim()}
                  >
                    {isSubmitting ? "Saving..." : selectedShowId ? "Update Show" : "Add Show"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 