"use client";

import { useState } from "react";
import { useAppContext } from "../lib/context";
import { ShowList } from "../components/ShowList";
import { EpisodeList } from "../components/EpisodeList";
import { ActivityLog } from "../components/ActivityLog";
import { AddShowDialog } from "../components/AddShowDialog";
import { EditShowDialog } from "../components/EditShowDialog";
import { MagnetLinkHandler } from "../components/MagnetLinkHandler";
import { ScanStatus } from "../components/ScanStatus";
import { Show } from "../lib/types";

export default function Home() {
  const { state, setSelectedShowId, refreshData, addActivityLog } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showToEdit, setShowToEdit] = useState<Show | null>(null);

  // Get the selected show
  const selectedShow = state.shows.find(show => show.id === state.selectedShowId) || null;

  // Handle adding a new show
  const handleAddShow = async (showData: {
    names: string[];
    start_season: number;
    start_episode: number;
    end_season: number;
    end_episode: number;
    quality: string;
  }) => {
    try {
      const response = await fetch('/api/shows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(showData),
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add show');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: `Added show: ${showData.names[0]}`,
        level: 'success',
      });

      // Refresh the data to get the updated shows list
      await refreshData();
    } catch (error) {
      console.error('Error adding show:', error);
      addActivityLog({
        message: `Error adding show: ${(error as Error).message}`,
        level: 'error',
      });
      throw error;
    }
  };

  // Handle editing a show
  const handleEditShow = async (showId: number, showData: Partial<Show>) => {
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(showData),
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update show');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: `Updated show: ${showData.names?.[0] || 'Unknown'}`,
        level: 'success',
      });

      // Refresh the data to get the updated shows list
      await refreshData();
    } catch (error) {
      console.error('Error updating show:', error);
      addActivityLog({
        message: `Error updating show: ${(error as Error).message}`,
        level: 'error',
      });
      throw error;
    }
  };

  // Handle deleting a show
  const handleDeleteShow = async (showId: number) => {
    if (!confirm('Are you sure you want to delete this show?')) {
      return;
    }

    try {
      const response = await fetch(`/api/shows/${showId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete show');
        } else {
          // Handle non-JSON response
          await response.text(); // Read the response but don't use it
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: 'Show deleted successfully',
        level: 'success',
      });

      // If the deleted show was selected, clear the selection
      if (state.selectedShowId === showId) {
        setSelectedShowId(null);
      }

      // Refresh the data to get the updated shows list
      await refreshData();
    } catch (error) {
      console.error('Error deleting show:', error);
      addActivityLog({
        message: `Error deleting show: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  // Handle scanning a show
  const handleScanShow = async (showId: number) => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ showId }),
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to start scan');
        } else {
          // Handle non-JSON response
          await response.text(); // Read the response but don't use it
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: 'Scan started',
        level: 'info',
      });
    } catch (error) {
      console.error('Error starting scan:', error);
      addActivityLog({
        message: `Error starting scan: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  // Handle canceling a scan
  const handleCancelScan = async () => {
    try {
      const response = await fetch('/api/scan', {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to cancel scan');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: 'Scan cancelled',
        level: 'info',
      });
    } catch (error) {
      console.error('Error cancelling scan:', error);
      addActivityLog({
        message: `Error cancelling scan: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tracked Shows</h1>
        <div className="flex space-x-2">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add Show
          </button>
          {state.isScanning && (
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={handleCancelScan}
            >
              Cancel Scan
            </button>
          )}
        </div>
      </div>
      
      {/* Scan Status */}
      <ScanStatus />
      
      <ShowList 
        shows={state.shows}
        selectedShowId={state.selectedShowId}
        onSelectShow={(show) => setSelectedShowId(show.id)}
        onEditShow={(show) => {
          setShowToEdit(show);
          setIsEditDialogOpen(true);
        }}
        onDeleteShow={handleDeleteShow}
        onScanShow={handleScanShow}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Episodes</h2>
          <EpisodeList selectedShow={selectedShow} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-3">Activity Log</h2>
          <ActivityLog logs={state.activityLogs} />
        </div>
      </div>
      
      {isAddDialogOpen && (
        <AddShowDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddShow={handleAddShow}
          knownShows={state.knownShows}
        />
      )}
      
      {isEditDialogOpen && showToEdit && (
        <EditShowDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setShowToEdit(null);
          }}
          onUpdateShow={handleEditShow}
          onResetShow={handleDeleteShow}
          show={showToEdit}
        />
      )}
      
      {/* Magnet Link Handler */}
      <MagnetLinkHandler />
    </div>
  );
}
