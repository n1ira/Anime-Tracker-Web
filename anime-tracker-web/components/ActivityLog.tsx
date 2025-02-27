"use client";

import { useEffect, useRef } from "react";
import { ActivityLog as ActivityLogType } from "../lib/types";

interface ActivityLogProps {
  logs: ActivityLogType[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h3 className="font-medium">Activity Log</h3>
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