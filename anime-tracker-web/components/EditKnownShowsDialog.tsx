"use client";

import { useState, useEffect } from "react";
import { KnownShow } from "../lib/types";

interface EditKnownShowsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (showData: {
    show_name: string;
    episodes_per_season: number[];
  }) => Promise<void>;
  show: KnownShow | null;
  isAdd: boolean;
}

export function EditKnownShowsDialog({
  isOpen,
  onClose,
  onSave,
  show,
  isAdd,
}: EditKnownShowsDialogProps) {
  const [showName, setShowName] = useState("");
  const [episodesPerSeason, setEpisodesPerSeason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when show changes
  useEffect(() => {
    if (show) {
      setShowName(show.show_name);
      setEpisodesPerSeason(show.episodes_per_season.join(", "));
    } else {
      setShowName("");
      setEpisodesPerSeason("");
    }
  }, [show]);

  const handleClose = () => {
    onClose();
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
      await onSave({
        show_name: showName.trim(),
        episodes_per_season: parsedEpisodes,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to save known show:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isAdd ? "Add Known Show" : "Edit Known Show"}
        </h2>
        
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
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              disabled={isSubmitting || !showName.trim() || !episodesPerSeason.trim()}
            >
              {isSubmitting ? "Saving..." : isAdd ? "Add Show" : "Update Show"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 