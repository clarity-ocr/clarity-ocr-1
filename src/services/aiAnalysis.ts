// src/services/aiAnalysis.ts
import axios from 'axios';
import { AnalysisResult, TaskGroup, TaskItem } from '@/types/task';

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
  FALLBACK_TASK_STATUS: "todo" as const,
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

      // --- STRONGER VALIDATION ---
      // Check if response structure is valid and content is present
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
        // Log the problematic response for debugging
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
  // --- IMPROVED PROMPT INSTRUCTIONS ---
  const baseSystemPrompt = `
You are an expert AI tasked with extracting ANY form of actionable item, point of interest, or key takeaway from a document. The user needs *something* to work with.

CRITICAL INSTRUCTIONS FOR TASK EXTRACTION:
1. **Broad Definition of "Item":** Anything that could be an action item, a question, a goal, a requirement, a decision point, a follow-up, a reminder, a significant piece of information, or a summary point counts.
2. **Be Proactive:** If the document seems informational, extract key facts or summaries as potential items. If it's a conversation, extract implied actions or questions.
3. **Prioritize Completeness:** It's better to extract a slightly vague item than to miss a potential action or key point.
4. **Specificity is Preferred:** If you can make an item more specific or actionable, do so.
5. **Return ONLY valid JSON:** NO markdown code blocks, NO explanations, NO extra text outside the JSON.
6. **Exact JSON Structure (Adhere Strictly):**
{
  "tasks": [
    {
      "content": "Clear and concise description of the task/action/item/takeaway",
      "priority": "critical|high|medium|low|none",
      "status": "todo|in-progress|review|done|cancelled|on-hold|backlog",
      "estimatedTime": 15,
      "deadline": "optional string (e.g., YYYY-MM-DD, 'end of week', 'TBD')",
      "assignee": "optional string (e.g., person, team, 'TBD')",
      "tags": ["context", "document-type"],
      "dependencies": [],
      "subtasks": [
        {
          "content": "Subtask description",
          "priority": "high|medium|low",
          "status": "todo|in-progress|review|done|cancelled|on-hold|backlog",
          "estimatedTime": 10,
          "tags": ["subtask-tag"]
        }
      ]
    }
  ]
}
7. **IF ABSOLUTELY NO ITEMS can be extracted OR the document is empty, return this EXACT JSON:** {"tasks": []}
8. DO NOT wrap the JSON in backticks or markdown.
9. DO NOT add any text before or after the JSON object.
`;

  let documentSpecificInstructions = "\nDOCUMENT TYPE CONTEXT:\n";
  switch (documentType) {
    case 'meeting_minutes':
      documentSpecificInstructions += `
- Extract explicit "Action Items" assigned to individuals.
- Identify decisions made that require follow-up.
- Capture questions raised that need answering.
- Summarize key discussion points as informational tasks if no explicit actions.
- Look for deadlines or due dates associated with actions.
`;
      break;
    case 'project_plan':
      documentSpecificInstructions += `
- Extract milestones, deliverables, and major phases.
- Identify resource assignments and timelines.
- Capture dependencies between tasks.
- Note risks or assumptions listed.
- Extract budget or scope-related items.
`;
      break;
    case 'email':
      documentSpecificInstructions += `
- Extract direct requests made by the sender.
- Identify questions posed that need responses.
- Capture commitments or promises made.
- Note deadlines or due dates mentioned.
- Summarize the email's main purpose/request if no specific action item is clear.
- Look for CC'd individuals who might be involved.
`;
      break;
    case 'contract':
      documentSpecificInstructions += `
- Extract key obligations or responsibilities for each party.
- Note important dates (e.g., start date, end date, review dates).
- Capture payment terms or conditions.
- Identify clauses requiring action or compliance.
- Extract penalties or consequences mentioned.
`;
      break;
    case 'invoice':
      documentSpecificInstructions += `
- Extract payment due date and amount.
- Note payment method or instructions.
- Capture any terms or conditions related to the invoice.
- Identify the payee and payer.
- Note any late fees or discounts.
`;
      break;
    case 'resume':
      documentSpecificInstructions += `
- Extract key skills, experiences, or qualifications mentioned.
- Note contact information.
- Identify the candidate's objective or summary (as an informational item).
- Extract relevant work history or education details.
`;
      break;
    case 'research_paper':
      documentSpecificInstructions += `
- Extract research questions or hypotheses.
- Note key findings or conclusions.
- Capture methodology steps (if relevant as tasks).
- Identify future work or recommendations.
- Extract data sources or references mentioned.
`;
      break;
    case 'manual':
      documentSpecificInstructions += `
- Extract setup steps or procedures.
- Note safety warnings or important guidelines.
- Capture troubleshooting steps.
- Identify sections that require user action.
- Extract configuration options or parameters.
`;
      break;
    default:
      documentSpecificInstructions += `
- Extract any explicit action items.
- Identify goals or objectives stated.
- Capture questions, requirements, or decisions.
- Summarize key points or takeaways as informational tasks if no clear actions.
- Look for action verbs (e.g., review, submit, contact, implement, analyze).
- If the document is purely informational, extract the main points or a summary as a task.
`;
  }

  const chunkInstruction = isFirstChunk
    ? "This is the first chunk of the document."
    : "This is a subsequent chunk of the document.";

  return {
    system: `${baseSystemPrompt}${documentSpecificInstructions}`,
    user: `${chunkInstruction}
Document content:
---
${content}
---
Extract tasks/questions/points as instructed. Return valid JSON only:`,
  };
};

const createCategorizationPrompt = (tasksForCategorization: string): AIPrompt => {
  return {
    system: `You are a task categorization expert. Group tasks into logical categories.
CRITICAL INSTRUCTIONS:
1. Create 2-6 distinct and meaningful categories based on the tasks' content.
2. Return ONLY valid JSON - NO markdown, NO explanations
3. Use this EXACT structure:
{
  "categories": [
    {
      "id": "unique-category-id",
      "name": "Category Name",
      "description": "Brief description of the category's focus",
      "taskIds": ["task-1", "task-2"]
    }
  ]
}
4. Assign EVERY task to exactly one category. If a task is ambiguous, place it in the most relevant category or create a "General" category.
5. Ensure task IDs in 'taskIds' match the IDs provided in the task list.
6. IF categorization is impossible or no tasks exist, return: {"categories": []}
7. DO NOT wrap in markdown code blocks`,
    user: `Categorize these tasks:
---
${tasksForCategorization}
---
Return JSON only:`,
  };
};

const createSummaryPrompt = (tasksForSummary: string): AIPrompt => {
  return {
    system: `You are a project management expert. Create a concise summary of the tasks and document content.
CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - NO markdown, NO explanations
2. Use this EXACT structure:
{
  "projectDescription": "A 1-2 sentence summary of the main topic or goal of the document/tasks.",
  "milestones": ["Key milestone or major task", "Another significant point"],
  "resources": ["Resource mentioned or needed", "Team involved"],
  "risks": ["Potential issue or dependency noted", "Uncertainty"],
  "recommendations": ["Suggestion for next steps", "Item to consider"]
}
3. If information for a field is not available, provide an empty array [].
4. Base the summary primarily on the tasks provided, but you can infer from their content.
5. IF no meaningful summary can be generated, return: {"projectDescription": "No summary available.", "milestones": [], "resources": [], "risks": [], "recommendations": []}
6. DO NOT wrap in markdown code blocks`,
    user: `Summarize these tasks and infer from their content:
---
${tasksForSummary}
---
Return JSON only:`,
  };
};

const deduplicateTasks = (tasks: any[]): any[] => {
  const uniqueTasks: any[] = [];
  const seenContents = new Set<string>();

  for (const task of tasks) {
    const normalizedContent = task.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const existingTaskIndex = uniqueTasks.findIndex(t =>
      t.content.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim() === normalizedContent
    );

    if (existingTaskIndex === -1) {
      seenContents.add(normalizedContent);
      uniqueTasks.push(task);
    } else {
      const existingTask = uniqueTasks[existingTaskIndex];
      const mergedTags = [...new Set([...(existingTask.tags || []), ...(task.tags || [])])];
      const mergedDependencies = [...new Set([...(existingTask.dependencies || []), ...(task.dependencies || [])])];
      let mergedPriority = existingTask.priority;
      if (task.priority === 'critical' || (task.priority === 'high' && existingTask.priority !== 'critical') ||
          (task.priority === 'medium' && ['low', 'none'].includes(existingTask.priority))) {
        mergedPriority = task.priority;
      }
      const mergedTime = Math.max(existingTask.estimatedTime || 0, task.estimatedTime || 0);
      const mergedSubtasks = [...(existingTask.subtasks || []), ...(task.subtasks || [])];

      uniqueTasks[existingTaskIndex] = {
        ...existingTask,
        ...task,
        tags: mergedTags,
        dependencies: mergedDependencies,
        priority: mergedPriority,
        estimatedTime: mergedTime,
        subtasks: mergedSubtasks
      };
    }
  }
  return uniqueTasks;
};

function createFallbackAnalysisResult(fileName: string, reason: string, startTime: number, errorMessage?: string): AnalysisResult {
     const processingTime = Date.now() - startTime;
     return {
        totalTasks: 1,
        groups: [
          {
            id: 'analysis-outcome',
            name: 'Analysis Outcome',
            description: reason,
            tasks: [
                {
                    id: 'fallback-task-1',
                    content: AI_CONFIG.FALLBACK_TASK_CONTENT,
                    priority: AI_CONFIG.FALLBACK_TASK_PRIORITY,
                    status: AI_CONFIG.FALLBACK_TASK_STATUS,
                    estimatedTime: 0,
                    tags: ['analysis', 'fallback'],
                    dependencies: [],
                    subtasks: [],
                    completed: false,
                    createdAt: new Date().toISOString(),
                    chunkId: -1
                }
            ],
          }
        ],
        summary: {
          projectDescription: reason,
          milestones: [],
          resources: [],
          risks: [],
          recommendations: [errorMessage ? `Error details: ${errorMessage.substring(0, 100)}...` : "Please check the document or try again."],
        },
        fileName: fileName,
        processedAt: new Date().toISOString(),
        processingStats: {
          tokensUsed: 0,
          processingTime: processingTime,
        },
        analysisOutcome: errorMessage ? 'failure' : 'no_tasks_found',
        outcomeMessage: reason
      };
}

export const analyzeDocument = async (content: string, fileName?: string): Promise<AnalysisResult> => {
  const startTime = Date.now();
  console.log(`[AI Analysis] Starting analysis for file: ${fileName || 'Pasted Text'}`);
  console.log(`[AI Analysis] Raw content length: ${content.length} characters`);

  try {
    const { processedContent, documentType } = preprocessContent(content);
    console.log(`[AI Analysis] Preprocessed content length: ${processedContent.length} characters`);
    console.log(`[AI Analysis] Detected document type: ${documentType}`);

    if (!processedContent || processedContent.trim().length < 10) {
      console.warn("[AI Analysis] Content is empty or too short for meaningful analysis.");
      return createFallbackAnalysisResult(fileName || 'Untitled Document', "No readable content found in the document.", startTime);
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

      // --- WRAP AI CALL IN TRY/CATCH TO ENSURE FALLBACK ---
      let taskData: any = null;
      try {
          const taskResponse = await performAIAnalysis(taskExtractionPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_TASKS);
          console.log('[AI Analysis] Task extraction response received.');
          totalTokensUsed += taskResponse.usage?.total_tokens || 0;
          taskData = safeJSONParse(taskResponse.content, 'task extraction');
      } catch (aiCallError: any) {
          console.error('[AI Analysis] Error during task extraction AI call or parsing for chunk:', aiCallError);
          // taskData remains null, will be handled below
      }

      // --- ROBUST VALIDATION AND HANDLING ---
      // Check if taskData is valid and has tasks array
      if (!taskData || !Array.isArray(taskData.tasks)) {
         console.warn('[AI Analysis] Invalid or missing task data structure received for chunk. Treating as empty list for this chunk.');
         // Don't throw, just continue with empty tasks for this chunk
         taskData = { tasks: [] }; // Ensure a valid structure with empty tasks
      }

      const tasksWithChunkId = taskData.tasks.map((task: any) => ({
        ...task,
        chunkId: i,
      }));
      allTasks = [...allTasks, ...tasksWithChunkId];
    }

    console.log(`[AI Analysis] Extracted ${allTasks.length} raw tasks from all chunks.`);

    const uniqueTasks = deduplicateTasks(allTasks);
    console.log(`[AI Analysis] After deduplication: ${uniqueTasks.length} unique tasks.`);

    let finalTasks = uniqueTasks;
    let groups: TaskGroup[] = [];
    let summaryData: any = null;

    // --- GUARANTEE OUTPUT: Handle Case Where No Tasks Are Found ---
    if (finalTasks.length < AI_CONFIG.MIN_TASKS_IF_EMPTY) {
      console.log(`[AI Analysis] Found ${finalTasks.length} tasks, below minimum threshold (${AI_CONFIG.MIN_TASKS_IF_EMPTY}). Generating fallback.`);
      finalTasks = [{
        id: 'fallback-task-1',
        content: AI_CONFIG.FALLBACK_TASK_CONTENT,
        priority: AI_CONFIG.FALLBACK_TASK_PRIORITY,
        status: AI_CONFIG.FALLBACK_TASK_STATUS,
        estimatedTime: 0,
        tags: ['analysis', 'fallback'],
        dependencies: [],
        subtasks: [],
        completed: false,
        createdAt: new Date().toISOString(),
        chunkId: -1
      }];
    }

    // --- Proceed with Categorization (Always if configured) ---
    try {
        const tasksForCategorization = finalTasks.map((task: any, index: number) => {
             const taskId = task.id || `task-${index + 1}`;
             return `${index + 1}. ${task.content.substring(0, 200)}... (ID: ${taskId})`;
        }).join('\n');

        const categorizationPrompt = createCategorizationPrompt(tasksForCategorization);
        console.log('[AI Analysis] Sending categorization request...');
        const categoryResponse = await performAIAnalysis(categorizationPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_CATEGORIZE);
        console.log('[AI Analysis] Categorization response received.');
        totalTokensUsed += categoryResponse.usage?.total_tokens || 0;
        const categoryData = safeJSONParse(categoryResponse.content, 'categorization');

        if (categoryData && Array.isArray(categoryData.categories) && categoryData.categories.length > 0) {
            const tasksWithIds = finalTasks.map((task: any, index: number) => ({
                ...task,
                id: task.id || `task-${index + 1}`,
                completed: task.completed ?? false,
                createdAt: task.createdAt || new Date().toISOString(),
                subtasks: task.subtasks ? task.subtasks.map((st: any, stIndex: number) => ({
                    ...st,
                    id: st.id || `${task.id || `task-${index + 1}`}-subtask-${stIndex + 1}`,
                    completed: st.completed || false,
                    createdAt: st.createdAt || new Date().toISOString(),
                })) : []
            }));

            groups = categoryData.categories.map((cat: any, index: number) => {
                const validTaskIds = cat.taskIds?.filter((id: string) =>
                    tasksWithIds.some((t: TaskItem) => t.id === id)
                ) || [];
                return {
                    id: cat.id || `group-${index + 1}`,
                    name: cat.name,
                    description: cat.description || '',
                    tasks: tasksWithIds.filter((task: TaskItem) => validTaskIds.includes(task.id)),
                };
            });

            const assignedTaskIds = new Set(groups.flatMap(group => group.tasks.map(task => task.id)));
            const unassignedTasks = tasksWithIds.filter((task: TaskItem) => !assignedTaskIds.has(task.id));
            if (unassignedTasks.length > 0) {
                groups.push({
                    id: 'unassigned',
                    name: 'Uncategorized Tasks',
                    description: 'Tasks that could not be categorized by the AI.',
                    tasks: unassignedTasks,
                });
                 console.log(`[AI Analysis] ${unassignedTasks.length} tasks were unassigned.`);
            }
        } else {
            console.warn('[AI Analysis] Invalid or empty category data. Placing tasks in a default group.');
             const tasksWithIds = finalTasks.map((task: any, index: number) => ({
                ...task,
                id: task.id || `task-${index + 1}`,
                completed: task.completed ?? false,
                createdAt: task.createdAt || new Date().toISOString(),
                subtasks: task.subtasks ? task.subtasks.map((st: any, stIndex: number) => ({
                    ...st,
                    id: st.id || `${task.id || `task-${index + 1}`}-subtask-${stIndex + 1}`,
                    completed: st.completed || false,
                    createdAt: st.createdAt || new Date().toISOString(),
                })) : []
            }));
            groups = [{
                id: 'default-group',
                name: 'Analysis Results',
                description: 'Tasks extracted or generated by the AI.',
                tasks: tasksWithIds
            }];
        }
    } catch (catError: any) {
        console.error('[AI Analysis] Error during categorization:', catError);
         const tasksWithIds = finalTasks.map((task: any, index: number) => ({
                ...task,
                id: task.id || `task-${index + 1}`,
                completed: task.completed ?? false,
                createdAt: task.createdAt || new Date().toISOString(),
                subtasks: task.subtasks ? task.subtasks.map((st: any, stIndex: number) => ({
                    ...st,
                    id: st.id || `${task.id || `task-${index + 1}`}-subtask-${stIndex + 1}`,
                    completed: st.completed || false,
                    createdAt: st.createdAt || new Date().toISOString(),
                })) : []
            }));
            groups = [{
                id: 'default-group',
                name: 'Analysis Results',
                description: 'Tasks extracted or generated by the AI. Categorization failed.',
                tasks: tasksWithIds
            }];
    }

    // --- Proceed with Summary (Always if configured) ---
    try {
        const tasksForSummary = finalTasks.map((task: any) => `- ${task.content.substring(0, 150)}...`).join('\n');
        const summaryPrompt = createSummaryPrompt(tasksForSummary);
        console.log('[AI Analysis] Sending summary request...');
        const summaryResponse = await performAIAnalysis(summaryPrompt, AI_CONFIG.GROQ_MAX_RETRIES, AI_CONFIG.GROQ_TEMPERATURE_SUMMARY);
        console.log('[AI Analysis] Summary response received.');
        totalTokensUsed += summaryResponse.usage?.total_tokens || 0;
        summaryData = safeJSONParse(summaryResponse.content, 'summary');

         if (!summaryData) {
             console.warn('[AI Analysis] Summary parsing failed, using empty structure.');
             summaryData = {
                projectDescription: "Summary generation failed or was inconclusive.",
                milestones: [],
                resources: [],
                risks: [],
                recommendations: ["Review the items listed."]
             };
        }
    } catch (sumError: any) {
        console.error('[AI Analysis] Error during summary generation:', sumError);
        summaryData = {
          projectDescription: "Analysis completed. Review the extracted items.",
          milestones: [],
          resources: [],
          risks: [],
          recommendations: ["Review the items listed and create specific tasks if needed."]
        };
    }

    console.log('[AI Analysis] Assembling final result...');
    const processingTime = Date.now() - startTime;
    console.log(`[AI Analysis] Analysis completed successfully in ${processingTime}ms.`);

    return {
      totalTasks: finalTasks.length,
      groups: groups,
      summary: summaryData,
      fileName: fileName || 'Untitled Document',
      processedAt: new Date().toISOString(),
      processingStats: {
        tokensUsed: totalTokensUsed,
        processingTime: processingTime,
      },
      analysisOutcome: 'success',
      outcomeMessage: 'Analysis completed successfully.'
    };

  } catch (error: any) {
    console.error('[AI Analysis] Fatal Error:', error);
    return createFallbackAnalysisResult(fileName || 'Untitled Document', `Analysis failed: ${error.message || 'Unknown error'}`, startTime, error.message || 'Unknown error');
  }
};
