import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  CheckSquare, 
  Clock, 
  Plus,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Services & Types
import { 
  fetchQuickStats, 
  fetchRecentActivity, 
  fetchUpcomingDeadlines, 
  fetchRecentDocuments 
} from '@/services/dashboardService';
import type { 
  QuickStats, 
  ActivityLog, 
  UpcomingDeadline, 
  RecentDocument 
} from '@/types/dashboard';

// --- Sub-Component: Quick Stat Card ---
const StatCard = ({ title, value, icon: Icon, trend, subtext, colorClass }: any) => (
  <Card className="relative overflow-hidden border-none shadow-md bg-white dark:bg-slate-800">
    <div className={`absolute right-0 top-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full opacity-10 ${colorClass}`} />
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
      </div>
      {(trend || subtext) && (
        <div className="mt-4 flex items-center text-xs">
          {trend && (
            <span className="text-emerald-500 font-medium flex items-center bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded mr-2">
              +{trend}%
            </span>
          )}
          <span className="text-slate-400">{subtext}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// --- Sub-Component: Document Card ---
const DocumentCard = ({ doc }: { doc: RecentDocument }) => {
  const statusColors = {
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="min-w-[200px] w-[200px] p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col snap-start"
    >
      <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group">
        <FileText className="w-8 h-8 text-slate-400" />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <Button size="sm" variant="secondary" className="h-8 text-xs">View</Button>
        </div>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={doc.name}>{doc.name}</h4>
        <p className="text-xs text-slate-500 mt-1">{formatDistanceToNow(doc.uploadDate)} ago</p>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColors[doc.status]}`}>
          {doc.status.toUpperCase()}
        </span>
        {doc.status === 'completed' && (
          <span className={`text-[10px] font-bold ${doc.confidence > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {doc.confidence}% Conf.
          </span>
        )}
      </div>
    </motion.div>
  );
};

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [deadlines, setDeadlines] = useState<UpcomingDeadline[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsData, activityData, deadlineData, docsData] = await Promise.all([
          fetchQuickStats(),
          fetchRecentActivity(),
          fetchUpcomingDeadlines(),
          fetchRecentDocuments()
        ]);
        
        setStats(statsData);
        setActivities(activityData);
        setDeadlines(deadlineData);
        setRecentDocs(docsData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) loadDashboardData();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1121] p-4 md:p-8 space-y-8 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); .font-sans { font-family: 'Inter', sans-serif; }`}</style>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user.displayName?.split(' ')[0] || 'User'}. Here's what's happening.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/upload')}>
            <UploadCloud className="w-4 h-4 mr-2" /> Upload
          </Button>
          <Button className="bg-sky-600 hover:bg-sky-700 text-white" onClick={() => navigate('/tasks/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />)
        ) : stats ? (
          <>
            <StatCard 
              title="Documents" 
              value={stats.documentsUploaded} 
              trend={stats.documentsTrend} 
              subtext="vs last month"
              icon={FileText}
              colorClass="bg-blue-500 text-blue-500"
            />
            <StatCard 
              title="Pending Tasks" 
              value={stats.tasksPending} 
              icon={Clock}
              colorClass="bg-amber-500 text-amber-500"
              subtext={`${stats.tasksCompleted} completed`}
            />
            <StatCard 
              title="Storage Used" 
              value={`${Math.round((stats.storageUsed / 1024) * 100)}%`}
              icon={HardDrive}
              colorClass="bg-purple-500 text-purple-500"
              subtext={`${stats.storageUsed}MB of ${stats.storageLimit}MB`}
            />
             <StatCard 
              title="Efficiency" 
              value="94%" 
              trend={2.4}
              subtext="OCR Accuracy"
              icon={CheckSquare}
              colorClass="bg-emerald-500 text-emerald-500"
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Document Carousel */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Documents</h2>
              <Button variant="ghost" size="sm" className="text-sky-600" onClick={() => navigate('/documents')}>View All</Button>
            </div>
            {/* Horizontal Scroll Area */}
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex space-x-4 pb-4 px-1" style={{ scrollSnapType: 'x mandatory' }}>
                {recentDocs.length > 0 ? (
                  recentDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
                ) : (
                   <div className="w-full text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No documents yet. Upload one to get started.</p>
                   </div>
                )}
              </div>
            </ScrollArea>
          </section>

          {/* Activity Feed */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Real-time updates from your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4 relative">
                     {/* Connector Line */}
                     {index !== activities.length - 1 && (
                        <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-slate-100 dark:bg-slate-700" />
                     )}
                     
                     <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm z-10">
                        <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                          {activity.userAvatar || activity.user.charAt(0)}
                        </AvatarFallback>
                     </Avatar>
                     
                     <div className="flex-1">
                        <p className="text-sm text-slate-800 dark:text-slate-200">
                          <span className="font-semibold">{activity.user}</span> {activity.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(activity.timestamp)} ago
                        </p>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3 width) - Deadlines & Storage */}
        <div className="space-y-8">
          
          {/* Upcoming Deadlines Widget */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">Upcoming Deadlines</CardTitle>
              <Badge variant="outline" className="font-normal">Next 7 Days</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {deadlines.length > 0 ? deadlines.map((task) => {
                  const priorityColors = {
                    high: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
                    medium: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
                    low: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
                  };

                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 border-l-4 rounded-r-lg ${priorityColors[task.priority]} flex justify-between items-start group hover:shadow-sm transition-shadow`}
                    >
                      <div>
                        <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-200">{task.title}</h5>
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{task.documentName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold ${
                           task.priority === 'high' ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {format(task.dueDate, 'MMM d')}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" size="icon" className="h-6 w-6 mt-1"><ArrowRight className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                   <p className="text-sm text-slate-500 text-center py-4">No upcoming deadlines.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Storage Widget */}
          {stats && (
            <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardContent className="p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-lg">
                       <UploadCloud className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                       <h4 className="font-semibold text-sm">Storage Usage</h4>
                       <p className="text-xs text-slate-400">Firebase Cloud Storage</p>
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                       <span>{stats.storageUsed} MB Used</span>
                       <span className="text-slate-400">{stats.storageLimit} MB Limit</span>
                    </div>
                    {/* Fixed: Removed indicatorClassName */}
                    <Progress value={(stats.storageUsed / stats.storageLimit) * 100} className="h-2 bg-slate-700" />
                 </div>

                 <Button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-none text-xs h-8">
                    Upgrade Plan
                 </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}