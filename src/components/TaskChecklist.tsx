import { useState, useEffect } from 'react';
import { Check, Circle, AlertCircle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task, type TaskGroup, Priority } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskChecklistProps {
  groups: TaskGroup[];
  onTaskToggle: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const priorityConfig = {
  high: {
    color: 'bg-priority-high text-white',
    icon: AlertCircle,
    label: 'High Priority'
  },
  medium: {
    color: 'bg-priority-medium text-white',
    icon: Clock,
    label: 'Medium Priority'
  },
  low: {
    color: 'bg-priority-low text-white',
    icon: Circle,
    label: 'Low Priority'
  }
};

const TaskItem = ({ task, onToggle, onUpdate }: { 
  task: Task; 
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = priorityConfig[task.priority];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "p-4 transition-smooth hover:shadow-md",
      task.completed && "opacity-75 bg-muted/50"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn(
                "font-medium transition-smooth",
                task.completed && "strikethrough completed text-muted-foreground"
              )}>
                {task.title}
              </h4>
              
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Badge className={cn("text-xs", config.color)}>
                <Icon className="w-3 h-3 mr-1" />
                {task.priority.toUpperCase()}
              </Badge>
              
              {task.deadline && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {task.deadline}
                </Badge>
              )}
            </div>
          </div>

          {task.description && task.description.length > 100 && (
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-auto text-primary">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Show more
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 animate-accordion-down">
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}

          {task.completed && task.completedAt && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3" />
              Completed {task.completedAt.toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const TaskGroup = ({ group, onTaskToggle, onUpdateTask }: {
  group: TaskGroup;
  onTaskToggle: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const completedTasks = group.tasks.filter(task => task.completed).length;
  const totalTasks = group.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-left">{group.category}</h3>
              <Badge variant="secondary" className="text-xs">
                {completedTasks}/{totalTasks} completed
              </Badge>
            </div>
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Button>
        </CollapsibleTrigger>
        
        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2 mt-2">
          <div 
            className="gradient-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CollapsibleContent className="space-y-3 animate-accordion-down">
          {group.tasks.map((task) => (
            <div key={task.id} className="animate-fade-in">
              <TaskItem
                task={task}
                onToggle={onTaskToggle}
                onUpdate={onUpdateTask}
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export const TaskChecklist = ({ groups, onTaskToggle, onUpdateTask }: TaskChecklistProps) => {
  const [sortedGroups, setSortedGroups] = useState<TaskGroup[]>([]);

  useEffect(() => {
    // Sort tasks within groups by priority and completion status
    const sorted = groups.map(group => ({
      ...group,
      tasks: [...group.tasks].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Completed tasks go to bottom
        }
        
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
    }));
    
    setSortedGroups(sorted);
  }, [groups]);

  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);
  const completedTasks = groups.reduce((sum, group) => 
    sum + group.tasks.filter(task => task.completed).length, 0
  );

  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <Card className="p-6 gradient-subtle">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">AI-Generated Checklist</h2>
          <Badge className="text-sm gradient-primary text-white">
            {completedTasks}/{totalTasks} Tasks Complete
          </Badge>
        </div>
        
        <div className="w-full bg-background/50 rounded-full h-3">
          <div 
            className="gradient-primary h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Tasks automatically extracted and prioritized by AI
        </p>
      </Card>

      {/* Task Groups */}
      <div className="space-y-8">
        {sortedGroups.map((group, index) => (
          <div key={group.category} 
               className="animate-slide-up" 
               style={{ animationDelay: `${index * 0.1}s` }}>
            <TaskGroup
              group={group}
              onTaskToggle={onTaskToggle}
              onUpdateTask={onUpdateTask}
            />
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No tasks found</p>
            <p className="text-sm">Upload a document to get started with AI task extraction</p>
          </div>
        </Card>
      )}
    </div>
  );
};