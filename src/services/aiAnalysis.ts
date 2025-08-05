import { Task, TaskGroup, AnalysisResult, Priority } from '@/types/task';

// Mock AI analysis service - in production this would call actual AI APIs
export const analyzeDocument = async (content: string, fileName?: string): Promise<AnalysisResult> => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

  // Mock AI analysis logic
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  const groups: TaskGroup[] = [];
  let currentCategory = 'General Tasks';
  let taskId = 1;

  // Simulate intelligent task extraction
  const extractedTasks: Task[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect headings (categories)
    if (isHeading(trimmedLine)) {
      currentCategory = cleanHeading(trimmedLine);
      continue;
    }
    
    // Detect tasks
    if (isTask(trimmedLine)) {
      const task = createTaskFromLine(trimmedLine, taskId.toString(), currentCategory);
      extractedTasks.push(task);
      taskId++;
    }
  }

  // Group tasks by category
  const categoryMap = new Map<string, Task[]>();
  extractedTasks.forEach(task => {
    const category = task.category || 'General Tasks';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(task);
  });

  // Convert to TaskGroup array
  categoryMap.forEach((tasks, category) => {
    groups.push({ category, tasks });
  });

  // If no specific tasks found, create some from the content
  if (extractedTasks.length === 0) {
    groups.push({
      category: fileName || 'Document Tasks',
      tasks: createFallbackTasks(content)
    });
  }

  return {
    groups,
    totalTasks: extractedTasks.length || groups[0]?.tasks.length || 0,
    estimatedTime: calculateEstimatedTime(extractedTasks.length || groups[0]?.tasks.length || 0),
    summary: generateSummary(groups)
  };
};

function isHeading(line: string): boolean {
  // Detect various heading patterns
  return (
    line.includes('#') ||
    line.includes('==') ||
    line.includes('--') ||
    line.toUpperCase() === line ||
    /^\d+\.\s*[A-Z]/.test(line) ||
    line.includes(':') && line.length < 50
  );
}

function cleanHeading(line: string): string {
  return line
    .replace(/#+\s*/, '')
    .replace(/[=\-]+/g, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/:$/, '')
    .trim();
}

function isTask(line: string): boolean {
  const taskIndicators = [
    /^[-*•]\s+/,  // Bullet points
    /^\d+\.\s+/,  // Numbered lists
    /^[√✓☐☑]\s+/, // Checkboxes
    /\b(todo|task|action|complete|finish|review|prepare|submit|create|update|fix|implement)\b/i,
    /\b(deadline|due|by|before|until)\b/i
  ];
  
  return taskIndicators.some(pattern => pattern.test(line)) || 
         line.toLowerCase().includes('need to') ||
         line.toLowerCase().includes('should') ||
         line.toLowerCase().includes('must');
}

function createTaskFromLine(line: string, id: string, category: string): Task {
  const cleanLine = line.replace(/^[-*•]\s+|^\d+\.\s+|^[√✓☐☑]\s+/, '').trim();
  
  // Extract deadline
  const deadlineMatch = line.match(/\b(?:by|due|before|until)\s+([a-zA-Z]+\s+\d+|\d+\/\d+|\d+-\d+-\d+)/i);
  const deadline = deadlineMatch ? deadlineMatch[1] : undefined;
  
  // Determine priority based on keywords
  const priority = determinePriority(line);
  
  // Split title and description
  const sentences = cleanLine.split('.').filter(s => s.trim());
  const title = sentences[0]?.trim() || cleanLine;
  const description = sentences.length > 1 ? sentences.slice(1).join('.').trim() : undefined;

  return {
    id,
    title,
    description: description || undefined,
    priority,
    completed: false,
    category,
    deadline,
    createdAt: new Date()
  };
}

function determinePriority(line: string): Priority {
  const highKeywords = ['urgent', 'asap', 'critical', 'important', 'priority', 'immediately', 'emergency'];
  const mediumKeywords = ['soon', 'review', 'check', 'update', 'prepare'];
  
  const lowerLine = line.toLowerCase();
  
  if (highKeywords.some(keyword => lowerLine.includes(keyword))) {
    return 'high';
  } else if (mediumKeywords.some(keyword => lowerLine.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

function createFallbackTasks(content: string): Task[] {
  // Create intelligent fallback tasks when no explicit tasks are found
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const tasks: Task[] = [];
  
  sentences.slice(0, 5).forEach((sentence, index) => {
    if (sentence.trim()) {
      tasks.push({
        id: (index + 1).toString(),
        title: `Review: ${sentence.trim().substring(0, 60)}${sentence.length > 60 ? '...' : ''}`,
        description: sentence.trim(),
        priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low',
        completed: false,
        category: 'Document Review',
        createdAt: new Date()
      });
    }
  });
  
  return tasks;
}

function calculateEstimatedTime(taskCount: number): string {
  const minutesPerTask = 15;
  const totalMinutes = taskCount * minutesPerTask;
  
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
  }
}

function generateSummary(groups: TaskGroup[]): string {
  const totalTasks = groups.reduce((sum, group) => sum + group.tasks.length, 0);
  const categories = groups.length;
  
  return `Found ${totalTasks} tasks across ${categories} categories. Tasks have been automatically prioritized based on content analysis.`;
}