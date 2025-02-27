"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "../../lib/context";
import { ActivityLog as ActivityLogType } from "../../lib/types";

export default function LogsPage() {
  const { state, addActivityLog, refreshData } = useAppContext();
  const [filteredLogs, setFilteredLogs] = useState<ActivityLogType[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Apply filters to logs
  useEffect(() => {
    let filtered = [...state.activityLogs];
    
    // Apply level filter
    if (levelFilter !== "all") {
      filtered = filtered.filter(log => log.level === levelFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query)
      );
    }
    
    setFilteredLogs(filtered);
  }, [state.activityLogs, levelFilter, searchQuery]);

  // Handle clearing logs
  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all logs?")) {
      return;
    }
    
    try {
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear logs');
      }
      
      addActivityLog({
        message: 'Logs cleared',
        level: 'info',
      });
      
      await refreshData();
    } catch (error) {
      console.error('Error clearing logs:', error);
      addActivityLog({
        message: `Error clearing logs: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };

  // Handle downloading logs
  const handleDownloadLogs = () => {
    // Create a JSON string of the logs
    const logsJson = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = `anime-tracker-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addActivityLog({
      message: 'Logs downloaded',
      level: 'info',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Logs</h1>
        <div className="flex space-x-2">
          <button 
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
            onClick={handleClearLogs}
          >
            Clear Logs
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={handleDownloadLogs}
          >
            Download Logs
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-4 flex space-x-4">
          <select 
            className="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          <input
            type="text"
            placeholder="Search logs..."
            className="bg-gray-700 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="h-[calc(100vh-300px)] overflow-y-auto p-4 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-400">No logs found</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`mb-1 ${getLogLevelColor(log.level)}`}
              >
                [{new Date(log.timestamp).toLocaleString()}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getLogLevelColor(level: ActivityLogType["level"]): string {
  switch (level) {
    case "info":
      return "text-blue-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    case "success":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
} 