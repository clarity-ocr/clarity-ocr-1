// src/services/dashboardService.ts
import { 
    QuickStats, 
    ActivityLog, 
    UpcomingDeadline, 
    RecentDocument 
  } from '@/types/dashboard';
  
  // Mock Data Generators (Replace with Firestore Queries later)
  export const fetchQuickStats = async (): Promise<QuickStats> => {
    // TODO: Replace with: await getDoc(doc(db, 'stats', userId))
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          documentsUploaded: 128,
          documentsTrend: 12,
          tasksPending: 14,
          tasksCompleted: 45,
          storageUsed: 450, // 450 MB
          storageLimit: 1024, // 1 GB
        });
      }, 800);
    });
  };
  
  export const fetchRecentActivity = async (): Promise<ActivityLog[]> => {
    return [
      {
        id: '1',
        type: 'upload',
        user: 'You',
        description: 'uploaded "Invoice_Oct_2023.pdf"',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      },
      {
        id: '2',
        type: 'task_update',
        user: 'Sarah J.',
        userAvatar: 'SJ',
        description: 'marked "Review Contract Terms" as Done',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        id: '3',
        type: 'extraction',
        user: 'System',
        description: 'completed OCR for "Meeting_Notes.jpg"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
    ];
  };
  
  export const fetchUpcomingDeadlines = async (): Promise<UpcomingDeadline[]> => {
    return [
      {
        id: '101',
        title: 'Pay Vendor Invoice',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days
        priority: 'high',
        documentName: 'Invoice #9921',
      },
      {
        id: '102',
        title: 'Renew Software License',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5), // 5 days
        priority: 'medium',
        documentName: 'Licensing Agreement 2024',
      },
      {
        id: '103',
        title: 'Submit Tax Form',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
        priority: 'low',
        documentName: 'Tax_Q3.pdf',
      },
    ];
  };
  
  export const fetchRecentDocuments = async (): Promise<RecentDocument[]> => {
    return [
      {
        id: 'd1',
        name: 'Q4_Financials.pdf',
        uploadDate: new Date(),
        status: 'completed',
        confidence: 98,
      },
      {
        id: 'd2',
        name: 'Handwritten_Notes.jpg',
        uploadDate: new Date(),
        status: 'processing',
        confidence: 0,
      },
      {
        id: 'd3',
        name: 'Receipt_Starbucks.png',
        uploadDate: new Date(),
        status: 'completed',
        confidence: 85,
      },
      {
        id: 'd4',
        name: 'Unknown_Format.xyz',
        uploadDate: new Date(),
        status: 'error',
        confidence: 0,
      },
    ];
  };