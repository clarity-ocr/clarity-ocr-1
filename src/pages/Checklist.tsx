import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Brain, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskChecklist } from '@/components/TaskChecklist';
import { FilterControls } from '@/components/FilterControls';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResult, Task, Priority } from '@/types/task';

interface ChecklistPageProps {
  analysisResult: AnalysisResult;
  onBack: () => void;
}

export const ChecklistPage = ({ analysisResult, onBack }: ChecklistPageProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'category' | 'deadline'>('priority');
  const { toast } = useToast();

  // Initialize tasks from analysis result
  useEffect(() => {
    const allTasks = analysisResult.groups.flatMap(group => 
      group.tasks.map(task => ({ ...task, category: group.category }))
    );
    setTasks(allTasks);
  }, [analysisResult]);

  // Filter and sort tasks
  const filteredAndSortedGroups = useMemo(() => {
    let filteredTasks = tasks;

    // Apply search filter
    if (searchTerm.trim()) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }

    // Sort tasks
    filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        default:
          return 0;
      }
    });

    // Group by category
    const groupMap = new Map<string, Task[]>();
    filteredTasks.forEach(task => {
      const category = task.category || 'General Tasks';
      if (!groupMap.has(category)) {
        groupMap.set(category, []);
      }
      groupMap.get(category)!.push(task);
    });

    return Array.from(groupMap.entries()).map(([category, tasks]) => ({
      category,
      tasks
    }));
  }, [tasks, searchTerm, priorityFilter, sortBy]);

  const handleTaskToggle = (taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const completed = !task.completed;
          return {
            ...task,
            completed,
            completedAt: completed ? new Date() : undefined
          };
        }
        return task;
      });

      // Show completion toast
      const toggledTask = updatedTasks.find(task => task.id === taskId);
      if (toggledTask?.completed) {
        toast({
          title: "Task completed! 🎉",
          description: `"${toggledTask.title}" has been marked as done.`
        });
      }

      return updatedTasks;
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  };

  const handleExport = () => {
    const data = {
      summary: analysisResult.summary,
      estimatedTime: analysisResult.estimatedTime,
      tasks: tasks,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovable-ai-checklist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Checklist exported!",
      description: "Your checklist has been downloaded as a JSON file."
    });
  };

  const handleShare = () => {
    const shareText = `Check out my AI-generated checklist:\n\n${tasks.map((task, index) => 
      `${index + 1}. ${task.completed ? '✅' : '☐'} ${task.title}`
    ).join('\n')}`;

    if (navigator.share) {
      navigator.share({
        title: 'Lovable AI Checklist',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share your checklist by pasting it anywhere."
      });
    }
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const completionPercentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI-Generated Checklist</h1>
              <p className="text-muted-foreground">
                Intelligently extracted and prioritized tasks
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{completionPercentage}%</p>
                  <p className="text-sm text-muted-foreground">Complete</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{analysisResult.estimatedTime}</p>
                  <p className="text-sm text-muted-foreground">Est. Time</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  <p className="text-sm text-muted-foreground">AI Tasks</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Analysis Summary */}
        {analysisResult.summary && (
          <Card className="p-6 mb-6 gradient-subtle">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Analysis Summary
            </h3>
            <p className="text-muted-foreground">{analysisResult.summary}</p>
          </Card>
        )}

        {/* Filter Controls */}
        <div className="mb-6">
          <FilterControls
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onExport={handleExport}
            onShare={handleShare}
            totalTasks={tasks.length}
            completedTasks={completedTasks}
          />
        </div>

        {/* Task Checklist */}
        <TaskChecklist
          groups={filteredAndSortedGroups}
          onTaskToggle={handleTaskToggle}
          onUpdateTask={handleUpdateTask}
        />
      </div>
    </div>
  );
};