import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicChecklist } from '@/services/shareService';
import { HistoryItem } from '@/types/task';
import { Loader2, AlertCircle, FileText, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PublicChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<HistoryItem | null>(null);
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
    if (!item) return { total: 0, completed: 0, percentage: 0 };
    const allTasks = item.analysisResult.groups.flatMap(g => g.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    return {
      total: allTasks.length,
      completed,
      percentage: allTasks.length > 0 ? (completed / allTasks.length) * 100 : 0,
    };
  }, [item]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;
  if (error) return <div className="container p-4 text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-semibold">{error}</h2></div>;
  if (!item) return null;

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <h1 className="text-center text-sm text-gray-500 mb-4">You are viewing a shared checklist</h1>
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-7 h-7 text-purple-600" />
            <h2 className="text-3xl font-bold">{item.title}</h2>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{item.analysisResult.summary?.projectDescription}</p>
          <div className="flex justify-between items-center mb-2 text-sm"><p>Progress</p><p>{progressStats.completed} / {progressStats.total} Tasks</p></div>
          <Progress value={progressStats.percentage} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-3"><ListChecks className="w-6 h-6 text-purple-600" />Task Groups</h3>
        <Accordion type="multiple" defaultValue={item.analysisResult.groups.map(g => g.id)} className="w-full">
          {item.analysisResult.groups.map(group => (
            <AccordionItem value={group.id} key={group.id}>
              <AccordionTrigger className="text-lg font-semibold"><div className="flex items-center gap-3">{group.name}<Badge variant="secondary">{group.tasks.length}</Badge></div></AccordionTrigger>
              <AccordionContent className="pl-2 border-l-2">
                {group.tasks.map(task => (
                  <div key={task.id} className={`flex items-start gap-3 p-3 ${task.completed ? 'opacity-60' : ''}`}>
                    <input type="checkbox" checked={task.completed} readOnly className="mt-1 h-5 w-5" />
                    <div className="flex-1">
                      <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>{task.content}</p>
                      <p className="text-xs text-gray-500">Priority: {task.priority}</p>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default PublicChecklistPage;