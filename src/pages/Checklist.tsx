// src/pages/Checklist.tsx
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
  CheckSquare,
  Square,
  Loader2,
  Share2,
  MapPin,
  Flag,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Printer,
  Save,
  Settings,
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Star,
  StarHalf,
  Lock,
  Unlock,
  Globe,
  Shield,
  Zap,
  Sparkles,
  FileImage,
  File as FileIcon,
  Database,
  PieChart,
  LineChart,
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown,
  DollarSign,
  CreditCard,
  ShoppingCart,
  Package,
  Truck,
  Award,
  Gift,
  Camera,
  Video,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Wifi,
  Bluetooth,
  Battery,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Navigation,
  Map,
  Compass,
  Anchor,
  Sailboat,
  Car,
  Bike,
  Plane,
  Rocket,
  Flame,
  Snowflake,
  Leaf,
  TreePine,
  Mountain,
  Waves,
  Sunrise,
  Sunset,
  Candy,
  Coffee,
  Wine,
  Beer,
  GlassWater,
  Apple,
  Cherry,
  Carrot,
  Egg,
  Milk,
  Pizza,
  Cake,
  IceCream,
  Cookie,
  CandyCane,
  Lollipop,
  Popcorn,
  Film,
  Gamepad2,
  Headphones,
  Mic,
  Speaker,
  Tv,
  Radio,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Plug,
  BatteryCharging,
  Power,
  RefreshCw,
  RotateCw,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  Square as SquareIcon,
  Circle,
  Triangle,
  Hexagon,
  Octagon,
  Pentagon,
  Diamond,
  Heart,
  Ban,
  Flag as FlagIcon,
  Bookmark,
  MessageCircle as MessageCircleIcon,
  Send,
  Reply,
  Forward,
  Archive,
  Inbox,
  Mailbox,
  SendHorizonal,
  ReplyAll,
  Forward as ForwardIcon,
  AtSign,
  PhoneCall,
  Video as VideoIcon,
  Mic as MicIcon,
  Volume2 as Volume2Icon,
  VolumeX as VolumeXIcon,
  Bell,
  BellOff,
  Wifi as WifiIcon,
  Bluetooth as BluetoothIcon,
  Battery as BatteryIcon,
  BatteryCharging as BatteryChargingIcon,
  Power as PowerIcon,
  Settings as SettingsIcon,
  User as UserIcon,
  Lock as LockIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Search as SearchIcon,
  Menu,
  X as XIcon,
  Home,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderClosed,
  HardDrive as HardDriveIcon,
  Server as ServerIcon,
  Cpu as CpuIcon,
  MemoryStick as MemoryStickIcon,
  Plug as PlugIcon,
  Database as DatabaseIcon,
  Globe as GlobeIcon,
  Shield as ShieldIcon,
  Award as AwardIcon,
  Gift as GiftIcon,
  Trophy,
  Medal,
  Star as StarFullIcon,
  Heart as HeartFullIcon,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Share as ShareIcon,
  Printer as PrinterIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Undo,
  Redo,
  Scissors,
  Layers,
  Grid,
  Table,
  MapPin as MapPinFullIcon,
  UserCheck,
  UserPlus,
  UserMinus,
  Users as UsersIcon,
  ShoppingCart as ShoppingCartIcon,
  CreditCard as CreditCardIcon,
  DollarSign as DollarSignIcon,
  Percent,
  Activity as ActivityIcon,
  TrendingUp as TrendingUpFullIcon,
  TrendingDown as TrendingDownIcon,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart,
  Box,
  Package as PackageIcon,
  Truck as TruckIcon,
  Award as AwardFullIcon,
  Gift as GiftFullIcon,
  Trophy as TrophyFullIcon,
  Medal as MedalFullIcon,
  Star as StarEmptyIcon,
  Heart as HeartEmptyIcon,
  ThumbsUp as ThumbsUpOutlineIcon,
  ThumbsDown as ThumbsDownOutlineIcon,
  Share2 as Share2Icon,
  Printer as PrinterOutlineIcon,
  Save as SaveOutlineIcon,
  Edit as EditOutlineIcon,
  Undo as UndoOutlineIcon,
  Redo as RedoOutlineIcon,
  Scissors as ScissorsOutlineIcon,
  Copy as CopyIcon,
  Download as DownloadOutlineIcon,
  Upload,
  Trash2 as Trash2OutlineIcon,
  RotateCcw,
  RotateCw as RotateCwOutlineIcon,
  RefreshCw as RefreshCwOutlineIcon,
  Settings2,
  Filter as FilterIcon,
  SortAsc,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Hash,
  Paperclip,
  AtSign as AtSignFullIcon,
  Phone as PhoneFullIcon,
  Mail as MailFullIcon,
  MapPin as MapPinIcon,
  UserCheck as UserCheckIcon,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  Users as UsersOutlineIcon,
  ShoppingCart as ShoppingCartOutlineIcon,
  CreditCard as CreditCardOutlineIcon,
  DollarSign as DollarSignOutlineIcon,
  Percent as PercentOutlineIcon,
  Activity as ActivityOutlineIcon,
  TrendingUp as TrendingUpOutlineIcon,
  TrendingDown as TrendingDownOutlineIcon,
  BarChart2 as BarChart2OutlineIcon,
  PieChart as PieChartOutlineIcon,
  LineChart as LineChartOutlineIcon,
  AreaChart as AreaChartOutlineIcon,
  Box as BoxOutlineIcon,
  Package as PackageOutlineIcon,
  Truck as TruckOutlineIcon,
  Award as AwardOutlineIcon,
  Gift as GiftOutlineIcon,
  Trophy as TrophyOutlineIcon,
  Medal as MedalOutlineIcon,
  Star as StarOutlineIcon,
  Heart as HeartOutlineIcon,
  ThumbsUp as ThumbsUpFullIcon,
  ThumbsDown as ThumbsDownFullIcon,
  Share as ShareOutlineIcon,
  Printer as PrinterFullIcon,
  Save as SaveFullIcon,
  Edit as EditFullIcon,
  Undo as UndoFullIcon,
  Redo as RedoFullIcon,
  Scissors as ScissorsFullIcon,
  Copy as CopyOutlineIcon,
  Download as DownloadFullIcon,
  Upload as UploadOutlineIcon,
  Trash2 as Trash2FullIcon,
  RotateCcw as RotateCcwFullIcon,
  RotateCw as RotateCwFullIcon,
  RefreshCw as RefreshCwFullIcon,
  Settings2 as Settings2OutlineIcon,
  Filter as FilterOutlineIcon,
  SortAsc as SortAscOutlineIcon,
  Calendar as CalendarOutlineIcon,
  Clock as ClockOutlineIcon,
  Hash as HashOutlineIcon,
  Link as LinkOutlineIcon,
  Paperclip as PaperclipOutlineIcon,
  AtSign as AtSignOutlineIcon,
  Phone as PhoneOutlineIcon,
  Mail as MailOutlineIcon,
  MapPin as MapPinOutlineIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { exportToJson, exportToPdf, exportToCsv } from '@/services/exportService';
import { AnalysisResult, TaskItem, TaskGroup } from '@/types/task';
import { getHistoryItem } from '@/services/historyService';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ChecklistProps {
  user?: any;
}

export const Checklist: React.FC<ChecklistProps> = ({ user }) => {
  // --- HOOKS & STATE ---
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string>('Untitled Document');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [uniqueAssignees, setUniqueAssignees] = useState<string[]>([]);
  const [sortCriteria, setSortCriteria] = useState<string>('default');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'summary'>('tasks');
  const [location, setLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTasksForSharing, setSelectedTasksForSharing] = useState<Record<string, boolean>>({});
  const [historyItem, setHistoryItem] = useState<any>(null);

  // --- DATA FETCHING EFFECT ---
  useEffect(() => {
    console.log(`[Checklist] Fetching data for history ID: ${id}`);
    const fetchHistoryItem = async () => {
      if (!id) {
        console.error("[Checklist] No history ID provided in URL.");
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
        const historyItemData = await getHistoryItem(id);
        
        if (historyItemData) {
          console.log("[Checklist] History item loaded successfully.");
          setHistoryItem(historyItemData);
          setAnalysisResult(historyItemData.analysisResult);
          setFileName(historyItemData.fileName || 'Untitled Document');
          
          // Initialize tasks
          const allTasks: TaskItem[] = historyItemData.analysisResult.groups.flatMap(group => group.tasks);
          setTasks(allTasks);
          
          // Extract unique assignees
          const assignees = Array.from(new Set(allTasks.map(task => task.assignee).filter(Boolean))) as string[];
          setUniqueAssignees(assignees);
          
          // Initialize expanded groups
          const initialExpanded: Record<string, boolean> = {};
          historyItemData.analysisResult.groups.forEach(group => {
            initialExpanded[group.id] = true; // Start with all groups expanded
          });
          setExpandedGroups(initialExpanded);
        } else {
          console.warn(`[Checklist] History item with ID ${id} not found.`);
          setError("Checklist not found. It might have been deleted.");
          toast({
            title: "Checklist Not Found",
            description: "The requested checklist could not be found.",
            variant: "destructive"
          });
        }
      } catch (err: any) {
        console.error(`[Checklist] Error fetching history item ${id}:`, err);
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
    
    fetchHistoryItem();
  }, [id, toast]);

  // --- DERIVED DATA & COMPUTATIONS (Memoized) ---
  const totalTasks = useMemo(() => tasks.length, [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.completed).length, [tasks]);
  const progressPercentage = useMemo(() => {
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [totalTasks, completedTasks]);

  const calculateTotalEstimatedTime = useCallback(() => {
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
  }, [tasks]);

  const totalEstimatedTime = useMemo(calculateTotalEstimatedTime, [calculateTotalEstimatedTime]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchTerm, filterPriority, filterAssignee]);

  const sortedTasks = useMemo(() => {
    const priorityOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'none': 1 };
    return [...filteredTasks].sort((a, b) => {
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
  }, [filteredTasks, sortCriteria]);

  const groupedTasks: Record<string, TaskItem[]> = useMemo(() => {
    const groups: Record<string, TaskItem[]> = {};
    const taskToGroupMap: Record<string, string> = {};
    
    if (analysisResult) {
      analysisResult.groups.forEach(group => {
        group.tasks.forEach(task => {
          taskToGroupMap[task.id] = group.id;
        });
      });
    }
    
    sortedTasks.forEach(task => {
      const groupId = taskToGroupMap[task.id] || 'unassigned';
      if (!groups[groupId]) groups[groupId] = [];
      groups[groupId].push(task);
    });
    
    return groups;
  }, [sortedTasks, analysisResult]);

  const getGroupById = useCallback((id: string): TaskGroup | undefined => {
    return analysisResult?.groups.find(group => group.id === id);
  }, [analysisResult]);

  // --- HANDLERS ---
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      case 'none': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Target className="w-4 h-4 text-green-500" />;
      case 'none': return <Target className="w-4 h-4 text-gray-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  const formatTime = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }, []);

  const toggleTaskCompletion = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      return prevTasks.map(task => {
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
    });
  }, []);

  const toggleSubtaskCompletion = useCallback((taskId: string, subtaskId: string) => {
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
  }, []);

  const handleExport = useCallback(async (format: 'json' | 'pdf' | 'csv') => {
    if (!analysisResult) return;
    
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
  }, [analysisResult, toast]);

  const getLocation = useCallback(() => {
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
        toast({
          title: "Location Retrieved",
          description: "Your location has been added to the checklist.",
        });
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
  }, [toast]);

  const shareChecklist = useCallback(() => {
    if (!analysisResult) return;
    
    setIsSharing(true);
    
    // Create a shareable text
    const shareText = `Check out this task analysis: ${fileName}\n\n${analysisResult.summary?.projectDescription || 'No description available'}\n\nTotal tasks: ${analysisResult.totalTasks}\nCategories: ${analysisResult.groups.length}`;
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: `Task Analysis: ${fileName}`,
        text: shareText,
        url: window.location.href,
      })
        .then(() => {
          toast({
            title: "Shared Successfully",
            description: "Your checklist has been shared.",
          });
        })
        .catch((error) => {
          console.error("Error sharing:", error);
          toast({
            title: "Share Failed",
            description: "Failed to share the checklist.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsSharing(false);
        });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText}\n\nView here: ${window.location.href}`)
        .then(() => {
          toast({
            title: "Copied to Clipboard",
            description: "Checklist link copied to clipboard.",
          });
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error);
          toast({
            title: "Copy Failed",
            description: "Failed to copy checklist to clipboard.",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsSharing(false);
        });
    }
  }, [analysisResult, fileName, toast]);

  // --- RENDERING LOGIC ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/10">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg">Loading your checklist...</p>
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
              onClick={() => navigate('/')}
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

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto py-2 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </button>
          <div className="flex flex-wrap gap-2 justify-center w-full sm:w-auto">
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 py-2 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
              JSON
            </button>
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
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              CSV
            </button>
            <button
              onClick={shareChecklist}
              disabled={isSharing}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 py-2 px-4 bg-green-50 hover:bg-green-100 border-green-200 text-green-700 rounded-lg"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Share
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
          {historyItem && (
            <p className="text-sm text-gray-500 mt-2">
              Analyzed {formatDistanceToNow(new Date(historyItem.createdAt), { addSuffix: true })}
            </p>
          )}
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
            {/* Filters and Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full py-2 px-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={sortCriteria}
                    onChange={(e) => setSortCriteria(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="default">Default Order</option>
                    <option value="priority-high">Priority (High to Low)</option>
                    <option value="priority-low">Priority (Low to High)</option>
                    <option value="deadline">Deadline</option>
                    <option value="time">Estimated Time</option>
                  </select>
                </div>
                <div className="relative w-full sm:w-auto">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <select
                      value={filterAssignee}
                      onChange={(e) => setFilterAssignee(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                                  className={`p-4 rounded-xl border transition-all duration-300 ${
                                    task.completed
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-white hover:bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={task.completed}
                                          onChange={() => toggleTaskCompletion(task.id)}
                                          className={`w-5 h-5 rounded-full ${
                                            task.completed
                                              ? 'bg-green-500 border-green-500'
                                              : 'border-gray-300'
                                          }`}
                                        />
                                        {task.completed && (
                                          <CheckCircle className="w-5 h-5 text-green-500 absolute top-0 left-0" />
                                        )}
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
                                              <input
                                                type="checkbox"
                                                checked={subtask.completed}
                                                onChange={() => toggleSubtaskCompletion(task.id, subtask.id)}
                                                className="mt-0.5 w-4 h-4 rounded"
                                              />
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
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                            className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
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
                  <p className="text-2xl font-bold">{uniqueAssignees.length}</p>
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
export default Checklist;