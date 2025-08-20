
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileJson,
  FileText,
  FileSpreadsheet,
  Download,
  Clock,
  User,
  Calendar,
  Tag,
  CheckCircle,
  AlertCircle,
  Target,
  Users,
  TrendingUp,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Loader2,
  Share2,
  MapPin,
  Flag,
  Copy,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { exportToJson, exportToPdf, exportToCsv } from '@/services/exportService';
import { AnalysisResult, TaskItem, TaskGroup } from '@/types/task';
import { getHistoryItem } from '@/services/historyService';
import { generateShareLink, incrementShareCount } from '@/services/shareService'; // Should now work
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ChecklistProps {
  user?: any;
  isReadOnly?: boolean;
}

export const Checklist: React.FC<ChecklistProps> = ({ user, isReadOnly = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string>('Untitled Document');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCriteria, setSortCriteria] = useState<string>('default');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'summary'>('tasks');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [historyItem, setHistoryItem] = useState<any>(null);

  useEffect(() => {
    const fetchHistoryItem = async () => {
      if (!id) {
        setError("Invalid checklist link.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const historyItemData = await getHistoryItem(id);
        
        if (historyItemData) {
          setHistoryItem(historyItemData);
          setAnalysisResult(historyItemData.analysisResult);
          setFileName(historyItemData.fileName || 'Untitled Document');
          const allTasks: TaskItem[] = historyItemData.analysisResult.groups.flatMap(group => group.tasks);
          setTasks(allTasks);
          
          const initialExpanded: Record<string, boolean> = {};
          historyItemData.analysisResult.groups.forEach(group => {
            initialExpanded[group.id] = true;
          });
          setExpandedGroups(initialExpanded);
        } else {
          setError("Checklist not found.");
        }
      } catch (err) {
        setError("Failed to load checklist data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistoryItem();
  }, [id]);

  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.completed).length, [tasks]);
  const progressPercentage = useMemo(() => totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0, [totalTasks, completedTasks]);

  const filteredTasks = useMemo(() => tasks.filter(task => task.content.toLowerCase().includes(searchTerm.toLowerCase())), [tasks, searchTerm]);

  const sortedTasks = useMemo(() => {
    const priorityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'none': 1 };
    return [...filteredTasks].sort((a, b) => {
      switch (sortCriteria) {
        case 'priority-high':
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority-low':
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        default:
          return 0;
      }
    });
  }, [filteredTasks, sortCriteria]);

  const groupedTasks: Record<string, TaskItem[]> = useMemo(() => {
    const groups: Record<string, TaskItem[]> = {};
    if (analysisResult) {
      analysisResult.groups.forEach(group => {
        groups[group.id] = [];
      });
      sortedTasks.forEach(task => {
        const groupId = analysisResult.groups.find(g => g.tasks.some(t => t.id === task.id))?.id || 'unassigned';
        if (!groups[groupId]) groups[groupId] = [];
        groups[groupId].push(task);
      });
    }
    return groups;
  }, [sortedTasks, analysisResult]);

  const getGroupById = useCallback((id: string): TaskGroup | undefined => analysisResult?.groups.find(group => group.id === id), [analysisResult]);

  const toggleGroup = useCallback((groupId: string) => setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] })), []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  const handleExport = useCallback(async (format: 'json' | 'pdf' | 'csv') => {
    if (!analysisResult) return;
    setIsExporting(true);
    try {
      const exportFunction = { json: exportToJson, pdf: exportToPdf, csv: exportToCsv }[format];
      await exportFunction(analysisResult);
      toast({ title: "Export Successful", description: `Exported as ${format.toUpperCase()}.` });
    } catch (error) {
      toast({ title: "Export Failed", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [analysisResult, toast]);
  
  const handleShare = useCallback(async () => {
    if (!id) return;
    setIsSharing(true);
    try {
      const shareLink = generateShareLink(id);
      await navigator.clipboard.writeText(shareLink);
      await incrementShareCount(id);
      toast({
        title: "Link Copied!",
        description: "A shareable link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Sharing Failed",
        description: "Could not generate a shareable link.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  }, [id, toast]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10" /></div>;
  if (error) return <div className="text-center py-10">{error}</div>;
  if (!analysisResult) return <div className="text-center py-10">No data found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          {!isReadOnly && <Button variant="ghost" onClick={() => navigate('/history')}><ArrowLeft className="mr-2 h-4 w-4" />Back to History</Button>}
          <div className="flex gap-2">
            {!isReadOnly && <Button onClick={handleShare} disabled={isSharing}>{isSharing ? <Loader2 className="animate-spin h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}Share</Button>}
            <Button onClick={() => handleExport('pdf')} disabled={isExporting}>{isExporting ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}PDF</Button>
          </div>
        </header>

        <main>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{fileName}</CardTitle>
              <div className="text-sm text-gray-500">{totalTasks} tasks</div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercentage} className="mb-4" />
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tasks' | 'summary')}>
                <TabsList>
                  <TabsTrigger value="tasks">Tasks</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                </TabsList>
                <TabsContent value="tasks">
                  <div className="my-4 flex gap-4">
                    <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
                    <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className="border rounded-md p-2">
                      <option value="default">Default</option>
                      <option value="priority-high">Priority High</option>
                      <option value="priority-low">Priority Low</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(groupedTasks).map(([groupId, groupTasks]) => {
                      const group = getGroupById(groupId);
                      if (!group || groupTasks.length === 0) return null;
                      return (
                        <div key={groupId}>
                          <h3 className="font-bold text-lg cursor-pointer" onClick={() => toggleGroup(groupId)}>
                            {group.name} ({groupTasks.length})
                            <ChevronDown className={`inline ml-2 h-4 w-4 transition-transform ${expandedGroups[groupId] ? 'rotate-180' : ''}`} />
                          </h3>
                          <AnimatePresence>
                            {expandedGroups[groupId] && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-2 space-y-2">
                                  {groupTasks.map(task => (
                                    <div key={task.id} className={`p-3 rounded-lg border ${task.completed ? 'bg-green-50' : 'bg-white'}`}>
                                      <p className={task.completed ? 'line-through' : ''}>{task.content}</p>
                                      <div className="flex items-center gap-2 mt-2 text-xs">
                                        <Badge variant="outline" className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                        <span className="flex items-center"><Clock className="mr-1 h-3 w-3" />{task.estimatedTime || 'N/A'} min</span>
                                        {task.deadline && <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" />{task.deadline}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="summary">
                  <div className="space-y-4 p-4">
                    <p>{analysisResult.summary?.projectDescription}</p>
                    <div><strong>Milestones:</strong> {analysisResult.summary?.milestones.join(', ')}</div>
                    <div><strong>Resources:</strong> {analysisResult.summary?.resources.join(', ')}</div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
export default Checklist;
