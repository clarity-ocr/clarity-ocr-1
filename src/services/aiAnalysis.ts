// src/services/aiAnalysis.ts
import axios from 'axios';
import { AnalysisResult, TaskGroup, TaskItem } from '@/types/task';

const GROQ_API_KEY = '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'; // Ensure this key is correct and secure
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
      content: string;
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

/**
 * Preprocesses the raw document content to clean it and detect its type.
 * This helps tailor the AI prompts for better results.
 */
const preprocessContent = (content: string): { processedContent: string; documentType: string } => {
  if (!content || typeof content !== 'string') {
    return { processedContent: '', documentType: 'unknown' };
  }
  let processed = content;
  let documentType = 'general_document';

  // Remove problematic control characters (keep newlines, tabs, spaces)
  processed = processed.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');

  // Normalize different newline formats
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive whitespace while preserving paragraph breaks
  processed = processed.replace(/[ \t]+/g, ' ');
  processed = processed.replace(/\n{3,}/g, '\n\n');

  // Detect document type based on content patterns
  const lowerContent = processed.toLowerCase();
  if (
    lowerContent.includes('meeting minutes') ||
    lowerContent.includes('action items') ||
    lowerContent.includes('attendees:')
  ) {
    documentType = 'meeting_minutes';
  } else if (
    lowerContent.includes('project plan') ||
    lowerContent.includes('milestone') ||
    lowerContent.includes('deliverable')
  ) {
    documentType = 'project_plan';
  } else if (
    lowerContent.includes('contract') ||
    lowerContent.includes('agreement') ||
    lowerContent.includes('terms and conditions')
  ) {
    documentType = 'contract';
  } else if (
    lowerContent.includes('email') ||
    lowerContent.match(/^from:/gm) ||
    lowerContent.match(/^to:/gm)
  ) {
    documentType = 'email';
  } else if (
    lowerContent.includes('invoice') ||
    lowerContent.includes('bill') ||
    lowerContent.includes('payment due')
  ) {
    documentType = 'invoice';
  } else if (
    lowerContent.includes('resume') ||
    lowerContent.includes('curriculum vitae') ||
    lowerContent.includes('work experience')
  ) {
    documentType = 'resume';
  } else if (
    lowerContent.includes('research') ||
    lowerContent.includes('paper') ||
    lowerContent.includes('abstract')
  ) {
    documentType = 'research_paper';
  } else if (
    lowerContent.includes('manual') ||
    lowerContent.includes('user guide') ||
    lowerContent.includes('instructions')
  ) {
    documentType = 'manual';
  }

  // Document-specific preprocessing (optional cleanup)
  switch (documentType) {
    case 'email':
      // Remove email headers and signatures
      processed = processed.replace(/^(from|to|subject|date|sent|cc|bcc):.*$/gim, '');
      processed = processed.replace(/^-- .*$/gm, '');
      break;
    case 'meeting_minutes':
      // Remove attendee lists and meeting metadata
      processed = processed.replace(/^attendees:.*$/gim, '');
      processed = processed.replace(/^date:.*$/gim, '');
      processed = processed.replace(/^time:.*$/gim, '');
      break;
    case 'invoice':
      // Remove invoice headers and footers
      processed = processed.replace(/^invoice #.*$/gim, '');
      processed = processed.replace(/^due date:.*$/gim, '');
      processed = processed.replace(/^total:.*$/gim, '');
      break;
    case 'contract':
      // Remove contract boilerplate
      processed = processed.replace(/^this agreement.*$/gim, '');
      processed = processed.replace(/^parties:.*$/gim, '');
      break;
  }

  // Remove page numbers and common footers
  processed = processed.replace(/^page \d+ of \d+$/gim, '');
  processed = processed.replace(/^\d+\/\d+$/gm, '');
  processed = processed.replace(/^confidential.*$/gim, '');

  // Trim leading/trailing whitespace
  processed = processed.trim();

  return { processedContent: processed, documentType };
};

/**
 * Splits a large string into smaller chunks, trying to break at paragraph or sentence boundaries.
 */
const chunkContent = (content: string, maxChunkSize: number = 8000): string[] => {
  if (content.length <= maxChunkSize) {
    return [content];
  }
  const chunks: string[] = [];
  let currentPosition = 0;
  while (currentPosition < content.length) {
    let endPosition = Math.min(currentPosition + maxChunkSize, content.length);
    // Look for a paragraph break near the end of the chunk
    const searchStart = Math.max(currentPosition, endPosition - 1000);
    const paragraphBreak = content.lastIndexOf('\n\n', endPosition);
    if (paragraphBreak > searchStart) {
      endPosition = paragraphBreak;
    } else {
      // If no paragraph break, look for sentence break
      const sentenceBreak = content.lastIndexOf('. ', endPosition);
      if (sentenceBreak > searchStart) {
        endPosition = sentenceBreak + 1;
      }
    }
    chunks.push(content.substring(currentPosition, endPosition).trim());
    currentPosition = endPosition;
  }
  return chunks;
};

/**
 * Calls the Groq API with retry logic and exponential backoff.
 */
const performAIAnalysis = async (prompt: AIPrompt, retries: number = 3): Promise<AIResponse> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`,
  };

  // Use a powerful model with optimized parameters
  const data = {
    model: 'llama3-70b-8192', // Consider llama3-8b-8192 for faster responses if needed
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    temperature: 0.2, // Lower for consistency
    max_tokens: 4096,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };

  let lastError: any = null;
  let baseDelay = 1000; // Start with 1 second

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI Analysis] Groq API call attempt ${attempt}/${retries}`);
      const response = await axios.post<GroqApiResponse>(GROQ_API_URL, data, {
        headers,
        timeout: 60000, // Increased timeout for complex tasks
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log(`[AI Analysis] Groq API call successful on attempt ${attempt}`);
        return {
          content: response.data.choices[0].message.content.trim(),
          usage: response.data.usage,
        };
      } else {
        throw new Error('Invalid or empty response structure from Groq API');
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[AI Analysis] Groq API attempt ${attempt} failed:`, error.message);

      // Specific error handling
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          console.error("[AI Analysis] Request timeout.");
        } else if (error.response) {
          console.error("[AI Analysis] HTTP Error Response:", error.response.status, error.response.data);
          // Adaptive backoff for rate limiting
          if (error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'] || 5;
            baseDelay = Math.max(baseDelay, parseInt(retryAfter) * 1000);
          }
        } else if (error.request) {
          console.error("[AI Analysis] No response received:", error.request);
        }
      }

      if (attempt < retries) {
        // Exponential backoff with jitter
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

/**
 * Creates a prompt for extracting tasks, tailored to the document type.
 */
const createTaskExtractionPrompt = (documentType: string, content: string, isFirstChunk: boolean): AIPrompt => {
  const baseSystemPrompt = `You are an expert task extraction AI. Extract actionable tasks from documents.
    CRITICAL INSTRUCTIONS:
    1. Extract ALL specific, actionable items that represent work to be done.
    2. If the document is not a typical task list (e.g., a novel, email, report), do your best to identify implicit tasks, action items, or goals.
    3. For each task, determine:
       - Priority (high/medium/low) based on urgency or importance keywords.
       - Estimated completion time (minutes).
       - Deadline (if mentioned).
       - Assignee (if mentioned with @username).
       - Tags (words prefixed with #).
       - Dependencies (if mentioned).
       - Subtasks (if the main task can be broken down into smaller steps).
    4. Return ONLY a valid JSON object with this EXACT structure:
       {
         "tasks": [
           {
             "content": "string (the task description)",
             "priority": "high|medium|low",
             "estimatedTime": number (in minutes),
             "deadline": "string (optional, e.g., '2024-06-30', 'next week')",
             "assignee": "string (optional, e.g., 'john_doe')",
             "tags": ["string"],
             "dependencies": ["string (ID of task this depends on)"],
             "subtasks": [
               {
                 "content": "string (subtask description)",
                 "priority": "high|medium|low",
                 "estimatedTime": number (in minutes),
                 "deadline": "string (optional)",
                 "assignee": "string (optional)",
                 "tags": ["string"],
                 "dependencies": ["string (ID of task/subtask this depends on)"]
               }
             ]
           }
         ]
       }
    5. CRITICAL: Ensure the JSON is syntactically correct. Do not wrap it in markdown (no \`\`\`json).
    6. If you cannot extract any tasks, return {"tasks": []}.
    `;

  let documentSpecificInstructions = "";
  switch (documentType) {
    case 'meeting_minutes':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Meeting Minutes
        - Focus on action items assigned to specific individuals
        - Look for phrases like "Action:", "Owner:", "Due date:"
        - Extract discussion points that require follow-up
        - Identify decisions that need implementation
        - Break down complex action items into subtasks
      `;
      break;
    case 'project_plan':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Project Plan
        - Extract milestones and deliverables
        - Identify phases and their associated tasks
        - Look for resource assignments and timelines
        - Note dependencies between project components
        - Decompose milestones into actionable tasks and subtasks
      `;
      break;
    case 'contract':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Contract
        - Extract obligations and commitments
        - Identify deliverables and deadlines
        - Note approval and review requirements
        - Extract conditions that need to be met
        - Break down obligations into verification tasks
      `;
      break;
    case 'email':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Email
        - Extract action items and requests
        - Identify questions that need answers
        - Look for commitments made by the sender
        - Note deadlines mentioned in the email
        - Create follow-up tasks for responses needed
      `;
      break;
    case 'invoice':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Invoice
        - Extract payment-related tasks
        - Identify approval requirements
        - Note verification tasks
        - Extract follow-up actions needed
        - Create reminders for payment deadlines
      `;
      break;
    case 'research_paper':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Research Paper
        - Extract research tasks mentioned
        - Identify future work suggestions
        - Note methodology implementation tasks
        - Extract collaboration opportunities
        - Break down experiments into steps
      `;
      break;
    case 'manual':
      documentSpecificInstructions = `
        DOCUMENT TYPE: Manual
        - Extract implementation steps
        - Identify setup and configuration tasks
        - Note maintenance requirements
        - Extract troubleshooting procedures
        - Convert procedures into checklists
      `;
      break;
    default:
      documentSpecificInstructions = `
        DOCUMENT TYPE: General Document
        - Extract any actionable items
        - Identify commitments and deadlines
        - Look for action verbs and requirements
        - Note any follow-up needed
        - Infer tasks from goals or objectives
      `;
  }

  const chunkInstruction = isFirstChunk
    ? "This is the first chunk of the document. Focus on extracting all tasks and subtasks from this section."
    : "This is a subsequent chunk of the document. Extract all tasks and subtasks from this section, but be aware of potential overlaps with previous sections.";

  return {
    system: `${baseSystemPrompt}\n${documentSpecificInstructions}`,
    user: `${chunkInstruction}\nExtract tasks from this document content:\n---\n${content}\n---\nBegin your JSON response now:`,
  };
};

/**
 * Creates a prompt to generate subtasks if they are missing from a task.
 */
const createSubtaskRefinementPrompt = (task: any): AIPrompt => {
  return {
    system: `You are an expert task breakdown specialist. Your job is to take a single task and break it down into smaller, more manageable subtasks.
    CRITICAL INSTRUCTIONS:
    1. Break the task into 2-5 specific, actionable subtasks.
    2. Each subtask should be a clear, discrete step.
    3. For each subtask, determine:
       - Priority (high/medium/low) based on its importance to the main task.
       - Estimated completion time (minutes).
       - Deadline (if it should be completed by a specific time relative to the main task).
       - Assignee (if different from the main task).
       - Tags (relevant keywords).
       - Dependencies (if it depends on another subtask).
    4. Return ONLY a valid JSON object with this EXACT structure:
       {
         "subtasks": [
           {
             "content": "string (subtask description)",
             "priority": "high|medium|low",
             "estimatedTime": number (in minutes),
             "deadline": "string (optional)",
             "assignee": "string (optional)",
             "tags": ["string"],
             "dependencies": ["string (ID of task/subtask this depends on)"]
           }
         ]
       }
    5. CRITICAL: Ensure the JSON is syntactically correct. Do not wrap it in markdown.
    `,
    user: `Break down the following task into subtasks:\n\nMain Task: ${task.content}\n\nBegin your JSON response now:`,
  };
};

/**
 * Deduplicates tasks based on content and merges information like tags/dependencies.
 */
const deduplicateTasks = (tasks: any[]): any[] => {
  const uniqueTasks: any[] = [];
  const seenContents = new Set<string>();

  for (const task of tasks) {
    // Normalize task content for comparison (remove punctuation, normalize whitespace)
    const normalizedContent = task.content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!seenContents.has(normalizedContent)) {
      seenContents.add(normalizedContent);
      // If it's a genuinely new task, add it
      uniqueTasks.push(task);
    } else {
      // If a similar task exists, merge properties (e.g., tags, dependencies)
      const existingTaskIndex = uniqueTasks.findIndex(t =>
        t.content.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim() === normalizedContent
      );
      if (existingTaskIndex >= 0) {
        const existingTask = uniqueTasks[existingTaskIndex];
        // Merge tags and dependencies, keeping unique ones
        const mergedTags = [...new Set([...(existingTask.tags || []), ...(task.tags || [])])];
        const mergedDependencies = [...new Set([...(existingTask.dependencies || []), ...(task.dependencies || [])])];

        // Decide on priority (take the higher one)
        let mergedPriority = existingTask.priority;
        if (task.priority === 'high' || (task.priority === 'medium' && existingTask.priority === 'low')) {
            mergedPriority = task.priority;
        }

        // Take the maximum estimated time
        const mergedTime = Math.max(existingTask.estimatedTime || 0, task.estimatedTime || 0);

        // Merge subtasks (simple concatenation, deduplication could be added)
        const mergedSubtasks = [...(existingTask.subtasks || []), ...(task.subtasks || [])];

        // Update the existing task with merged information
        uniqueTasks[existingTaskIndex] = {
          ...existingTask,
          ...task, // Override with new properties where present
          tags: mergedTags,
          dependencies: mergedDependencies,
          priority: mergedPriority,
          estimatedTime: mergedTime,
          subtasks: mergedSubtasks
        };
      }
    }
  }
  return uniqueTasks;
};

// --- Main Analysis Function ---

/**
 * Analyzes a document's content using AI to extract tasks, categorize them, and generate a summary.
 */
export const analyzeDocument = async (content: string, fileName?: string): Promise<AnalysisResult> => {
  const startTime = Date.now();
  console.log(`[AI Analysis] Starting analysis for file: ${fileName || 'Pasted Text'}`);
  console.log(`[AI Analysis] Raw content length: ${content.length} characters`);

  try {
    // --- Step 1: Preprocess content with document type detection ---
    const { processedContent, documentType } = preprocessContent(content);
    console.log(`[AI Analysis] Preprocessed content length: ${processedContent.length} characters`);
    console.log(`[AI Analysis] Detected document type: ${documentType}`);

    // --- Validation: Check if content is sufficient ---
    if (!processedContent || processedContent.trim().length < 10) {
      console.warn("[AI Analysis] Content is empty or too short for meaningful analysis.");
      return {
        totalTasks: 0,
        groups: [
          {
            id: 'empty-content',
            name: 'No Content Detected',
            description: 'The uploaded document did not contain enough readable text for analysis.',
            tasks: [],
          },
        ],
        summary: {
          projectDescription: "No content was found in the document to analyze.",
          milestones: [],
          resources: [],
          risks: [],
          recommendations: [
            "Please upload a document with more readable content or try a different file.",
          ],
        },
        fileName: fileName || 'Untitled Document',
        processedAt: new Date().toISOString(),
        processingStats: {
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // --- Step 2: Extract tasks with enhanced AI using document type awareness ---
    // Chunk content for large documents
    const contentChunks = chunkContent(processedContent, 8000);
    console.log(`[AI Analysis] Split content into ${contentChunks.length} chunks for processing`);
    let allTasks: any[] = [];
    let totalTokensUsed = 0;

    // Process each chunk
    for (let i = 0; i < contentChunks.length; i++) {
      const chunk = contentChunks[i];
      console.log(`[AI Analysis] Processing chunk ${i + 1}/${contentChunks.length} (${chunk.length} characters)`);

      // Create document type-specific prompts
      const taskExtractionPrompt = createTaskExtractionPrompt(documentType, chunk, i === 0);
      console.log('[AI Analysis] Sending task extraction request...');
      const taskResponse = await performAIAnalysis(taskExtractionPrompt);
      console.log('[AI Analysis] Task extraction response received.');
      totalTokensUsed += taskResponse.usage?.total_tokens || 0;

      let taskData: any;
      try {
        // Handle potential markdown wrapping or extra text
        let rawContent = taskResponse.content.trim();
        if (rawContent.startsWith('```json')) {
          rawContent = rawContent.substring(7);
        }
        if (rawContent.startsWith('```')) {
          rawContent = rawContent.substring(3);
        }
        if (rawContent.endsWith('```')) {
          rawContent = rawContent.slice(0, -3);
        }
        rawContent = rawContent.trim();
        taskData = JSON.parse(rawContent);
      } catch (parseError) {
        console.error('[AI Analysis] Failed to parse task extraction response:', taskResponse.content);
        throw new Error(`AI returned invalid JSON for task extraction. Parser error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      if (!taskData || !Array.isArray(taskData.tasks)) {
        console.error('[AI Analysis] Invalid task data structure received:', taskData);
        throw new Error('AI did not return tasks in the expected JSON format.');
      }

      // Add chunk ID to tasks for later deduplication if needed
      const tasksWithChunkId = taskData.tasks.map((task: any) => ({
        ...task,
        chunkId: i,
      }));
      allTasks = [...allTasks, ...tasksWithChunkId];
    }

    console.log(`[AI Analysis] Extracted ${allTasks.length} tasks from all chunks.`);

    // --- Step 3: Ensure subtasks exist or generate them ---
    console.log('[AI Analysis] Ensuring all tasks have subtasks...');
    const tasksWithSubtasksPromises = allTasks.map(async (task: any) => {
      // If subtasks are missing or empty, try to generate them
      if (!task.subtasks || task.subtasks.length === 0) {
        console.log(`[AI Analysis] Generating subtasks for: ${task.content.substring(0, 50)}...`);
        try {
          const subtaskPrompt = createSubtaskRefinementPrompt(task);
          const subtaskResponse = await performAIAnalysis(subtaskPrompt);
          totalTokensUsed += subtaskResponse.usage?.total_tokens || 0;

          let rawContent = subtaskResponse.content.trim();
          if (rawContent.startsWith('```json')) {
            rawContent = rawContent.substring(7);
          }
          if (rawContent.startsWith('```')) {
            rawContent = rawContent.substring(3);
          }
          if (rawContent.endsWith('```')) {
            rawContent = rawContent.slice(0, -3);
          }
          rawContent = rawContent.trim();

          const subtaskData = JSON.parse(rawContent);
          if (subtaskData && Array.isArray(subtaskData.subtasks)) {
            return { ...task, subtasks: subtaskData.subtasks };
          } else {
            console.warn('[AI Analysis] Subtask generation returned invalid structure, keeping task as-is.');
            return task; // Return original task if subtask generation fails
          }
        } catch (subtaskError) {
          console.error('[AI Analysis] Error generating subtasks for task:', task.content, subtaskError);
          return task; // Return original task if subtask generation fails
        }
      } else {
        // Subtasks already exist, return as is
        return task;
      }
    });

    const tasksWithSubtasks = await Promise.all(tasksWithSubtasksPromises);
    console.log(`[AI Analysis] Subtask processing complete.`);

    // --- Step 4: Deduplicate and merge tasks ---
    const uniqueTasks = deduplicateTasks(tasksWithSubtasks);
    console.log(`[AI Analysis] After deduplication: ${uniqueTasks.length} unique tasks.`);

    // Handle case of no tasks found (should be rare now)
    if (uniqueTasks.length === 0) {
      console.log("[AI Analysis] No tasks extracted by AI (unexpected).");
      // Provide a minimal valid result structure
      return {
        totalTasks: 0,
        groups: [
          {
            id: 'no-tasks',
            name: 'Analysis Complete - No Tasks Found',
            description: 'The AI processed the document but did not identify any specific tasks.',
            tasks: [],
          }
        ],
        summary: {
          projectDescription: "The document was processed successfully, but no specific tasks were identified. This might happen if the content is highly narrative or lacks clear action items.",
          milestones: [],
          resources: [],
          risks: [],
          recommendations: [
            "Review the document for implicit goals or requirements that could be converted into tasks.",
            "Consider if the document type is suitable for task extraction (e.g., not a novel or poem).",
            "If you believe tasks should have been found, please provide feedback to improve the analysis."
          ]
        },
        fileName: fileName || 'Untitled Document',
        processedAt: new Date().toISOString(),
        processingStats: {
          tokensUsed: totalTokensUsed,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // --- Step 5: Categorize tasks ---
    // Prepare task list for categorization prompt
    const tasksForCategorization = uniqueTasks.map((task: any, index: number) =>
      `${index + 1}. ${task.content.substring(0, 200)}... (ID: task-${index + 1})`
    ).join('\n');

    const categorizationPrompt: AIPrompt = {
      system: `You are a task categorization expert. Group a list of tasks into logical, meaningful categories.
        CRITICAL INSTRUCTIONS:
        1. Create 3-7 distinct categories based on the nature of the work (e.g., 'Research', 'Writing', 'Review', 'Development').
        2. Categories should be descriptive and represent functional areas or project phases.
        3. Assign EVERY task to exactly one category.
        4. Return ONLY a valid JSON object with this EXACT structure:
           {
             "categories": [
               {
                 "name": "string (category name)",
                 "description": "string (brief description of the category)",
                 "taskIds": ["string (IDs of tasks in this category, e.g., 'task-1', 'task-5')"]
               }
             ]
           }
        5. CRITICAL: Ensure the JSON is syntactically correct. Do not wrap it in markdown.
        `,
      user: `Categorize these tasks into logical groups:\n---\n${tasksForCategorization}\n---\nBegin your JSON response now:`,
    };

    console.log('[AI Analysis] Sending categorization request...');
    const categoryResponse = await performAIAnalysis(categorizationPrompt);
    console.log('[AI Analysis] Categorization response received.');
    totalTokensUsed += categoryResponse.usage?.total_tokens || 0;

    let categoryData: any;
    try {
      let rawContent = categoryResponse.content.trim();
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.substring(7);
      }
      if (rawContent.startsWith('```')) {
        rawContent = rawContent.substring(3);
      }
      if (rawContent.endsWith('```')) {
        rawContent = rawContent.slice(0, -3);
      }
      rawContent = rawContent.trim();
      categoryData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('[AI Analysis] Failed to parse categorization response:', categoryResponse.content);
      throw new Error(`AI returned invalid JSON for categorization. Parser error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    if (!categoryData || !Array.isArray(categoryData.categories) || categoryData.categories.length === 0) {
      console.error('[AI Analysis] Invalid category data structure received:', categoryData);
      throw new Error('AI did not return categories in the expected JSON format.');
    }

    // --- Step 6: Generate summary ---
    // Prepare task list for summary prompt
    const tasksForSummary = uniqueTasks.map((task: TaskItem) => `- ${task.content.substring(0, 150)}...`).join('\n');

    const summaryPrompt: AIPrompt = {
      system: `You are a project management expert. Create a concise summary of the provided tasks.
        CRITICAL INSTRUCTIONS:
        1. Provide a brief overall project description (1-2 sentences) based on the tasks.
        2. List 2-4 key milestones or major checkpoints.
        3. Identify 2-4 key resources or skills needed.
        4. Mention 1-2 potential risks or challenges.
        5. Give 1-2 recommendations for success.
        6. Return ONLY a valid JSON object with this EXACT structure:
           {
             "projectDescription": "string",
             "milestones": ["string"],
             "resources": ["string"],
             "risks": ["string"],
             "recommendations": ["string"]
           }
        7. CRITICAL: Ensure the JSON is syntactically correct. Do not wrap it in markdown.
        `,
      user: `Summarize this task list for project planning:\n---\n${tasksForSummary}\n---\nBegin your JSON response now:`,
    };

    console.log('[AI Analysis] Sending summary request...');
    const summaryResponse = await performAIAnalysis(summaryPrompt);
    console.log('[AI Analysis] Summary response received.');
    totalTokensUsed += summaryResponse.usage?.total_tokens || 0;

    let summaryData: any;
    try {
      let rawContent = summaryResponse.content.trim();
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.substring(7);
      }
      if (rawContent.startsWith('```')) {
        rawContent = rawContent.substring(3);
      }
      if (rawContent.endsWith('```')) {
        rawContent = rawContent.slice(0, -3);
      }
      rawContent = rawContent.trim();
      summaryData = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('[AI Analysis] Failed to parse summary response:', summaryResponse.content);
      throw new Error(`AI returned invalid JSON for summary. Parser error: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
    }

    // --- Step 7: Assemble final result ---
    console.log('[AI Analysis] Assembling final result...');
    // Ensure task IDs are consistent and add missing fields
    const tasksWithIds = uniqueTasks.map((task: any, index: number) => ({
      ...task,
      id: task.id || `task-${index + 1}`,
      completed: false,
      createdAt: new Date().toISOString(),
      // Ensure subtasks also have IDs if they don't
      subtasks: task.subtasks ? task.subtasks.map((st: any, stIndex: number) => ({
        ...st,
        id: st.id || `task-${index + 1}-subtask-${stIndex + 1}`,
        completed: st.completed || false,
        createdAt: st.createdAt || new Date().toISOString(),
      })) : []
    }));

    // Build groups from AI categories
    const groups: TaskGroup[] = categoryData.categories.map((cat: any, index: number) => {
      // Validate task IDs exist in our task list
      const validTaskIds = cat.taskIds.filter((id: string) =>
        tasksWithIds.some((t: TaskItem) => t.id === id)
      );
      return {
        id: cat.id || `group-${index + 1}`,
        name: cat.name,
        description: cat.description || '',
        tasks: tasksWithIds.filter((task: TaskItem) => validTaskIds.includes(task.id)),
      };
    });

    // Ensure all tasks are assigned (catch-all group)
    const assignedTaskIds = new Set(groups.flatMap(group => group.tasks.map(task => task.id)));
    const unassignedTasks = tasksWithIds.filter((task: TaskItem) => !assignedTaskIds.has(task.id));

    if (unassignedTasks.length > 0) {
      groups.push({
        id: 'unassigned',
        name: 'Uncategorized Tasks',
        description: 'Tasks that could not be categorized by the AI.',
        tasks: unassignedTasks,
      });
      console.log(`[AI Analysis] ${unassignedTasks.length} tasks were unassigned and placed in 'Uncategorized Tasks'.`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[AI Analysis] Analysis completed successfully in ${processingTime}ms.`);

    return {
      totalTasks: tasksWithIds.length,
      groups,
      summary: summaryData,
      fileName: fileName || 'Untitled Document',
      processedAt: new Date().toISOString(),
      processingStats: {
        tokensUsed: totalTokensUsed,
        processingTime: processingTime,
      },
    };
  } catch (error: any) {
    console.error('[AI Analysis] Fatal Error:', error);
    throw new Error(`AI analysis failed: ${error.message || 'An unknown error occurred during AI processing.'}`);
  }
};