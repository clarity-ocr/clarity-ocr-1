import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // ✅ FIX: Removed unused CardContent
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History as HistoryIcon, Calendar, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { getHistory, deleteHistoryItem } from '@/services/historyService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryItem {
  id: string;
  fileName?: string;
  createdAt?: string;
  analysisResult?: {
    totalTasks?: number;
    groups?: Array<any>;
  };
}

function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      try {
        const items = await getHistory();
        setHistoryItems(items);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        toast({
          title: "Error",
          description: "Failed to load history. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast, user]);

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to delete items.", variant: "destructive" });
      return;
    }
    setDeletingId(id);
    try {
      await deleteHistoryItem(user.uid, id);
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "History item deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete history item",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const renderDate = (createdAt?: string) => {
    try {
        if (!createdAt) return 'Date unknown';
        return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
        return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">History</h1>
              <p className="text-muted-foreground">Your previous document analyses</p>
            </div>
          </div>
          <HistoryIcon className="w-8 h-8 text-primary" />
        </div>

        {historyItems.length === 0 ? (
          <Card className="p-12 text-center bg-card/50">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-6">
              Analyze a document and it will appear here.
            </p>
            <Button onClick={() => navigate('/')}>
              Analyze a New Document
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-grow min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 truncate">
                        <FileText className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate">{item.fileName || 'Untitled Analysis'}</span>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {renderDate(item.createdAt)}
                      </CardDescription>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant="secondary">
                          {item.analysisResult?.totalTasks ?? 0} tasks
                        </Badge>
                        <Badge variant="outline">
                          {item.analysisResult?.groups?.length ?? 0} categories
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/checklist/${item.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      {/* ✅ FIX: Removed the incorrect 'outline' prop. Kept variant="destructive" for red color. */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex items-center gap-1"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;