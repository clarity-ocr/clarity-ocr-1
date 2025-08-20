// src/pages/PublicChecklist.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Calendar,
  Tag,
  Target,
  Users,
  TrendingUp,
  BarChart3,
  MapPin,
  Flag,
  FileImage,
  PieChart,
  LineChart,
  Download,
  Loader2,
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { exportToPdf, exportToCsv } from '@/services/exportService';
import { AnalysisResult, TaskItem, TaskGroup } from '@/types/task';
import { getPublicHistoryItem } from '@/services/publicHistoryService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export const PublicChecklist = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string>('Untitled Document');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'summary'>('tasks');
  const [isExporting, setIsExporting] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // --- DATA FETCHING EFFECT ---
  useEffect(() => {
    console.log(`[PublicChecklist] Fetching public data for history ID: ${id}`);
    const fetchPublicHistoryItem = async () => {
      if (!id) {
        console.error("[PublicChecklist] No history ID provided in URL.");
        setError("Invalid checklist link.");
        setLoading(false);
        toast({
          title: "Invalid Link",
          description: "The checklist link is invalid.",
          variant: "destructive"
        });
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const historyItemData = await getPublicHistoryItem(id);
        if (historyItemData) {
          console.log("[PublicChecklist] Public history item loaded successfully.");
          setAnalysisResult(historyItemData.analysisResult);
          setFileName(historyItemData.fileName || 'Untitled Document');
          
          // Initialize tasks
          const allTasks: TaskItem[] = historyItemData.analysisResult.groups.flatMap(group => group.tasks);
          setTasks(allTasks);
          
          // Initialize expanded groups
          const initialExpanded: Record<string, boolean> = {};
          historyItemData.analysisResult.groups.forEach(group => {
            initialExpanded[group.id] = true; // Start with all groups expanded
          });
          setExpandedGroups(initialExpanded);
        } else {
          console.warn(`[PublicChecklist] Public history item with ID ${id} not found.`);
          setError("Checklist not found. It might have been deleted or is no longer accessible.");
          toast({
            title: "Checklist Not Found",
            description: "The requested checklist could not be found.",
            variant: "destructive"
          });
        }
      } catch (err: any) {
        console.error(`[PublicChecklist] Error fetching public history item ${id}:`, err);
        setError("Failed to load checklist data.");
        toast({
          title: "Load Failed",
          description: "An error occurred while loading the checklist.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPublicHistoryItem();
  }, [id, toast]);

  // --- DERIVED DATA & COMPUTATIONS ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

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

  const getGroupById = (id: string): TaskGroup | undefined => {
    return analysisResult?.groups.find(group => group.id === id);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive"
      });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast({
          title: "Location Error",
          description: "Unable to retrieve your location. Please check your browser settings.",
          variant: "destructive"
        });
        setIsGettingLocation(false);
      }
    );
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!analysisResult) return;
    setIsExporting(true);
    try {
      switch (format) {
        case 'pdf':
          await exportToPdf(analysisResult, fileName, true);
          break;
        case 'csv':
          await exportToCsv(analysisResult);
          break;
      }
      toast({
        title: "Export Successful",
        description: `Your checklist has been exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export as ${format.toUpperCase()}.`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyShareLink = () => {
    const publicUrl = `${window.location.origin}/public/checklist/${id}`;
    navigator.clipboard.writeText(publicUrl)
      .then(() => {
        toast({
          title: "Link Copied",
          description: "Public checklist link copied to clipboard.",
        });
      })
      .catch((error) => {
        console.error("Error copying to clipboard:", error);
        toast({
          title: "Copy Failed",
          description: "Failed to copy checklist link to clipboard.",
          variant: "destructive"
        });
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading public checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !analysisResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10">
        <div className="max-w-md w-full">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
            <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Checklist Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The requested checklist could not be found."}
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto py-2 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex flex-wrap gap-2 justify-center w-full sm:w-auto">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 py-2 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 py-2 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
              CSV
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 py-2 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 rounded-lg"
            >
              <Globe className="w-4 h-4" />
              Copy Link
            </button>
          </div>
        </div>
        
        {/* Title Section */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Task Analysis: {fileName}
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Found {analysisResult.totalTasks} tasks across {analysisResult.groups.length} categories
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            <Globe className="w-4 h-4" />
            <span>Public Read-Only View</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="p-4 mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold">Progress Overview</h2>
            </div>
            <span className="text-sm font-medium">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>{completedTasks} completed</span>
            <span>{totalTasks} total tasks</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mb-6 border-b">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'tasks' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'summary' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
        </div>
        
        {activeTab === 'tasks' ? (
          <>
            {/* Task Groups */}
            <div className="space-y-6">
              {analysisResult.groups.map((group) => {
                const groupTasks = tasks.filter(task => 
                  task.groupId === group.id || task.groupId === undefined
                );
                const completedCount = groupTasks.filter(task => task.completed).length;
                const groupProgress = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;
                
                return (
                  <div key={group.id}>
                    <div className="overflow-hidden shadow-lg rounded-2xl border-indigo-100">
                      <div
                        className="p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-indigo-50 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-100">
                            <Target className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg sm:text-xl">{group.name}</h3>
                            <p className="text-sm text-gray-600">{group.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="flex-1 sm:flex-none">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{completedCount}/{groupTasks.length} tasks</span>
                              <span>{groupProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${groupProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="bg-gray-100 text-gray-800 text-sm py-1 px-3 rounded-full">
                            {expandedGroups[group.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                      <AnimatePresence>
                        {expandedGroups[group.id] && groupTasks.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-4 border-t border-indigo-100 bg-white"
                          >
                            <div className="space-y-4">
                              {groupTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className={`p-4 rounded-xl border ${
                                    task.completed
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className="relative">
                                        <div className={`w-5 h-5 rounded-full border ${
                                          task.completed
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-gray-300'
                                        }`}>
                                          {task.completed && (
                                            <CheckCircle className="w-5 h-5 text-white absolute top-0 left-0" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                        {task.content}
                                      </p>
                                      {/* Subtasks */}
                                      {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mt-3 ml-2 space-y-2">
                                          <p className="text-sm font-medium text-gray-600">Subtasks:</p>
                                          {task.subtasks.map((subtask) => (
                                            <div key={subtask.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                                              <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
                                                {subtask.completed && (
                                                  <CheckSquare className="w-3 h-3 text-green-500" />
                                                )}
                                              </div>
                                              <p className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : ''}`}>
                                                {subtask.content}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {/* Dependencies */}
                                      {task.dependencies && task.dependencies.length > 0 && (
                                        <div className="mt-3">
                                          <p className="text-sm font-medium text-gray-600">Dependencies:</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {task.dependencies.map((depId, index) => (
                                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                                {depId}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        <span className={`${getPriorityColor(task.priority)} flex items-center gap-1 px-2 py-1 rounded-full text-xs`}>
                                          {getPriorityIcon(task.priority)}
                                          {task.priority} priority
                                        </span>
                                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                          <Clock className="w-3 h-3" />
                                          {formatTime(task.estimatedTime || 15)}
                                        </span>
                                        {task.deadline && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                            <Calendar className="w-3 h-3" />
                                            {task.deadline}
                                          </span>
                                        )}
                                        {task.assignee && (
                                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                            <User className="w-3 h-3" />
                                            @{task.assignee}
                                          </span>
                                        )}
                                        {task.tags.map((tag, index) => (
                                          <span
                                            key={index}
                                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                                          >
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Summary Section */
          <div className="space-y-6">
            {analysisResult.summary && (
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 shadow-xl rounded-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-full bg-indigo-100">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-lg">Project Summary</h2>
                </div>
                <p className="mb-6 text-lg">{analysisResult.summary.projectDescription}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-xl">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Key Milestones
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.summary.milestones.map((milestone, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 p-2 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                          <span>{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Resources Needed
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.summary.resources.map((resource, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 p-2 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {analysisResult.summary.risks && analysisResult.summary.risks.length > 0 && (
                    <div className="bg-white p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-indigo-600" />
                        Potential Risks
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.summary.risks.map((risk, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg"
                          >
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.summary.recommendations && analysisResult.summary.recommendations.length > 0 && (
                    <div className="bg-white p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {analysisResult.summary.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 p-2 rounded-lg"
                          >
                            <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 flex-shrink-0"></div>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Analysis Stats */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 shadow-xl rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-indigo-100">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-semibold text-lg">Project Statistics</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{analysisResult.totalTasks}</p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{analysisResult.groups.length}</p>
                  <p className="text-sm text-gray-600">Categories</p>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{new Set(tasks.map(t => t.assignee).filter(Boolean)).size}</p>
                  <p className="text-sm text-gray-600">Assignees</p>
                </div>
                <div className="bg-white p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold">{formatTime(totalEstimatedTime)}</p>
                  <p className="text-sm text-gray-600">Est. Time</p>
                </div>
              </div>
            </div>
            {/* Location Info */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100 shadow-xl rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-full bg-indigo-100">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="font-semibold text-lg">Location Information</h2>
              </div>
              <div className="flex items-center gap-3">
                {location ? (
                  <>
                    <Flag className="w-5 h-5 text-indigo-600" />
                    <span className="text-lg">{location}</span>
                  </>
                ) : (
                  <button
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-2 py-2 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
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
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicChecklist;