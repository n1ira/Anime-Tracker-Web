"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '../lib/context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

type MagnetLink = {
  showId: number;
  showName: string;
  season: number;
  episode: number;
  magnetLink: string;
};

export function MagnetLinkHandler() {
  const { state, addActivityLog } = useAppContext();
  const [magnetLinks, setMagnetLinks] = useState<MagnetLink[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  // Poll for magnet links when a scan is in progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isScanning && !isPolling) {
      setIsPolling(true);
      
      // Check for magnet links every 3 seconds
      interval = setInterval(async () => {
        try {
          const response = await fetch('/api/scan/magnets');
          if (response.ok) {
            const data = await response.json();
            if (data.magnetLinks && data.magnetLinks.length > 0) {
              setMagnetLinks(data.magnetLinks);
              setIsDialogOpen(true);
              setIsPolling(false);
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking for magnet links:', error);
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isScanning, isPolling, addActivityLog]);
  
  // When the scan is no longer in progress but we have links and weren't showing them
  useEffect(() => {
    if (!state.isScanning && magnetLinks.length > 0 && !isDialogOpen) {
      setIsDialogOpen(true);
    }
  }, [state.isScanning, magnetLinks, isDialogOpen]);
  
  // Handle opening a magnet link
  const handleOpenMagnetLink = (link: MagnetLink) => {
    try {
      window.open(link.magnetLink, '_blank');
      
      addActivityLog({
        message: `Opened magnet link for ${link.showName} S${link.season}E${link.episode}`,
        level: 'success',
      });
    } catch (error) {
      console.error('Error opening magnet link:', error);
      
      addActivityLog({
        message: `Error opening magnet link: ${(error as Error).message}`,
        level: 'error',
      });
    }
  };
  
  // Handle opening all magnet links
  const handleOpenAllMagnetLinks = () => {
    magnetLinks.forEach((link, index) => {
      // Slight delay to avoid popup blockers
      setTimeout(() => {
        handleOpenMagnetLink(link);
      }, index * 500);
    });
  };
  
  // Clear magnet links when dialog is closed
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };
  
  if (magnetLinks.length === 0) {
    return null;
  }
  
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Magnet Links Found ({magnetLinks.length})</DialogTitle>
          <DialogDescription>
            The following episodes were found during the scan. Click to open the magnet links.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] overflow-auto">
          <div className="space-y-2 p-2">
            {magnetLinks.map((link, index) => (
              <div 
                key={index} 
                className="p-3 bg-gray-800 rounded-md flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{link.showName}</span>
                  <span className="ml-2 text-sm text-gray-400">
                    S{link.season}E{link.episode}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenMagnetLink(link)}
                >
                  Open
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handleCloseDialog}>
            Close
          </Button>
          <Button onClick={handleOpenAllMagnetLinks}>
            Open All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 