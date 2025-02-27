# Anime Tracker Pro - Web App Implementation Plan

## Project Description

A modern web application to track and automatically download anime episodes via torrent. The app allows users to manage their shows, track which episodes have been downloaded or are still needed, and automatically scan for and download new episodes from Nyaa.si. It's a direct web-based implementation of the existing desktop application, preserving all functionality while enhancing the user experience.

## Tech Stack

- Next.js 15.2.1-canary.0
- Supabase for backend storage
- Tailwind CSS for styling
- OpenAI API for torrent title parsing
- Server-side processing for scanning and downloading

## Implementation Plan

### Step 1: Project Setup

- [x] Initialize Next.js 15.2.1-canary.0 project
- [x] Set up Supabase project and tables
- [x] Configure environment variables
- [x] Create basic layout with navigation

### Step 2: Database Schema Design

- [x] Create tables in Supabase:
    - [x] `shows` - Store tracked shows
    - [x] `known_shows` - Store show metadata like episodes per season
    - [x] `episodes` - Store episode status (downloaded/needed)
    - [x] `activity_logs` - Store application activity

### Step 3: Core Components Development

- [x] Create `ShowList` component
    - [x] Display tracked shows with status
    - [x] Add selection functionality
- [x] Develop `EpisodeList` component
    - [x] Show episodes for selected show
    - [x] Indicate downloaded/needed status
- [x] Implement `ActivityLog` component
    - [x] Real-time log display
    - [x] Automatic scrolling
- [x] Create dialog components:
    - [x] `AddShowDialog`
    - [x] `EditShowDialog`
    - [x] `EditKnownShowsDialog`

### Step 4: Core Functionality Implementation

- [ ] Implement state management
    - [ ] Context for application state
    - [ ] Local storage fallback
- [ ] Create API endpoints:
    - [ ] `/api/shows` - CRUD operations
    - [ ] `/api/known-shows` - CRUD operations
    - [ ] `/api/scan` - Scan endpoints
- [ ] Implement utility functions:
    - [ ] `normalizeShowName`
    - [ ] `calculateAbsoluteEpisode`
    - [ ] `recalculateNeededEpisodes`

### Step 5: Title Parsing with OpenAI

- [ ] Create server-side function for parsing torrent titles
    - [ ] Implement OpenAI API integration
    - [ ] Handle JSON parsing and normalization
    - [ ] Add caching to minimize API calls

### Step 6: Scanning & Download System

- [ ] Implement scanning system:
    - [ ] Create scan job queue
    - [ ] Build Nyaa.si scraper
    - [ ] Process search results
- [ ] Develop magnet link handling:
    - [ ] Server endpoint to trigger downloads
    - [ ] Client-side handler to open magnet URLs
- [ ] Implement progress indicators:
    - [ ] Per-show scanning status
    - [ ] Overall scanning progress

### Step 7: UI/UX Refinement

- [ ] Develop responsive layout
    - [ ] Mobile-friendly design
    - [ ] Desktop optimization
- [ ] Implement theme support
    - [ ] Light/dark mode toggle
- [ ] Add loading states and feedback
    - [ ] Skeleton loaders
    - [ ] Toast notifications

### Step 8: Backend Logging System

- [ ] Implement comprehensive logging:
    - [ ] API request logging
    - [ ] Scan activity logging
    - [ ] Error handling and reporting
- [ ] Create log viewing interface:
    - [ ] Filterable logs
    - [ ] Downloadable log files

### Step 9: Testing & Optimization

- [ ] Implement automated testing:
    - [ ] Unit tests for core functions
    - [ ] Integration tests for API endpoints
- [ ] Performance optimization:
    - [ ] Minimize API calls
    - [ ] Optimize database queries
    - [ ] Implement caching strategies

### Step 10: Deployment & Documentation

- [ ] Prepare deployment:
    - [ ] Environment configuration
    - [ ] Build optimization
- [ ] Create documentation:
    - [ ] Setup instructions
    - [ ] User guide
    - [ ] API documentation

## Detailed Requirements

### Shows Management

- [ ] Add shows with multiple alternative names
- [ ] Specify season and episode range to track
- [ ] Edit existing shows
- [ ] Remove shows from tracking
- [ ] Reset show download status

### Known Shows Database

- [ ] Add shows to known database
- [ ] Specify episodes per season (fixed number or variable list)
- [ ] Edit existing known shows
- [ ] Interface for managing known shows database

### Episode Tracking

- [ ] Automatically calculate needed episodes
- [ ] Display episode status (downloaded/needed)
- [ ] Update status when episodes are found
- [ ] Handle batch episodes correctly

### Scanning System

- [ ] Scan single show on demand
- [ ] Scan all shows sequentially
- [ ] Cancel ongoing scans
- [ ] Show real-time progress
- [ ] Automatically open magnet links when matches found

### Activity Logging

- [ ] Log all important activities
- [ ] Display in real-time in the UI
- [ ] Persist logs for debugging

## Technical Implementation Details

### Data Structure

Shows will maintain the same structure as the original JSON:

```json
{
  "names": ["primary name", "alternative name"],
  "start_season": 1,
  "start_episode": 1,
  "end_season": 1,
  "end_episode": 12,
  "quality": "1080p",
  "downloaded_episodes": [[1, 1], [1, 2]],
  "needed_episodes": [[1, 3], [1, 4]],
  "last_checked": "2025-02-27 10:47:24"
}
```

Known shows will follow:

```json
{
  "show_name": {
    "episodes_per_season": [12, 24, 13]
  }
}
```

### Scanning Logic

Look at anime_tracker.py for how the logic works.

1. Start scan for a show or all shows
2. For each show, retrieve needed episodes
3. For each needed episode (in order):
    - Generate search queries with all alternative names
    - Search Nyaa.si for each query
    - Parse results with OpenAI (the API key is stored in my windows system environment variables as OPENAI_API_KEY)
    - Match results against needed episode
    - If match found, open magnet link and update status
    - Save progress after each episode

### Magnet Link Handling

Since browser security prevents automatic opening of magnet links, we'll:

1. Create a server endpoint that returns the magnet link
2. Use client-side JavaScript to open the link in a new window
3. Provide a fallback manual copy button

### UI Layout

- Top: Control buttons (Add, Remove, Scan, etc.)
- Left: Shows list with selection
- Right: Episodes list for selected show
- Bottom: Activity log with scrolling
- Status bar: Current operation status

## Additional Considerations

- Ensure all network requests have proper error handling
- Implement rate limiting for Nyaa.si requests
- Add debounce for user interactions
- Maintain same behavior as desktop app while improving UX
- Handle browser restrictions around magnet links
- Add offline capability with local storage fallback