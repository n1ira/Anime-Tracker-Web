import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { KnownShow, Show } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a show name by lowercasing and removing punctuation and extra whitespace.
 */
export function normalizeShowName(name: string): string {
  name = name.toLowerCase().trim()
  name = name.replace(/[''\",:;\-]/g, "")
  name = name.replace(/\s+/g, " ")
  return name
}

/**
 * Calculate the absolute episode number based on season and episode.
 * For example, S2E3 might be episode 15 if season 1 had 12 episodes.
 */
export function calculateAbsoluteEpisode(
  showName: string,
  season: number,
  episode: number,
  knownShows: KnownShow[]
): number {
  // Find the show in the known shows database
  const knownShow = knownShows.find(
    (ks) => normalizeShowName(ks.show_name) === normalizeShowName(showName)
  )

  if (!knownShow) {
    // If show is not in the database, assume each season has 12 episodes
    return (season - 1) * 12 + episode
  }

  let absoluteEpisode = episode

  // Add the episodes from all previous seasons
  for (let s = 1; s < season; s++) {
    const episodesInSeason = knownShow.episodes_per_season[s - 1] || 12
    absoluteEpisode += episodesInSeason
  }

  return absoluteEpisode
}

/**
 * Recalculate the needed episodes for a show based on its tracking range
 * and downloaded episodes.
 */
export function recalculateNeededEpisodes(show: Show, knownShows: KnownShow[]): [number, number][] {
  const needed: [number, number][] = []
  const downloaded = new Set(
    show.downloaded_episodes.map((ep) => `${ep[0]}-${ep[1]}`)
  )

  // Find the known show to get episodes per season
  const knownShow = knownShows.find((ks) => 
    show.names.some(name => normalizeShowName(name) === normalizeShowName(ks.show_name))
  )

  // Generate all episodes in the tracking range
  for (let season = show.start_season; season <= show.end_season; season++) {
    const startEp = season === show.start_season ? show.start_episode : 1
    
    // Determine end episode for this season
    let endEp: number
    if (season === show.end_season) {
      endEp = show.end_episode
    } else if (knownShow && knownShow.episodes_per_season[season - 1]) {
      endEp = knownShow.episodes_per_season[season - 1]
    } else {
      endEp = 12 // Default to 12 episodes per season
    }

    // Add episodes that aren't downloaded yet
    for (let episode = startEp; episode <= endEp; episode++) {
      const key = `${season}-${episode}`
      if (!downloaded.has(key)) {
        needed.push([season, episode])
      }
    }
  }

  return needed
}

/**
 * Get the current timestamp in the format "YYYY-MM-DD HH:MM:SS"
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19)
}
