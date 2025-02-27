import { Show, KnownShow } from './types';
import { normalizeShowName, calculateAbsoluteEpisode } from './utils';

interface NyaaResult {
  title: string;
  link: string;
  magnetLink: string;
  size: string;
  date: string;
  seeders: number;
  leechers: number;
}

interface ParsedTorrent {
  showName: string;
  season: number;
  episode: number;
  quality: string;
  group: string;
  absoluteEpisode?: number;
  batch: boolean;
  batchStart?: number;
  batchEnd?: number;
}

/**
 * Search Nyaa.si for a specific query
 */
export async function searchNyaa(query: string, category: string = '1_2'): Promise<NyaaResult[]> {
  try {
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query);
    const url = `https://nyaa.si/?f=0&c=${category}&q=${encodedQuery}&s=seeders&o=desc`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from Nyaa.si: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Parse the HTML to extract torrent information
    const results: NyaaResult[] = [];
    
    // Use regex to extract table rows (this is a simplified approach)
    const tableRegex = /<tr class="default">[\s\S]*?<\/tr>/g;
    const rows = html.match(tableRegex);
    
    if (!rows) return [];
    
    for (const row of rows) {
      // Extract title and links
      const titleMatch = row.match(/<a href="(\/view\/\d+)" title="([^"]+)">/);
      const magnetMatch = row.match(/<a href="(magnet:[^"]+)"/);
      
      if (!titleMatch || !magnetMatch) continue;
      
      const viewLink = `https://nyaa.si${titleMatch[1]}`;
      const title = titleMatch[2];
      const magnetLink = magnetMatch[1];
      
      // Extract size, date, seeders, leechers
      const sizeMatch = row.match(/<td class="text-center">([^<]+)<\/td>/);
      const dateMatch = row.match(/<td class="text-center">(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})<\/td>/);
      const seedersMatch = row.match(/<td class="text-center" style="color: green;">(\d+)<\/td>/);
      const leechersMatch = row.match(/<td class="text-center" style="color: red;">(\d+)<\/td>/);
      
      results.push({
        title,
        link: viewLink,
        magnetLink,
        size: sizeMatch ? sizeMatch[1] : 'Unknown',
        date: dateMatch ? dateMatch[1] : 'Unknown',
        seeders: seedersMatch ? parseInt(seedersMatch[1]) : 0,
        leechers: leechersMatch ? parseInt(leechersMatch[1]) : 0,
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching Nyaa:', error);
    throw error;
  }
}

/**
 * Parse a torrent title using OpenAI API
 */
export async function parseTorrentTitle(title: string): Promise<ParsedTorrent | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not set');
    }
    
    const prompt = `
      Parse the following anime torrent title into structured data:
      "${title}"
      
      Return a JSON object with these fields:
      - showName: The name of the anime show
      - season: The season number (default to 1 if not specified)
      - episode: The episode number
      - quality: The video quality (e.g., "1080p", "720p")
      - group: The release group
      - batch: Boolean indicating if this is a batch release
      - batchStart: If batch is true, the starting episode number
      - batchEnd: If batch is true, the ending episode number
      
      Only return the JSON object, nothing else.
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that parses anime torrent titles into structured data. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from OpenAI response');
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    // Validate the parsed data
    if (!parsedData.showName || !parsedData.episode) {
      return null;
    }
    
    return {
      showName: parsedData.showName,
      season: parsedData.season || 1,
      episode: parsedData.episode,
      quality: parsedData.quality || 'Unknown',
      group: parsedData.group || 'Unknown',
      batch: parsedData.batch || false,
      batchStart: parsedData.batchStart,
      batchEnd: parsedData.batchEnd,
    };
  } catch (error) {
    console.error('Error parsing torrent title:', error);
    return null;
  }
}

/**
 * Check if a parsed torrent matches a show and episode
 */
export function matchesTorrent(
  parsedTorrent: ParsedTorrent,
  show: Show,
  targetSeason: number,
  targetEpisode: number,
  knownShows: KnownShow[]
): boolean {
  // Check if the show name matches any of the show's names
  const normalizedParsedName = normalizeShowName(parsedTorrent.showName);
  const nameMatches = show.names.some(name => 
    normalizeShowName(name) === normalizedParsedName
  );
  
  if (!nameMatches) return false;
  
  // Check if the quality matches
  if (show.quality && !parsedTorrent.quality.includes(show.quality)) {
    return false;
  }
  
  // For batch torrents
  if (parsedTorrent.batch && parsedTorrent.batchStart && parsedTorrent.batchEnd) {
    // Check if the target episode is within the batch range
    if (parsedTorrent.season === targetSeason) {
      return parsedTorrent.batchStart <= targetEpisode && targetEpisode <= parsedTorrent.batchEnd;
    }
    
    // If seasons don't match, check using absolute episode numbers
    const targetAbsoluteEp = calculateAbsoluteEpisode(
      show.names[0],
      targetSeason,
      targetEpisode,
      knownShows
    );
    
    const batchStartAbsolute = calculateAbsoluteEpisode(
      show.names[0],
      parsedTorrent.season,
      parsedTorrent.batchStart,
      knownShows
    );
    
    const batchEndAbsolute = calculateAbsoluteEpisode(
      show.names[0],
      parsedTorrent.season,
      parsedTorrent.batchEnd,
      knownShows
    );
    
    return batchStartAbsolute <= targetAbsoluteEp && targetAbsoluteEp <= batchEndAbsolute;
  }
  
  // For single episode torrents
  if (parsedTorrent.season === targetSeason && parsedTorrent.episode === targetEpisode) {
    return true;
  }
  
  // Check using absolute episode numbers
  const targetAbsoluteEp = calculateAbsoluteEpisode(
    show.names[0],
    targetSeason,
    targetEpisode,
    knownShows
  );
  
  const parsedAbsoluteEp = calculateAbsoluteEpisode(
    show.names[0],
    parsedTorrent.season,
    parsedTorrent.episode,
    knownShows
  );
  
  return targetAbsoluteEp === parsedAbsoluteEp;
}

 