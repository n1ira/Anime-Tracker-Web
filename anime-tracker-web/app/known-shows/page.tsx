"use client";

import { useState } from "react";
import { useAppContext } from "../../lib/context";
import { KnownShow } from "../../lib/types";
import { EditKnownShowsDialog } from "../../components/EditKnownShowsDialog";

export default function KnownShowsPage() {
  const { state, refreshData, addActivityLog } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showToEdit, setShowToEdit] = useState<KnownShow | null>(null);

  // Handle adding a new known show
  const handleAddKnownShow = async (showData: {
    show_name: string;
    episodes_per_season: number[];
  }) => {
    try {
      const response = await fetch('/api/known-shows', {
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
          throw new Error(error.error || 'Failed to add known show');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: `Added known show: ${showData.show_name}`,
        level: 'success',
      });

      await refreshData();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding known show:', error);
      addActivityLog({
        message: `Error adding known show: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  // Handle editing a known show
  const handleEditKnownShow = async (showId: number, showData: {
    show_name: string;
    episodes_per_season: number[];
  }) => {
    try {
      const response = await fetch(`/api/known-shows/${showId}`, {
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
          throw new Error(error.error || 'Failed to update known show');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: `Updated known show: ${showData.show_name}`,
        level: 'success',
      });

      await refreshData();
      setIsEditDialogOpen(false);
      setShowToEdit(null);
    } catch (error) {
      console.error('Error updating known show:', error);
      addActivityLog({
        message: `Error updating known show: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  // Handle deleting a known show
  const handleDeleteKnownShow = async (showId: number) => {
    if (!confirm('Are you sure you want to delete this known show?')) {
      return;
    }

    try {
      const response = await fetch(`/api/known-shows/${showId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Check if the response is JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to delete known show');
        } else {
          // Handle non-JSON response
          await response.text(); // Consume the response body
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      addActivityLog({
        message: 'Known show deleted successfully',
        level: 'success',
      });

      await refreshData();
    } catch (error) {
      console.error('Error deleting known show:', error);
      addActivityLog({
        message: `Error deleting known show: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Known Shows Database</h1>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Known Show
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Show Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Episodes Per Season
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {state.knownShows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-400">
                  No known shows in database
                </td>
              </tr>
            ) : (
              state.knownShows.map((show) => (
                <tr key={show.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {show.show_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {JSON.stringify(show.episodes_per_season)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-500 hover:text-blue-400 mr-4"
                      onClick={() => {
                        setShowToEdit(show);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-400"
                      onClick={() => handleDeleteKnownShow(show.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Dialog */}
      <EditKnownShowsDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleAddKnownShow}
        show={null}
        isAdd={true}
      />

      {/* Edit Dialog */}
      {showToEdit && (
        <EditKnownShowsDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setShowToEdit(null);
          }}
          onSave={(showData) => handleEditKnownShow(showToEdit.id, showData)}
          show={showToEdit}
          isAdd={false}
        />
      )}
    </div>
  );
} 