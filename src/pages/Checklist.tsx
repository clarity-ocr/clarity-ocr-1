// src/components/ChecklistPage.tsx
import { useState, useEffect } from 'react';
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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { exportToJson, exportToPdf, exportToCsv } from '@/services/exportService';
import { AnalysisResult, TaskItem, TaskGroup } from '@/types/task';

interface ChecklistPageProps {
  analysisResult: AnalysisResult;
  onBack: () => void;
}

export const ChecklistPage = ({ analysisResult, onBack }: ChecklistPageProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [uniqueAssignees, setUniqueAssignees] = useState<string[]>([]);

  // Initialize tasks and assignees
  useEffect(() => {
    const allTasks: TaskItem[] = analysisResult.groups.flatMap(group => group.tasks);
    setTasks(allTasks);
    // Extract unique assignees
    const assignees = Array.from(new Set(allTasks.map(task => task.assignee).filter(Boolean))) as string[];
    setUniqueAssignees(assignees);
  }, [analysisResult]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  // Group filtered tasks
  const groupedTasks: Record<string, TaskItem[]> = {};
  filteredTasks.forEach(task => {
    const groupId = analysisResult.groups.find(g => 
      g.tasks.some(t => t.id === task.id)
    )?.id || 'unassigned';
    if (!groupedTasks[groupId]) {
      groupedTasks[groupId] = [];
    }
    groupedTasks[groupId].push(task);
  });

  const getGroupById = (id: string): TaskGroup | undefined => {
    return analysisResult.groups.find(group => group.id === id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Button>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToJson(analysisResult)}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToPdf(analysisResult)}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => exportToCsv(analysisResult)}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </Button>
          </div>
        </div>

        {/* Title Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
            Task Analysis Complete
          </h1>
          <p className="text-muted-foreground text-lg">
            Found {analysisResult.totalTasks} tasks across {analysisResult.groups.length} categories
          </p>
        </div>

        {/* Summary Card */}
        {analysisResult.summary && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 shadow-xl rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                Project Summary
              </h2>
            </div>
            <p className="mb-6 text-lg">{analysisResult.summary.projectDescription}</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  Key Milestones
                </h3>
                <ul className="space-y-2">
                  {analysisResult.summary.milestones.map((milestone, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-black/10 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span>{milestone}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Resources Needed
                </h3>
                <ul className="space-y-2">
                  {analysisResult.summary.resources.map((resource, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-black/10 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                      <span>{resource}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Filters and Search */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            {uniqueAssignees.length > 0 && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select 
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="all">All Assignees</option>
                  {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>@{assignee}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Task Groups */}
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([groupId, groupTasks]) => {
            const group = getGroupById(groupId);
            if (!group) return null;
            return (
              <div
                key={group.id}
              >
                <Card className="overflow-hidden shadow-lg rounded-2xl border-primary/20">
                  <div 
                    className="p-5 bg-gradient-to-r from-secondary/50 to-primary/10 cursor-pointer flex justify-between items-center"
                    onClick={() => toggleGroup(group.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl">{group.name}</h3>
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg py-2 px-4">
                      {groupTasks.length} tasks
                    </Badge>
                  </div>
                  {groupTasks.length > 0 && (
                    <div className="p-4 border-t border-primary/10">
                      <div className="space-y-4">
                        {groupTasks.map((task) => (
                          <div 
                            key={task.id} 
                            className={`p-4 rounded-xl border transition-all duration-300 ${
                              task.completed 
                                ? 'bg-green-50/50 border-green-200 dark:bg-green-900/20' 
                                : 'bg-card hover:bg-accent border-primary/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTaskCompletion(task.id)}
                                className={`mt-1 w-5 h-5 rounded-full ${
                                  task.completed 
                                    ? 'bg-green-500 border-green-500 data-[state=checked]:text-white' 
                                    : 'border-primary'
                                }`}
                              />
                              <div className="flex-1">
                                <p className={`font-medium ${
                                  task.completed ? 'line-through text-muted-foreground' : ''
                                }`}>
                                  {task.content}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1`}>
                                    {getPriorityIcon(task.priority)}
                                    {task.priority} priority
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(task.estimatedTime)}
                                  </Badge>
                                  {task.deadline && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {task.deadline}
                                    </Badge>
                                  )}
                                  {task.assignee && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      @{task.assignee}
                                    </Badge>
                                  )}
                                  {task.tags.map((tag, index) => (
                                    <Badge 
                                      key={index} 
                                      variant="outline" 
                                      className="flex items-center gap-1"
                                    >
                                      <Tag className="w-3 h-3" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {task.completed && (
                                <CheckCircle className="w-6 h-6 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};