import axios from 'axios';
import { AnalysisResult, TaskGroup, TaskItem } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration (Loaded from Environment Variables) ---
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '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';
console.log("[AI Analysis] Attempting to load GROQ API Key from environment...");
if (GROQ_API_KEY && GROQ_API_KEY !== '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') {
  console.log("[AI Analysis] GROQ API Key loaded successfully (prefix: " + GROQ_API_KEY.substring(0, 5) + "...).");
} else {
  console.error("[AI Analysis] WARNING: GROQ API Key not found or using default placeholder. API calls will likely fail with 401.");
}

const GROQ_API_URL = import.meta.env.VITE_GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

// --- AI Analysis Configuration ---
const AI_CONFIG = {
  MIN_TASKS_IF_EMPTY: 1,
  FALLBACK_TASK_CONTENT: "Document analysis complete. Review the summary and consider creating tasks manually if needed.",
  FALLBACK_TASK_PRIORITY: "medium" as const,
  ALWAYS_GENERATE_SUMMARY: true,

  GROQ_MODEL: import.meta.env.VITE_GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',

  GROQ_TEMPERATURE_TASKS: parseFloat(import.meta.env.VITE_GROQ_TEMPERATURE_TASKS ?? '0.3'),
  GROQ_TEMPERATURE_CATEGORIZE: parseFloat(import.meta.env.VITE_GROQ_TEMPERATURE_CATEGORIZE ?? '0.2'),
  GROQ_TEMPERATURE_SUMMARY: parseFloat(import.meta.env.VITE_GROQ_TEMPERATURE_SUMMARY ?? '0.2'),

  GROQ_MAX_TOKENS: parseInt(import.meta.env.VITE_GROQ_MAX_TOKENS ?? '8192', 10),
  GROQ_TIMEOUT_MS: parseInt(import.meta.env.VITE_GROQ_TIMEOUT_MS ?? '90000', 10),
  GROQ_MAX_RETRIES: parseInt(import.meta.env.VITE_GROQ_MAX_RETRIES ?? '4', 10),

  CHUNK_SIZE: parseInt(import.meta.env.VITE_AI_CHUNK_SIZE ?? '12000', 10),
  MAX_TEXT_LENGTH: 360_000,
  MAX_CHUNKS: 30,
  THROTTLE_DELAY_MS: 300,
};

// --- Type Definitions ---
interface GroqApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string; // This is the important part to validate
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIPrompt {
  system: string;
  user: string;
}

interface AIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// --- Helper Functions ---

const extractJSON = (content: string): string => {
  let cleaned = content.trim();
  const prefixes = [
    'Here is the extracted task list in JSON format:',
    'Here is the JSON response:',
    'Here is the categorization:',
    'Here is the summary:',
    'The JSON response is:',
    'Here\'s the JSON:',
    'JSON:',
    'Response:',
    'Output:',
    'Result:'
  ];
  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.substring(prefix.length).trim();
    }
  }
  if (cleaned.startsWith('```json\n')) {
    cleaned = cleaned.substring(8);
  } else if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(6);
  } else if (cleaned.startsWith('```\n')) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('\n```')) {
    cleaned = cleaned.slice(0, -4);
  } else if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  return cleaned;
};

const safeJSONParse = (content: string, context: string = 'unknown'): any => {
  try {
    const cleanedJSON = extractJSON(content);
    console.log(`[AI Analysis] Attempting to parse JSON for ${context}:`, cleanedJSON.substring(0, 100) + '...');
    return JSON.parse(cleanedJSON);
  } catch (error) {
    console.error(`[AI Analysis] JSON Parse Error in ${context}:`, error);
    console.error(`[AI Analysis] Raw content (first 300 chars):`, content.substring(0, 300));
    console.error(`[AI Analysis] Cleaned content (first 300 chars):`, extractJSON(content).substring(0, 300));
    return null; // Return null on parse failure, don't throw
  }
};

const preprocessContent = (content: string): { processedContent: string; documentType: string } => {
  if (!content || typeof content !== 'string') {
    return { processedContent: '', documentType: 'unknown' };
  }
  let processed = content;
  let documentType = 'general_document';

  processed = processed.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  processed = processed.replace(/[ \t]+/g, ' ');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  const lowerContent = processed.toLowerCase();
  if (lowerContent.includes('meeting minutes') || lowerContent.includes('action items') || lowerContent.includes('attendees:')) {
    documentType = 'meeting_minutes';
  } else if (lowerContent.includes('project plan') || lowerContent.includes('milestone') || lowerContent.includes('deliverable')) {
    documentType = 'project_plan';
  } else if (lowerContent.includes('contract') || lowerContent.includes('agreement') || lowerContent.includes('terms and conditions')) {
    documentType = 'contract';
  } else if (lowerContent.includes('email') || lowerContent.match(/^from:/gm) || lowerContent.match(/^to:/gm) || lowerContent.match(/^subject:/gm)) {
    documentType = 'email';
  } else if (lowerContent.includes('invoice') || lowerContent.includes('bill') || lowerContent.includes('payment due')) {
    documentType = 'invoice';
  } else if (lowerContent.includes('resume') || lowerContent.includes('curriculum vitae') || lowerContent.includes('work experience')) {
    documentType = 'resume';
  } else if (lowerContent.includes('research') || lowerContent.includes('paper') || lowerContent.includes('abstract')) {
    documentType = 'research_paper';
  } else if (lowerContent.includes('manual') || lowerContent.includes('user guide') || lowerContent.includes('instructions')) {
    documentType = 'manual';
  }

  switch (documentType) {
    case 'email':
      processed = processed.replace(/^(from|to|subject|date|sent|cc|bcc):.*$/gim, '').replace(/^-- .*$/gm, '').replace(/^________________________________.*$/gm, '');
      break;
    case 'meeting_minutes':
      processed = processed.replace(/^attendees:.*$/gim, '').replace(/^date:.*$/gim, '').replace(/^time:.*$/gim, '');
      break;
    case 'invoice':
      processed = processed.replace(/^invoice #.*$/gim, '').replace(/^due date:.*$/gim, '').replace(/^total:.*$/gim, '');
      break;
    case 'contract':
      processed = processed.replace(/^this agreement.*$/gim, '').replace(/^parties:.*$/gim, '');
      break;
  }
  processed = processed.replace(/^page \d+ of \d+$/gim, '').replace(/^\d+\/\d+$/gm, '').replace(/^confidential.*$/gim, '').replace(/^draft.*$/gim, '').trim();

  return { processedContent: processed, documentType };
};

const chunkContent = (content: string, maxChunkSize: number = AI_CONFIG.CHUNK_SIZE): string[] => {
  if (content.length <= maxChunkSize) {
    return [content];
  }
  const chunks: string[] = [];
  let currentPosition = 0;
  while (currentPosition < content.length) {
    let endPosition = Math.min(currentPosition + maxChunkSize, content.length);
    const searchStart = Math.max(currentPosition, endPosition - 1000);
    let breakPoint = content.lastIndexOf('\n\n', endPosition);
    if (breakPoint <= searchStart || breakPoint <= currentPosition) {
      breakPoint = content.lastIndexOf('\n', endPosition);
    }
    if (breakPoint <= searchStart || breakPoint <= currentPosition) {
      breakPoint = content.lastIndexOf('. ', endPosition);
      if (breakPoint !== -1) breakPoint += 1;
    }
    if (breakPoint > searchStart && breakPoint > currentPosition) {
      endPosition = breakPoint;
    }
    chunks.push(content.substring(currentPosition, endPosition).trim());
    currentPosition = endPosition;
    while (currentPosition < content.length && /\s/.test(content[currentPosition])) {
      currentPosition++;
    }
  }
  return chunks;
};

const performAIAnalysis = async (prompt: AIPrompt, retries: number = AI_CONFIG.GROQ_MAX_RETRIES, temperature: number = 0.1): Promise<AIResponse> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`,
  };
  const data = {
    model: AI_CONFIG.GROQ_MODEL,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    temperature: temperature,
    max_tokens: AI_CONFIG.GROQ_MAX_TOKENS,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  let lastError: any = null;
  let baseDelay = 1000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI Analysis] Groq API call attempt ${attempt}/${retries} (Model: ${AI_CONFIG.GROQ_MODEL}, Temp: ${temperature})`);
      const response = await axios.post<GroqApiResponse>(GROQ_API_URL, data, {
        headers,
        timeout: AI_CONFIG.GROQ_TIMEOUT_MS,
      });

      if (response.data &&
          Array.isArray(response.data.choices) &&
          response.data.choices.length > 0 &&
          response.data.choices[0].message &&
          typeof response.data.choices[0].message.content === 'string' &&
          response.data.choices[0].message.content.trim() !== '') {

        console.log(`[AI Analysis] Groq API call successful on attempt ${attempt}`);
        return {
          content: response.data.choices[0].message.content.trim(),
          usage: response.data.usage,
        };
      } else {
        console.warn("[AI Analysis] Received unexpected or empty response structure from Groq API:", JSON.stringify(response.data, null, 2));
        throw new Error('Invalid or empty response structure from Groq API');
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[AI Analysis] Groq API attempt ${attempt} failed:`, error.message);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error("[AI Analysis] Request timeout.");
        } else if (error.response) {
          console.error("[AI Analysis] HTTP Error Response:", error.response.status, error.response.data?.error?.message || 'No details');
          if (error.response.status === 429) {
            const retryAfterHeader = error.response.headers['retry-after'];
            const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
            baseDelay = Math.max(baseDelay, (isNaN(retryAfter) ? 5 : retryAfter) * 1000);
            console.log(`[AI Analysis] Rate limited. Base delay set to ${baseDelay}ms.`);
          }
        } else if (error.request) {
          console.error("[AI Analysis] No response received:", error.request);
        }
      }
      if (axios.isAxiosError(error) && error.response && error.response.status >= 400 && error.response.status < 500) {
         console.error(`[AI Analysis] Client error (${error.response.status}), not retrying.`);
         break;
      }
      if (attempt < retries) {
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, 30000);
        console.log(`[AI Analysis] Retrying in ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('[AI Analysis] All Groq API attempts failed:', lastError);
  throw new Error(`Failed to analyze document with AI after ${retries} attempts: ${lastError?.message || 'Unknown error'}`);
};

const createTaskExtractionPrompt = (documentType: string, content: string, isFirstChunk: boolean): AIPrompt => {
  const baseSystemPrompt = `
You are an expert AI tasked with extracting actionable items, key points, or takeaways.
CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON. NO markdown code blocks, NO explanations, NO extra text.
2. Exact JSON Structure (Adhere Strictly):
{
  "tasks": [
    {
      "content": "Clear and concise description of the task or key point.",
      "priority": "critical|high|medium|low|none",
      "estimatedTime": 15,
      "deadline": "optional string (e.g., YYYY-MM-DD)"
    }
  ]
}
3. IF NO ITEMS can be extracted, return: {"tasks": []}
`;

  let documentSpecificInstructions = "\nDOCUMENT TYPE CONTEXT:\n";
  switch (documentType) {
    case 'meeting_minutes':
      documentSpecificInstructions += `- Extract explicit "Action Items".\n- Identify decisions that require follow-up.\n- Capture questions that need answering.`;
      break;
    case 'project_plan':
      documentSpecificInstructions += `- Extract milestones, deliverables, and major phases.\n- Note key deadlines.`;
      break;
    default:
      documentSpecificInstructions += `- Extract any explicit action items.\n- Identify goals or objectives.\n- Capture questions or requirements.`;
  }

  const chunkInstruction = isFirstChunk
    ? "This is the first chunk of the document."
    : "This is a subsequent chunk of the document.";

  return {
    system: `${baseSystemPrompt}${documentSpecificInstructions}`,
    user: `${chunkInstruction}\nDocument content:\n---\n${content}\n---\nExtract items as instructed. Return valid JSON only:`,
  };
};

const createCategorizationPrompt = (tasksForCategorization: string): AIPrompt => {
  return {
    system: `You are a task categorization expert. Group tasks into logical categories.
CRITICAL INSTRUCTIONS:
1. Create 2-6 distinct categories.
2. Return ONLY valid JSON - NO markdown, NO explanations.
3. Use this EXACT structure:
{
  "categories": [
    {
      "id": "unique-category-id",
      "name": "Category Name",
      "taskIds": ["task-1", "task-2"]
    }
  ]
}
4. Assign EVERY task to exactly one category.
5. IF categorization is impossible, return: {"categories": []}`,
    user: `Categorize these tasks:\n---\n${tasksForCategorization}\n---\nReturn JSON only:`,
  };
};

const createSummaryPrompt = (tasksForSummary: string): AIPrompt => {
  return {
    system: `You are a project management expert. Create a concise summary.
CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - NO markdown, NO explanations.
2. Use this EXACT structure:
{
  "projectDescription": "A 1-2 sentence summary of the main goal.",
  "milestones": ["Key milestone or major task"],
  "resources": ["Resource mentioned or needed"]
}
3. If information for a field is not available, provide an empty array [].
4. IF no summary can be generated, return: {"projectDescription": "No summary available.", "milestones": [], "resources": []}`,
    user: `Summarize these tasks:\n---\n${tasksForSummary}\n---\nReturn JSON only:`,
  };
};

const deduplicateTasks = (tasks: any[]): any[] => {
  const uniqueTasks: any[] = [];
  const seenContents = new Set<string>();

  for (const task of tasks) {
    const normalizedContent = task.content.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    if (!seenContents.has(normalizedContent)) {
      seenContents.add(normalizedContent);
      uniqueTasks.push(task);
    }
  }
  return uniqueTasks;
};

function createFallbackAnalysisResult(reason: string): AnalysisResult {
     const now = new Date().toISOString();
     const analysisId = uuidv4();
     return {
        analysisId: analysisId,
        totalTasks: 1,
        groups: [
          {
            id: 'analysis-outcome',
            name: 'Analysis Outcome',
            expanded: true,
            tasks: [
                {
                    id: 'fallback-task-1',
                    content: AI_CONFIG.FALLBACK_TASK_CONTENT,
                    priority: AI_CONFIG.FALLBACK_TASK_PRIORITY,
                    estimatedTime: 0,
                    completed: false,
                    createdAt: now,
                    updatedAt: now,
                    deadline: null,
                    groupId: 'analysis-outcome'
                }
            ],
          }
        ],
        summary: {
          projectDescription: reason,
          milestones: [],
          resources: [],
        },
      };
}

export const analyzeDocument = async (content: string): Promise<AnalysisResult> => {
  console.log(`[AI Analysis] Starting analysis...`);
  console.log(`[AI Analysis] Raw content length: ${content.length} characters`);

  try {
    const { processedContent, documentType } = preprocessContent(content);
    console.log(`[AI Analysis] Preprocessed content length: ${processedContent.length} characters`);
    console.log(`[AI Analysis] Detected document type: ${documentType}`);

    if (!processedContent || processedContent.trim().length < 10) {
      console.warn("[AI Analysis] Content is empty or too short for meaningful analysis.");
      return createFallbackAnalysisResult("No readable content found in the document.");
    }

    const contentChunks = chunkContent(processedContent, AI_CONFIG.CHUNK_SIZE);
    console.log(`[AI Analysis] Split content into ${contentChunks.length} chunks for processing`);
    let allTasks: any[] = [];
    let totalTokensUsed = 0;

    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i];
      console.log(`[AI Analysis] Processing chunk ${i + 1}/${contentChunks.length} (${chunk.length} characters)`);
      const taskExtractionPrompt = createTaskExtractionPrompt(documentType, chunk, i === 0);
      console.log('[AI Analysis] Sending task extraction request...');
      
      let taskData: any = null;
      try {
          const taskResponse = await performAIAnalysis(taskExtractionPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_TASKS);
          console.log('[AI Analysis] Task extraction response received.');
          totalTokensUsed += taskResponse.usage?.total_tokens || 0;
          taskData = safeJSONParse(taskResponse.content, 'task extraction');
      } catch (aiCallError: any) {
          console.error('[AI Analysis] Error during task extraction AI call or parsing for chunk:', aiCallError);
          taskData = { tasks: [] };
      }

      if (!taskData || !Array.isArray(taskData.tasks)) {
         console.warn('[AI Analysis] Invalid or missing task data structure received for chunk. Treating as empty list.');
         taskData = { tasks: [] };
      }

      allTasks = [...allTasks, ...taskData.tasks];
    }

    console.log(`[AI Analysis] Extracted ${allTasks.length} raw tasks from all chunks.`);

    const uniqueTasks = deduplicateTasks(allTasks);
    console.log(`[AI Analysis] After deduplication: ${uniqueTasks.length} unique tasks.`);

    let finalTasks = uniqueTasks;
    let groups: TaskGroup[] = [];
    let summaryData: any = null;
    const now = new Date().toISOString();

    if (finalTasks.length < AI_CONFIG.MIN_TASKS_IF_EMPTY) {
      console.log(`[AI Analysis] Found ${finalTasks.length} tasks, below minimum threshold. Generating fallback.`);
      finalTasks = [{
        id: 'fallback-task-1',
        content: AI_CONFIG.FALLBACK_TASK_CONTENT,
        priority: AI_CONFIG.FALLBACK_TASK_PRIORITY,
        estimatedTime: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
        deadline: null,
      }];
    }

    try {
        const tasksWithIds = finalTasks.map((task: any, index: number) => ({
            ...task,
            id: task.id || `task-${index + 1}`,
            completed: task.completed ?? false,
            createdAt: task.createdAt || now,
            updatedAt: task.updatedAt || now,
            deadline: task.deadline || null,
        }));

        const tasksForCategorization = tasksWithIds.map(t => `${t.id}: ${t.content.substring(0, 200)}...`).join('\n');
        const categorizationPrompt = createCategorizationPrompt(tasksForCategorization);
        console.log('[AI Analysis] Sending categorization request...');
        const categoryResponse = await performAIAnalysis(categorizationPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_CATEGORIZE);
        console.log('[AI Analysis] Categorization response received.');
        totalTokensUsed += categoryResponse.usage?.total_tokens || 0;
        const categoryData = safeJSONParse(categoryResponse.content, 'categorization');

        if (categoryData && Array.isArray(categoryData.categories) && categoryData.categories.length > 0) {
            groups = categoryData.categories.map((cat: any, index: number) => {
                const groupId = cat.id || `group-${index + 1}`;
                return {
                    id: groupId,
                    name: cat.name,
                    expanded: true,
                    tasks: tasksWithIds
                        .filter((task: TaskItem) => (cat.taskIds || []).includes(task.id))
                        .map((task: TaskItem) => ({ ...task, groupId })),
                };
            });
            const assignedTaskIds = new Set(groups.flatMap(g => g.tasks.map(t => t.id)));
            const unassignedTasks = tasksWithIds
                .filter((task: TaskItem) => !assignedTaskIds.has(task.id))
                .map((task: TaskItem) => ({ ...task, groupId: 'unassigned' }));

            if (unassignedTasks.length > 0) {
                groups.push({
                    id: 'unassigned',
                    name: 'Uncategorized Tasks',
                    expanded: true,
                    tasks: unassignedTasks,
                });
            }
        } else {
            const groupId = 'default-group';
            groups = [{ id: groupId, name: 'Analysis Results', expanded: true, tasks: tasksWithIds.map((task: TaskItem) => ({ ...task, groupId })) }];
        }
    } catch (catError: any) {
        console.error('[AI Analysis] Error during categorization:', catError);
        const groupId = 'default-group';
        const tasksWithIds = finalTasks.map((task: any, index: number) => ({ ...task, id: task.id || `task-${index + 1}`, groupId }));
        groups = [{ id: groupId, name: 'Analysis Results', expanded: true, tasks: tasksWithIds }];
    }

    try {
        const tasksForSummary = finalTasks.map((task: any) => `- ${task.content.substring(0, 150)}...`).join('\n');
        const summaryPrompt = createSummaryPrompt(tasksForSummary);
        console.log('[AI Analysis] Sending summary request...');
        const summaryResponse = await performAIAnalysis(summaryPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_SUMMARY);
        console.log('[AI Analysis] Summary response received.');
        totalTokensUsed += summaryResponse.usage?.total_tokens || 0;
        summaryData = safeJSONParse(summaryResponse.content, 'summary');
        if (!summaryData) {
            throw new Error("Summary parsing failed.");
        }
    } catch (sumError: any) {
        console.error('[AI Analysis] Error during summary generation:', sumError);
        summaryData = {
          projectDescription: "Analysis completed. Review the extracted items.",
          milestones: [],
          resources: [],
        };
    }

    console.log('[AI Analysis] Assembling final result...');
    console.log(`[AI Analysis] Analysis completed successfully.`);

    return {
      analysisId: uuidv4(),
      totalTasks: finalTasks.length,
      groups: groups,
      summary: summaryData,
    };

  } catch (error: any) {
    console.error('[AI Analysis] Fatal Error:', error);
    return createFallbackAnalysisResult(`Analysis failed: ${error.message || 'Unknown error'}`);
  }
};