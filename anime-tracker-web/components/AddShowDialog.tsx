"use client";

import { useState } from "react";
import { KnownShow } from "../lib/types";

interface AddShowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShow: (showData: {
    names: string[];
    start_season: number;
    start_episode: number;
    end_season: number;
    end_episode: number;
    quality: string;
  }) => Promise<void>;
  knownShows: KnownShow[];
}

export function AddShowDialog({
  isOpen,
  onClose,
  onAddShow,
  knownShows,
}: AddShowDialogProps) {
  const [primaryName, setPrimaryName] = useState("");
  const [alternativeNames, setAlternativeNames] = useState<string[]>([]);
  const [newAltName, setNewAltName] = useState("");
  const [startSeason, setStartSeason] = useState(1);
  const [startEpisode, setStartEpisode] = useState(1);
  const [endSeason, setEndSeason] = useState(1);
  const [endEpisode, setEndEpisode] = useState(12);
  const [quality, setQuality] = useState("1080p");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedKnownShow, setSelectedKnownShow] = useState<KnownShow | null>(null);

  const resetForm = () => {
    setPrimaryName("");
    setAlternativeNames([]);
    setNewAltName("");
    setStartSeason(1);
    setStartEpisode(1);
    setEndSeason(1);
    setEndEpisode(12);
    setQuality("1080p");
    setSelectedKnownShow(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddAltName = () => {
    if (newAltName.trim() && !alternativeNames.includes(newAltName.trim())) {
      setAlternativeNames([...alternativeNames, newAltName.trim()]);
      setNewAltName("");
    }
  };

  const handleRemoveAltName = (name: string) => {
    setAlternativeNames(alternativeNames.filter((n) => n !== name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryName.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddShow({
        names: [primaryName.trim(), ...alternativeNames],
        start_season: startSeason,
        start_episode: startEpisode,
        end_season: endSeason,
        end_episode: endEpisode,
        quality,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to add show:", error);
      setIsSubmitting(false);
    }
  };

  const handleSelectKnownShow = (showId: number) => {
    const show = knownShows.find((s) => s.id === showId);
    if (show) {
      setSelectedKnownShow(show);
      setPrimaryName(show.show_name);
      
      // If the show has episodes_per_season data, set the end episode
      if (show.episodes_per_season.length > 0) {
        setEndEpisode(show.episodes_per_season[0]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Show</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Known Shows Dropdown */}
          {knownShows.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select from Known Shows
              </label>
              <select
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedKnownShow?.id || ""}
                onChange={(e) => handleSelectKnownShow(Number(e.target.value))}
              >
                <option value="">-- Select a show --</option>
                {knownShows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.show_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Primary Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Primary Name *
            </label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={primaryName}
              onChange={(e) => setPrimaryName(e.target.value)}
              required
            />
          </div>
          
          {/* Alternative Names */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Alternative Names
            </label>
            <div className="flex">
              <input
                type="text"
                className="flex-1 bg-gray-700 border border-gray-600 rounded-l-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newAltName}
                onChange={(e) => setNewAltName(e.target.value)}
                placeholder="Add alternative name"
              />
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
                onClick={handleAddAltName}
              >
                Add
              </button>
            </div>
            
            {alternativeNames.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {alternativeNames.map((name) => (
                  <div
                    key={name}
                    className="bg-gray-700 text-gray-300 px-2 py-1 rounded-md flex items-center text-sm"
                  >
                    {name}
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveAltName(name)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Season and Episode Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Season
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startSeason}
                onChange={(e) => setStartSeason(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Start Episode
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startEpisode}
                onChange={(e) => setStartEpisode(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Season
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endSeason}
                onChange={(e) => setEndSeason(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                End Episode
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endEpisode}
                onChange={(e) => setEndEpisode(Number(e.target.value))}
                required
              />
            </div>
          </div>
          
          {/* Quality */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Quality
            </label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>
          
          {/* Action Buttons */}
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
              disabled={isSubmitting || !primaryName.trim()}
            >
              {isSubmitting ? "Adding..." : "Add Show"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 