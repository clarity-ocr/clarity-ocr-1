import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicChecklist } from '@/services/shareService';
import { Loader2, AlertCircle, FileText, ListChecks, UserCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/**
 * [CORRECTED] The interface for the public checklist item.
 * The `summary` property is now correctly typed to accept an object, undefined, OR null,
 * which resolves the TypeScript error by matching the actual data structure from the API.
 */
interface PublicHistoryItem {
  id: string;
  title: string;
  sharedBy?: {
    name?: string;
  };
  analysisResult: {
    summary?: {
      projectDescription?: string;
    } | null; // This `| null` is the fix.
    groups: Array<{
      id: string;
      name: string;
      tasks: Array<{
        id: string;
        content: string;
        completed: boolean;
        priority: 'High' | 'Medium' | 'Low';
      }>;
    }>;
  };
}

const PublicChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<PublicHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No checklist ID provided.");
      setLoading(false);
      return;
    }
    const fetchPublicData = async () => {
      try {
        // The 'data' received here can have `summary: null`, which is now compatible with `PublicHistoryItem`.
        const data = await getPublicChecklist(id);
        setItem(data);
      } catch (err) {
        setError("This checklist is not public or does not exist.");
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [id]);

  const progressStats = useMemo(() => {
    if (!item?.analysisResult?.groups) return { total: 0, completed: 0, percentage: 0 };
    const allTasks = item.analysisResult.groups.flatMap(g => g.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    return {
      total: allTasks.length,
      completed,
      percentage: allTasks.length > 0 ? (completed / allTasks.length) * 100 : 0,
    };
  }, [item]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-500" />
          <p className="text-lg text-slate-600 dark:text-slate-400">Loading checklist...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200">
        <Card className="w-full max-w-lg bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-red-500/30">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
      <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>
      
      <div className="container mx-auto max-w-4xl p-4 md:p-8 relative z-10">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">You are viewing a shared checklist</p>
        
        <Card className="mb-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start gap-4 justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <FileText className="w-8 h-8 text-sky-500 flex-shrink-0" />
                  <h2 className="text-3xl font-bold font-sora text-slate-900 dark:text-white">{item.title}</h2>
                </div>
                {item.sharedBy?.name && (
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-2 ml-12">
                    <UserCircle className="w-4 h-4" />
                    <span>Shared by {item.sharedBy.name}</span>
                  </div>
                )}
              </div>
            </div>
            {/* 
              This check is safe because optional chaining (?.) handles cases where `summary`
              is either undefined or null, preventing runtime errors.
            */}
            {item.analysisResult.summary?.projectDescription && (
              <p className="text-slate-600 dark:text-slate-300 mt-4">{item.analysisResult.summary.projectDescription}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2 text-sm text-slate-600 dark:text-slate-400">
              <p className="font-semibold">Overall Progress</p>
              <p className="font-bold">{progressStats.completed} / {progressStats.total} Tasks Completed</p>
            </div>
            <Progress value={progressStats.percentage} className="[&>*]:bg-gradient-to-r [&>*]:from-sky-500 [&>*]:to-indigo-500" />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-sora flex items-center gap-3 text-slate-900 dark:text-white">
            <ListChecks className="w-7 h-7 text-sky-500" />
            Task Groups
          </h3>
          <Accordion type="multiple" defaultValue={item.analysisResult.groups.map(g => g.id)} className="w-full space-y-3">
            {item.analysisResult.groups.map(group => (
              <AccordionItem value={group.id} key={group.id} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-xl overflow-hidden">
                <AccordionTrigger className="text-lg font-semibold p-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">{group.name}
                    <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{group.tasks.length} tasks</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-200/80 dark:border-slate-700/80">
                  <ul className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                    {group.tasks.map(task => (
                      <li key={task.id} className={`flex items-start gap-4 p-4 ${task.completed ? 'opacity-60' : ''}`}>
                        <div className={`mt-1 w-5 h-5 flex-shrink-0 rounded-md flex items-center justify-center ${task.completed ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                          {task.completed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-slate-700 dark:text-slate-200 ${task.completed ? 'line-through' : ''}`}>{task.content}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Priority: {task.priority}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default PublicChecklistPage;