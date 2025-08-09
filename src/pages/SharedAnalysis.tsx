// src/pages/SharedAnalysis.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadHistory } from '@/services/historyService';
import { HistoryEntry } from '@/types/history';
import { TaskChecklist } from '@/components/TaskChecklist'; // Reuse the ChecklistPage component
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SharedAnalysis() {
  const { entryId } = useParams<{ entryId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fromHistory = searchParams.get('fromHistory') === 'true';

  useEffect(() => {
    if (!entryId) {
      setError('Invalid entry ID');
      setIsLoading(false);
      return;
    }

    async function fetchEntry() {
      try {
        const historyEntry = await loadHistory(entryId);
        if (historyEntry) {
          setEntry(historyEntry);
        } else {
          setError('Entry not found');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('[SharedAnalysis] Error loading history entry:', err);
        setError('Failed to load entry');
        setIsLoading(false);
      }
    }

    fetchEntry();
  }, [entryId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xl font-bold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-col items-center">
          <AlertCircle className="h-8 w-8 text-red-600" />
          <p className="text-xl font-bold mt-4 text-red-600">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!entry) {
    return null; // Or handle the case where entry is null as needed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(fromHistory ? '/history' : '/')}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Clarity OCR
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Extract What Matters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <ChecklistPage
          analysisResult={entry.analysisResult}
          onBack={() => navigate(fromHistory ? '/history' : '/')}
          fileName={entry.fileName}
        />
      </div>
    </div>
  );
}