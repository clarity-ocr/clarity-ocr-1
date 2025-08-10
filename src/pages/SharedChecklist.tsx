// src/pages/SharedChecklist.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Lock, 
  Calendar, 
  Eye, 
  EyeOff,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { HistoryItem } from '@/types/history';
import { getHistoryItem } from '@/services/historyService';
import { TaskChecklist } from '@/components/TaskChecklist';
import { toast } from 'sonner';

export const SharedChecklistPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    const fetchSharedItem = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const item = await getHistoryItem(id);
        
        if (!item) {
          toast.error('This shared list does not exist or has been removed');
          navigate('/');
          return;
        }
        
        // Check if expired
        if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }
        
        // Check if password is required
        if (item.password) {
          // If no password provided yet, show password form
          if (!password) {
            setLoading(false);
            return;
          }
          
          // Check password
          if (password !== item.password) {
            toast.error('Incorrect password');
            setLoading(false);
            return;
          }
        }
        
        // If we get here, authentication is successful
        setIsAuthenticated(true);
        setHistoryItem(item);
      } catch (error) {
        console.error('Error fetching shared item:', error);
        toast.error('Failed to load shared list');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedItem();
  }, [id, password, navigate]);
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger re-fetch with password
    setLoading(true);
  };
  
  const handleBack = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading shared checklist...</p>
        </div>
      </div>
    );
  }
  
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="mb-6">This shared checklist has expired and is no longer accessible.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }
  
  if (!isAuthenticated && historyItem?.password) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Password Required</h1>
            <p className="text-muted-foreground">
              This checklist is protected with a password. Please enter the password to view it.
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button type="submit" className="w-full">
              Unlock Checklist
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (!historyItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Not Found</h1>
          <p className="mb-6">The requested checklist could not be found.</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Shared Checklist
            </h1>
            {historyItem.isPublic ? (
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                <Lock className="w-3 h-3 mr-1" />
                Private
              </Badge>
            )}
          </div>
        </div>
        
        {/* Title Section */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            {historyItem.fileName}
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Found {historyItem.analysisResult.totalTasks} tasks across {historyItem.analysisResult.groups.length} categories
          </p>
          
          {historyItem.expiresAt && (
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-amber-600">
              <Calendar className="w-4 h-4" />
              <span>Expires on {new Date(historyItem.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Shared View Notice */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200 text-blue-800">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">You're viewing a shared checklist</p>
              <p className="text-sm">
                Changes you make won't be saved to the original. To save your own copy, 
                create a new checklist from your document.
              </p>
            </div>
          </div>
        </Card>
        
        {/* Task Checklist */}
        <TaskChecklist 
          analysisResult={historyItem.analysisResult} 
          readOnly={true} 
          fileName={historyItem.fileName}
        />
      </div>
    </div>
  );
};

// Add default export
export default SharedChecklistPage;