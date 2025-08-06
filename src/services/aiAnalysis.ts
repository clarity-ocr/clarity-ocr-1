// src/services/aiAnalysis.ts
import axios from 'axios';
import { AnalysisResult, TaskGroup, TaskItem } from '@/types/task';

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Define the Groq API response type
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

// Real AI service using Groq API with retry logic and better error handling
const performAIAnalysis = async (prompt: AIPrompt, retries: number = 3): Promise<AIResponse> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GROQ_API_KEY}`,
  };

  // Use a powerful model
  const data = {
    model: 'llama3-70b-8192',
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

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[AI Analysis] Groq API call attempt ${attempt}/${retries}`);
      const response = await axios.post<GroqApiResponse>(GROQ_API_URL, data, {
        headers,
        timeout: 45000, // Increase timeout for complex tasks
      });

      if (response.data && response.data.choices && response.data.choices.length > 0) {
        console.log(`[AI Analysis] Groq API call successful on attempt ${attempt}`);
        return {
          content: response.data.choices[0].message.content.trim(), // Trim whitespace
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
        } else if (error.request) {
            console.error("[AI Analysis] No response received:", error.request);
        }
      }

      if (attempt < retries) {
        // Exponential backoff with jitter
        const baseDelay = 1000; // 1 second
        const maxDelay = 10000; // 10 seconds
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000, maxDelay);
        console.log(`[AI Analysis] Retrying in ${delay.toFixed(0)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('[AI Analysis] All Groq API attempts failed:', lastError);
  // Provide a more specific error message based on the last known error
  let userMessage = 'Unknown error during AI analysis.';
  if (lastError?.code === 'ECONNABORTED') {
    userMessage = 'The AI analysis timed out. The document might be very complex.';
  } else if (lastError?.response?.status === 429) {
     userMessage = 'Rate limit exceeded for the AI service. Please try again in a moment.';
  } else if (lastError?.response?.status >= 500) {
     userMessage = 'The AI service is temporarily unavailable. Please try again later.';
  } else if (lastError?.message) {
      userMessage = lastError.message;
  }
  throw new Error(`Failed to analyze document with AI after ${retries} attempts: ${userMessage}`);
};

// Preprocess content for better AI analysis
const preprocessContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let processed = content;

  // Remove or replace problematic control characters (keep newlines, tabs, spaces)
  // This is important for OCR text which can sometimes contain unusual characters
  processed = processed.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ');

  // Normalize different newline formats
  processed = processed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Remove excessive whitespace while preserving paragraph breaks
  processed = processed.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  processed = processed.replace(/\n{3,}/g, '\n\n'); // Multiple newlines to double newline (paragraph)

  // Trim leading/trailing whitespace
  processed = processed.trim();

  return processed;
};

// --- Main Analysis Function ---

export const analyzeDocument = async (content: string, fileName?: string): Promise<AnalysisResult> => {
  const startTime = Date.now();
  console.log(`[AI Analysis] Starting analysis for file: ${fileName || 'Pasted Text'}`);
  console.log(`[AI Analysis] Raw content length: ${content.length} characters`);

  try {
    // --- Step 1: Preprocess content ---
    const preprocessedContent = preprocessContent(content);
    console.log(`[AI Analysis] Preprocessed content length: ${preprocessedContent.length} characters`);

    // --- Validation: Check if content is sufficient ---
    if (!preprocessedContent || preprocessedContent.trim().length < 10) {
      console.warn("[AI Analysis] Content is empty or too short for meaningful analysis.");
      // Return a minimal valid result structure for empty/short content
      return {
        totalTasks: 0,
        groups: [
          {
            id: 'empty-content',
            name: 'No Content Detected',
            description: 'The uploaded document did not contain enough readable text for analysis.',
            tasks: [],
          }
        ],
        summary: {
          projectDescription: "No content was found in the document to analyze.",
          milestones: [],
          resources: [],
          risks: [],
          recommendations: ["Please upload a document with more readable content or try a different file."]
        },
        fileName: fileName || 'Untitled Document',
        processedAt: new Date().toISOString(),
        processingStats: {
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }

    // --- Step 2: Extract tasks with enhanced AI ---
    // Limit content sent to AI to prevent token limits, but intelligently
    const maxContextLength = 12000; // Adjust based on model limits and testing
    const contentForAI = preprocessedContent.substring(0, maxContextLength);
    console.log(`[AI Analysis] Sending ${contentForAI.length} characters to AI for task extraction.`);

    const taskExtractionPrompt: AIPrompt = {
      system: `You are an expert task extraction AI. Extract actionable tasks from documents.
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
                 "dependencies": ["string (ID of task this depends on)"]
               }
             ]
           }
        5. CRITICAL: Ensure the JSON is syntactically correct. Do not wrap it in markdown (no \`\`\`json).
        6. If you cannot extract any tasks, return {"tasks": []}.
        `,
      user: `Extract tasks from this document content:
      ---
      ${contentForAI}
      ---
      Begin your JSON response now:`,
    };

    console.log('[AI Analysis] Sending task extraction request...');
    const taskResponse = await performAIAnalysis(taskExtractionPrompt);
    console.log('[AI Analysis] Task extraction response received.');

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

    console.log(`[AI Analysis] Extracted ${taskData.tasks.length} tasks.`);

    // Handle case of no tasks found
    if (taskData.tasks.length === 0) {
        console.log("[AI Analysis] No tasks extracted by AI.");
        return {
            totalTasks: 0,
            groups: [
                {
                    id: 'no-tasks',
                    name: 'No Tasks Found',
                    description: 'The AI could not identify any specific tasks in the document.',
                    tasks: [],
                }
            ],
            summary: {
                projectDescription: "The document was processed, but no specific tasks were identified.",
                milestones: [],
                resources: [],
                risks: [],
                recommendations: [
                    "Review the document content for specific action items or goals.",
                    "Consider rephrasing content to make tasks more explicit.",
                    "If this document type is common, feedback can help improve future analysis."
                ]
            },
            fileName: fileName || 'Untitled Document',
            processedAt: new Date().toISOString(),
            processingStats: {
                tokensUsed: taskResponse.usage?.total_tokens || 0,
                processingTime: Date.now() - startTime,
            },
        };
    }


    // --- Step 3: Categorize tasks ---
    // Prepare task list for categorization prompt
    const tasksForCategorization = taskData.tasks.map((task: any, index: number) =>
      `${index + 1}. ${task.content.substring(0, 200)}... (ID: task-${index + 1})` // Truncate for prompt length
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
      user: `Categorize these tasks into logical groups:
      ---
      ${tasksForCategorization}
      ---
      Begin your JSON response now:`,
    };

    console.log('[AI Analysis] Sending categorization request...');
    const categoryResponse = await performAIAnalysis(categorizationPrompt);
    console.log('[AI Analysis] Categorization response received.');

    let categoryData: any;
    try {
       // Handle potential markdown wrapping or extra text
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

    // --- Step 4: Generate summary ---
    // Prepare task list for summary prompt
    const tasksForSummary = taskData.tasks.map((task: TaskItem) => `- ${task.content.substring(0, 150)}...`).join('\n');

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
      user: `Summarize this task list for project planning:
      ---
      ${tasksForSummary}
      ---
      Begin your JSON response now:`,
    };

    console.log('[AI Analysis] Sending summary request...');
    const summaryResponse = await performAIAnalysis(summaryPrompt);
    console.log('[AI Analysis] Summary response received.');

    let summaryData: any;
    try {
       // Handle potential markdown wrapping or extra text
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

    // --- Step 5: Assemble final result ---
    console.log('[AI Analysis] Assembling final result...');

    // Ensure task IDs are consistent
    const tasksWithIds = taskData.tasks.map((task: any, index: number) => ({
      ...task,
      id: task.id || `task-${index + 1}`, // Prefer AI ID, fallback to generated
      completed: false,
      createdAt: new Date().toISOString(),
    }));

    // Build groups from AI categories
    const groups: TaskGroup[] = categoryData.categories.map((cat: any, index: number) => {
      // Validate task IDs exist in our task list
      const validTaskIds = cat.taskIds.filter((id: string) => tasksWithIds.some((t: TaskItem) => t.id === id));
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
        description: 'Tasks that could not be categorized.',
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
        tokensUsed: (taskResponse.usage?.total_tokens || 0) +
                    (categoryResponse.usage?.total_tokens || 0) +
                    (summaryResponse.usage?.total_tokens || 0),
        processingTime: processingTime,
      },
    };
  } catch (error: any) {
    console.error('[AI Analysis] Fatal Error:', error);
    // Re-throw the error to be caught by the FileUpload component
    throw new Error(`AI analysis failed: ${error.message || 'An unknown error occurred during AI processing.'}`);
  }
};