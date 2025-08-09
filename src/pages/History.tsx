// src/pages/History.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, Trash2, Share2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { loadHistory, deleteFromHistory, clearHistory, generateShareableLink } from '@/services/historyService';
import { HistoryEntry } from '@/types/history';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export default function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[HistoryPage] Loading history...");
    const loadedHistory = loadHistory();
    setHistory(loadedHistory);
    setIsLoading(false);
    console.log(`[HistoryPage] Loaded ${loadedHistory.length} history entries.`);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this history entry?")) {
      console.log(`[HistoryPage] Deleting history entry ${id}...`);
      deleteFromHistory(id);
      setHistory(prev => prev.filter(entry => entry.id !== id));
      console.log(`[HistoryPage] History entry ${id} deleted.`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear ALL history? This cannot be undone.")) {
      console.log("[HistoryPage] Clearing all history...");
      clearHistory();
      setHistory([]);
      console.log("[HistoryPage] All history cleared.");
    }
  };

  const handleViewDetails = (entry: HistoryEntry) => {
    console.log(`[HistoryPage] Navigating to shared view for entry ${entry.id}...`);
    // Pass the analysis result directly or fetch it in the shared component
    // Option 1: Pass via state/navigation (limited by URL length for large data)
    // Option 2: Store temporarily in a global state/context or re-fetch from ID if persisted server-side (not applicable here with localStorage)
    // Option 3: Navigate to a route that loads it from localStorage using the ID
    // We'll use Option 3: Navigate to a route that knows to load from history
    navigate(`/shared/${entry.id}?fromHistory=true`);
  };

  const handleShare = (entry: HistoryEntry) => {
    const link = generateShareableLink(entry.id);
    console.log(`[HistoryPage] Generating shareable link for entry ${entry.id}:`, link);
    
    // Simple share API (if supported) or fallback to clipboard/manual
    if (navigator.share) {
      navigator.share({
        title: entry.title,
        text: `Check out this Clarity OCR analysis: ${entry.title}`,
        url: link,
      }).catch((error) => {
        console.log('[HistoryPage] Sharing failed or was cancelled:', error);
        // Fallback to copying link or opening WhatsApp
        fallbackShare(link, entry.title);
      });
    } else {
      fallbackShare(link, entry.title);
    }
  };

  const fallbackShare = (link: string, title: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(link).then(() => {
      alert(`Link copied to clipboard:\n${link}\n\nYou can now paste it anywhere to share.`);
    }).catch(err => {
      console.error('[HistoryPage] Failed to copy link: ', err);
      // Final fallback: Open WhatsApp with the link
      const message = `Check out this Clarity OCR analysis: ${title}\n${link}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Analysis History
            </h1>
            {history.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl mb-2">No History Yet</CardTitle>
            <CardDescription className="mb-6">
              Your analyzed documents will appear here. Start by uploading a document.
            </CardDescription>
            <Button onClick={() => navigate('/')}>Upload Document</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((entry) => (
              <Card key={entry.id} className="overflow-hidden shadow-lg rounded-2xl border-primary/20 hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="p-5 bg-gradient-to-r from-secondary/50 to-primary/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg line-clamp-2">{entry.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(entry.timestamp), 'PPp', { locale: enUS })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {entry.analysisResult.totalTasks} tasks
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      {entry.analysisResult.groups.length} categories
                    </Badge>
                    {entry.fileName && (
                      <Badge variant="outline" className="text-xs">
                        File: {entry.fileName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(entry)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShare(entry)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(entry.id)}
                      className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}