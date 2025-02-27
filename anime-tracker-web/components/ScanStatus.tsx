"use client";

import { useEffect } from 'react';
import { useAppContext } from '../lib/context';

export function ScanStatus() {
  const { state, setIsScanning, setScanProgress, refreshData } = useAppContext();
  
  // Poll for scan status when scanning is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isScanning) {
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/scan/status');
          if (response.ok) {
            const data = await response.json();
            
            if (data.isScanning) {
              // Update scan progress
              const progress = data.progress || { current: 0, total: 0, currentShow: null };
              
              setScanProgress({
                current: progress.current,
                total: progress.total,
                currentShow: progress.currentShow,
              });
            } else {
              // Scan is complete
              setIsScanning(false);
              refreshData();
            }
          }
        } catch (error) {
          console.error('Error checking scan status:', error);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isScanning, setScanProgress, setIsScanning, refreshData]);
  
  if (!state.isScanning) {
    return null;
  }
  
  const progressPercent = Math.round(
    (state.scanProgress.current / Math.max(1, state.scanProgress.total)) * 100
  );
  
  return (
    <div className="bg-gray-800 p-4 rounded-md">
      <div className="flex justify-between mb-2">
        <span className="font-medium">
          Scanning {state.scanProgress.currentShow || 'shows'}
        </span>
        <span className="text-gray-300">
          {state.scanProgress.current} / {state.scanProgress.total} episodes
          <span className="ml-2 text-gray-400">({progressPercent}%)</span>
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
} 