// src/pages/History.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History as HistoryIcon, Calendar, FileText, Trash2, Eye, Loader2 } from 'lucide-react';
import { getHistory, deleteHistoryItem } from '@/services/historyService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { auth } from '@/firebase'; // ✅ Import auth here

interface HistoryItem {
  id: string;
  fileName: string; // ✅ Now required
  createdAt: string;
  analysisResult: {
    totalTasks: number;
    groups: Array<{
      name: string;
      tasks: Array<any>;
    }>;
  };
}

function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const items = await getHistory();
        setHistoryItems(items); // ✅ Now works
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load history",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [toast]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">History</h1>
              <p className="text-muted-foreground">Your previous document analyses</p>
            </div>
          </div>
          <HistoryIcon className="w-8 h-8 text-primary" />
        </div>

        {historyItems.length === 0 ? (
          <Card className="p-12 text-center">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-6">
              Analyze a document to see it appear here
            </p>
            <Button onClick={() => navigate('/')}>
              Analyze a Document
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {historyItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {item.fileName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/checklist/${item.id}`)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
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
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">
                      {item.analysisResult.totalTasks} tasks
                    </Badge>
                    <Badge variant="outline">
                      {item.analysisResult.groups.length} categories
                    </Badge>
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

export default HistoryPage;