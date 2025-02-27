'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

interface ParseResult {
  parsed: {
    showName: string;
    season: number;
    episode: number;
    quality: string;
    group: string;
    batch: boolean;
    batchStart?: number;
    batchEnd?: number;
  } | null;
  fromCache: boolean;
}

export default function TitleParserPage() {
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title to parse');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/parse-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to parse title');
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Anime Title Parser</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Parse Anime Torrent Title</CardTitle>
            <CardDescription>
              Enter an anime torrent title to parse it using OpenAI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Torrent Title</Label>
                <Input
                  id="title"
                  placeholder="Enter torrent title..."
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              onClick={handleSubmit} 
              disabled={loading || !title.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                'Parse Title'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Parsing Result</CardTitle>
            <CardDescription>
              The structured data extracted from the title
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Badge variant={result.fromCache ? "secondary" : "default"}>
                    {result.fromCache ? "From Cache" : "Freshly Parsed"}
                  </Badge>
                </div>
                
                {result.parsed ? (
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Show Name:</span> {result.parsed.showName}
                    </div>
                    <div>
                      <span className="font-semibold">Season:</span> {result.parsed.season}
                    </div>
                    <div>
                      <span className="font-semibold">Episode:</span> {result.parsed.episode}
                    </div>
                    <div>
                      <span className="font-semibold">Quality:</span> {result.parsed.quality}
                    </div>
                    <div>
                      <span className="font-semibold">Group:</span> {result.parsed.group}
                    </div>
                    <div>
                      <span className="font-semibold">Batch:</span> {result.parsed.batch ? 'Yes' : 'No'}
                    </div>
                    {result.parsed.batch && (
                      <>
                        <div>
                          <span className="font-semibold">Batch Start:</span> {result.parsed.batchStart}
                        </div>
                        <div>
                          <span className="font-semibold">Batch End:</span> {result.parsed.batchEnd}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-yellow-500">
                    Failed to parse the title. Try a different format.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 italic">
                No result yet. Enter a title and click &quot;Parse Title&quot;.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Example Titles to Try</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <button 
              onClick={() => setTitle('[SubsPlease] Demon Slayer S04E05 (1080p) [74A81C99].mkv')}
              className="text-blue-500 hover:underline"
            >
              [SubsPlease] Demon Slayer S04E05 (1080p) [74A81C99].mkv
            </button>
          </li>
          <li>
            <button 
              onClick={() => setTitle('[Erai-raws] One Piece - 1102 [1080p][Multiple Subtitle][E9FC9F72].mkv')}
              className="text-blue-500 hover:underline"
            >
              [Erai-raws] One Piece - 1102 [1080p][Multiple Subtitle][E9FC9F72].mkv
            </button>
          </li>
          <li>
            <button 
              onClick={() => setTitle('[ASW] Frieren - Beyond Journey\'s End - S01E24 [1080p HEVC][9B9C0B5A].mkv')}
              className="text-blue-500 hover:underline"
            >
              [ASW] Frieren - Beyond Journey&apos;s End - S01E24 [1080p HEVC][9B9C0B5A].mkv
            </button>
          </li>
          <li>
            <button 
              onClick={() => setTitle('[SubsPlease] Mushoku Tensei - 34 (1080p) [Batch]')}
              className="text-blue-500 hover:underline"
            >
              [SubsPlease] Mushoku Tensei - 34 (1080p) [Batch]
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
} 