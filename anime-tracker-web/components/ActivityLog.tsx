"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityLog as ActivityLogType } from "../lib/types";
import { useAppContext } from "../lib/context";

interface ActivityLogProps {
  logs: ActivityLogType[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  const { refreshData, addActivityLog } = useAppContext();
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Auto-scroll to top when new logs are added (since newest are at top)
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  // Poll for log updates every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(async () => {
      await refreshData({ refreshLogs: true, refreshShows: false });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [refreshData]);

  // Handle clearing logs
  const handleClearLogs = async () => {
    if (isClearing) return;

    try {
      setIsClearing(true);
      const response = await fetch('/api/logs', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear logs');
      }

      // Refresh the data to get the updated logs
      await refreshData();
      addActivityLog({
        message: 'Logs cleared successfully',
        level: 'info',
      });
    } catch (error) {
      console.error('Error clearing logs:', error);
      addActivityLog({
        message: `Error clearing logs: ${(error as Error).message}`,
        level: 'error',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Activity Log</h3>
        <button
          onClick={handleClearLogs}
          className="text-xs px-2 py-1 bg-red-700 hover:bg-red-800 text-white rounded"
          disabled={isClearing || logs.length === 0}
        >
          {isClearing ? 'Clearing...' : 'Clear Log'}
        </button>
      </div>
      <div 
        ref={logContainerRef}
        className="h-48 overflow-y-auto p-4 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-gray-400 text-center">No activity yet</div>
        ) : (
          logs.map((log) => (
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
  );
}

function getLogLevelColor(level: ActivityLogType["level"]): string {
  switch (level) {
    case "info":
      return "text-gray-300";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    case "success":
      return "text-green-500";
    default:
      return "text-gray-300";
  }
} 