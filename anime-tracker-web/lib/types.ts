export interface Show {
  id: number;
  names: string[];
  start_season: number;
  start_episode: number;
  end_season: number;
  end_episode: number;
  quality: string;
  downloaded_episodes: [number, number][];
  needed_episodes: [number, number][];
  last_checked: string | null;
}

export interface KnownShow {
  id: number;
  show_name: string;
  episodes_per_season: number[];
}

export interface Episode {
  id: number;
  show_id: number;
  season: number;
  episode: number;
  is_downloaded: boolean;
  download_date: string | null;
}

export interface ActivityLog {
  id: number;
  message: string;
  level: "info" | "warning" | "error" | "success";
  timestamp: string;
} 