// src/components/TaskChecklist.tsx
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
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  CheckSquare,
  Square,
  Loader2,
  Share2,
  MapPin,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToJson, exportToPdf, exportToCsv } from '@/services/exportService';
import { AnalysisResult, TaskItem, TaskGroup } from '@/types/task';

interface TaskChecklistProps {
  analysisResult: AnalysisResult;
  readOnly?: boolean;
  fileName?: string;
}

export const TaskChecklist = ({ analysisResult, readOnly = false, fileName }: TaskChecklistProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [uniqueAssignees, setUniqueAssignees] = useState<string[]>([]);
  const [sortCriteria, setSortCriteria] = useState<string>('default');
  const [isExporting, setIsExporting] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Initialize tasks and assignees
  useEffect(() => {
    const allTasks: TaskItem[] = analysisResult.groups.flatMap(group => group.tasks);
    setTasks(allTasks);
    
    const assignees = Array.from(new Set(allTasks.map(task => task.assignee).filter(Boolean))) as string[];
    setUniqueAssignees(assignees);
    
    const initialExpanded: Record<string, boolean> = {};
    analysisResult.groups.forEach(group => {
      initialExpanded[group.id] = true;
    });
    setExpandedGroups(initialExpanded);
  }, [analysisResult]);
  
  // Get user location
  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(response => response.json())
            .then(data => {
              const countryCode = data.countryCode || 'IN';
              const countryName = data.countryName || 'India';
              setLocation(`${countryName} (${countryCode})`);
            })
            .catch(() => {
              setLocation('India (IN)');
            })
            .finally(() => setIsGettingLocation(false));
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('India (IN)');
          setIsGettingLocation(false);
        }
      );
    } else {
      setLocation('India (IN)');
      setIsGettingLocation(false);
    }
  };
  
  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Get priority color and icon
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'none': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      case 'none': return <Target className="w-4 h-4 text-gray-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };
  
  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  // Toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    if (readOnly) return;
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const newCompletedState = !task.completed;
          
          const updatedSubtasks = task.subtasks?.map(subtask => ({
            ...subtask,
            completed: newCompletedState
          })) || [];
          
          return {
            ...task,
            completed: newCompletedState,
            subtasks: updatedSubtasks
          };
        }
        return task;
      });
      
      return updatedTasks;
    });
  };
  
  // Toggle subtask completion
  const toggleSubtaskCompletion = (taskId: string, subtaskId: string) => {
    if (readOnly) return;
    
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks?.map(subtask => 
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          ) || [];
          
          const allSubtasksCompleted = updatedSubtasks.length > 0 && 
            updatedSubtasks.every(subtask => subtask.completed);
          
          return {
            ...task,
            completed: allSubtasksCompleted,
            subtasks: updatedSubtasks
          };
        }
        return task;
      })
    );
  };
  
  // Calculate progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate total estimated time
  const calculateTotalEstimatedTime = () => {
    let totalTime = 0;
    
    tasks.forEach(task => {
      totalTime += task.estimatedTime || 15;
      
      if (task.subtasks) {
        task.subtasks.forEach(subtask => {
          totalTime += subtask.estimatedTime || 10;
        });
      }
    });
    
    return totalTime;
  };
  
  const totalEstimatedTime = calculateTotalEstimatedTime();
  
  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
    return matchesSearch && matchesPriority && matchesAssignee;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'none': 1 };
    
    switch (sortCriteria) {
      case 'priority-high':
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'priority-low':
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'deadline':
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'time':
        const timeA = a.estimatedTime || 15;
        const timeB = b.estimatedTime || 15;
        return timeB - timeA;
      default:
        return 0;
    }
  });
  
  // Group filtered tasks by original groups
  const groupedTasks: Record<string, TaskItem[]> = {};
  const taskToGroupMap: Record<string, string> = {};
  
  analysisResult.groups.forEach(group => {
    group.tasks.forEach(task => {
      taskToGroupMap[task.id] = group.id;
    });
  });
  
  sortedTasks.forEach(task => {
    const groupId = taskToGroupMap[task.id] || 'unassigned';
    if (!groupedTasks[groupId]) {
      groupedTasks[groupId] = [];
    }
    groupedTasks[groupId].push(task);
  });
  
  const getGroupById = (id: string): TaskGroup | undefined => {
    return analysisResult.groups.find(group => group.id === id);
  };
  
  // Export functions
  const handleExport = async (format: 'json' | 'pdf' | 'csv') => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'json':
          await exportToJson(analysisResult);
          break;
        case 'pdf':
          await exportToPdf(analysisResult);
          break;
        case 'csv':
          await exportToCsv(analysisResult);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 shadow-xl rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Progress Overview</h2>
          </div>
          <span className="text-sm font-medium">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-3 mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{completedTasks} completed</span>
          <span>{totalTasks} total tasks</span>
        </div>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultValue="tasks" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="mt-6">
          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select 
                  value={sortCriteria}
                  onChange={(e) => setSortCriteria(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto"
                >
                  <option value="default">Default Order</option>
                  <option value="priority-high">Priority (High to Low)</option>
                  <option value="priority-low">Priority (Low to High)</option>
                  <option value="deadline">Deadline</option>
                  <option value="time">Estimated Time</option>
                </select>
              </div>
              <div className="relative w-full sm:w-auto">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <select 
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="none">None</option>
                </select>
              </div>
              {uniqueAssignees.length > 0 && (
                <div className="relative w-full sm:w-auto">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <select 
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-md border bg-background focus:ring-2 focus:ring-primary focus:outline-none w-full sm:w-auto"
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
              
              const completedCount = groupTasks.filter(task => task.completed).length;
              const groupProgress = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;
              
              return (
                <div key={group.id}>
                  <Card className="overflow-hidden shadow-lg rounded-2xl border-primary/20">
                    {/* Group Header */}
                    <div 
                      className="p-4 sm:p-5 bg-gradient-to-r from-secondary/50 to-primary/10 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                      onClick={() => toggleGroup(group.id)} 
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg sm:text-xl">{group.name}</h3>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none">
                          <div className="flex justify-between text-xs mb-1">
                            <span>{completedCount}/{groupTasks.length} tasks</span>
                            <span>{groupProgress}%</span>
                          </div>
                          <Progress value={groupProgress} className="h-2" />
                        </div>
                        <Badge variant="secondary" className="text-sm py-1 px-3">
                          {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Badge>
                      </div>
                    </div>
                    
                    {expandedGroups[group.id] && groupTasks.length > 0 && (
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
                                <div className="flex flex-col items-center">
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                                    disabled={readOnly}
                                    className={`mt-1 w-5 h-5 rounded-full ${
                                      task.completed 
                                        ? 'bg-green-500 border-green-500 data-[state=checked]:text-white' 
                                        : 'border-primary'
                                    }`}
                                  />
                                  {task.completed && (
                                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.content}
                                  </p>
                                  
                                  {/* Subtasks */}
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <div className="mt-3 ml-2 space-y-2">
                                      <p className="text-sm font-medium text-muted-foreground">Subtasks:</p>
                                      {task.subtasks.map((subtask) => (
                                        <div key={subtask.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                                          <Checkbox
                                            checked={subtask.completed}
                                            onCheckedChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                            disabled={readOnly}
                                            className="mt-0.5 w-4 h-4 rounded"
                                          />
                                          <p className={`text-sm ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                                            {subtask.content}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Dependencies */}
                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-sm font-medium text-muted-foreground">Dependencies:</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {task.dependencies.map((depId, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {depId}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    <Badge className={`${getPriorityColor(task.priority)} flex items-center gap-1`}>
                                      {getPriorityIcon(task.priority)}
                                      {task.priority} priority
                                    </Badge>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(task.estimatedTime || 15)}
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
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          {/* Summary Section */}
          <div className="space-y-6">
            {analysisResult.summary && (
              <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 shadow-xl rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-full bg-primary/20">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-semibold text-lg">Project Summary</h2>
                </div>
                <p className="mb-6 text-lg">{analysisResult.summary.projectDescription}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Key Milestones
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.summary.milestones.map((milestone, index) => (
                        <li 
                          key={index} 
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg:black/10 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Resources Needed
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.summary.resources.map((resource, index) => (
                        <li 
                          key={index} 
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg:black/10 transition-colors"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {analysisResult.summary.risks && analysisResult.summary.risks.length > 0 && (
                    <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        Potential Risks
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.summary.risks.map((risk, index) => (
                          <li 
                            key={index} 
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg:black/10 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysisResult.summary.recommendations && analysisResult.summary.recommendations.length > 0 && (
                    <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.summary.recommendations.map((recommendation, index) => (
                          <li 
                            key={index} 
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg:black/10 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            {/* Analysis Stats */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 shadow-xl rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-primary/20">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-semibold text-lg">Project Statistics</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{analysisResult.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
                <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{analysisResult.groups.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </div>
                <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{uniqueAssignees.length}</p>
                  <p className="text-sm text-muted-foreground">Assignees</p>
                </div>
                <div className="bg-white/50 dark:bg:black/20 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{formatTime(totalEstimatedTime)}</p>
                  <p className="text-sm text-muted-foreground">Est. Time</p>
                </div>
              </div>
            </Card>
            
            {/* Location Info */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 shadow-xl rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-primary/20">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-semibold text-lg">Location Information</h2>
              </div>
              
              <div className="flex items-center gap-3">
                {location ? (
                  <>
                    <Flag className="w-5 h-5 text-primary" />
                    <span className="text-lg">{location}</span>
                  </>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        Get my location
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};