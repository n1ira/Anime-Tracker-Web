"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Show, KnownShow, ActivityLog } from './types';

interface AppState {
  shows: Show[];
  selectedShowId: number | null;
  knownShows: KnownShow[];
  activityLogs: ActivityLog[];
  isScanning: boolean;
  scanProgress: {
    current: number;
    total: number;
    currentShow: string | null;
  };
}

interface AppContextType {
  state: AppState;
  setShows: (shows: Show[]) => void;
  setSelectedShowId: (id: number | null) => void;
  setKnownShows: (knownShows: KnownShow[]) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  setIsScanning: (isScanning: boolean) => void;
  setScanProgress: (progress: AppState['scanProgress']) => void;
  refreshData: () => Promise<void>;
}

const initialState: AppState = {
  shows: [],
  selectedShowId: null,
  knownShows: [],
  activityLogs: [],
  isScanning: false,
  scanProgress: {
    current: 0,
    total: 0,
    currentShow: null,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const addActivityLog = useCallback((log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLog: ActivityLog = {
      ...log,
      id: Date.now(), // Temporary ID until saved to DB
      timestamp: new Date().toISOString(),
    };
    
    setState((prevState) => ({
      ...prevState,
      activityLogs: [...prevState.activityLogs, newLog].slice(-100), // Keep only the last 100 logs
    }));
    
    // Also send to server to be saved
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog),
    }).catch(error => {
      console.error('Failed to save log:', error);
    });
  }, []);

  const refreshData = useCallback(async () => {
    try {
      // Fetch shows
      try {
        const showsResponse = await fetch('/api/shows');
        if (showsResponse.ok) {
          const shows = await showsResponse.json();
          setState(prevState => ({ ...prevState, shows }));
        } else {
          console.error('Failed to fetch shows:', showsResponse.status, showsResponse.statusText);
        }
      } catch (showsError) {
        console.error('Error fetching shows:', showsError);
      }
      
      // Fetch known shows
      try {
        const knownShowsResponse = await fetch('/api/known-shows');
        if (knownShowsResponse.ok) {
          const knownShows = await knownShowsResponse.json();
          setState(prevState => ({ ...prevState, knownShows }));
        } else {
          console.error('Failed to fetch known shows:', knownShowsResponse.status, knownShowsResponse.statusText);
        }
      } catch (knownShowsError) {
        console.error('Error fetching known shows:', knownShowsError);
      }
      
      // Fetch recent logs
      try {
        const logsResponse = await fetch('/api/logs?limit=50');
        if (logsResponse.ok) {
          const logs = await logsResponse.json();
          setState((prevState) => ({
            ...prevState,
            activityLogs: logs,
          }));
        } else {
          console.error('Failed to fetch logs:', logsResponse.status, logsResponse.statusText);
        }
      } catch (logsError) {
        console.error('Error fetching logs:', logsError);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      addActivityLog({
        message: 'Failed to refresh data: ' + (error instanceof Error ? error.message : String(error)),
        level: 'error',
      });
    }
  }, [addActivityLog]);

  // Load initial data from localStorage if available
  useEffect(() => {
    const savedState = localStorage.getItem('animeTrackerState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setState((prevState) => ({
          ...prevState,
          ...parsedState,
        }));
      } catch (error) {
        console.error('Failed to parse saved state:', error);
      }
    }
    
    // Initial data fetch
    refreshData();
  }, [refreshData]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      selectedShowId: state.selectedShowId,
    };
    localStorage.setItem('animeTrackerState', JSON.stringify(stateToSave));
  }, [state.selectedShowId]);

  const setShows = (shows: Show[]) => {
    setState((prevState) => ({ ...prevState, shows }));
  };

  const setSelectedShowId = (id: number | null) => {
    setState((prevState) => ({ ...prevState, selectedShowId: id }));
  };

  const setKnownShows = (knownShows: KnownShow[]) => {
    setState((prevState) => ({ ...prevState, knownShows }));
  };

  const setIsScanning = (isScanning: boolean) => {
    setState((prevState) => ({ ...prevState, isScanning }));
    
    if (!isScanning) {
      // Reset scan progress when scanning stops
      setState((prevState) => ({
        ...prevState,
        scanProgress: {
          current: 0,
          total: 0,
          currentShow: null,
        },
      }));
    }
  };

  const setScanProgress = (progress: AppState['scanProgress']) => {
    setState((prevState) => ({
      ...prevState,
      scanProgress: progress,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        setShows,
        setSelectedShowId,
        setKnownShows,
        addActivityLog,
        setIsScanning,
        setScanProgress,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 