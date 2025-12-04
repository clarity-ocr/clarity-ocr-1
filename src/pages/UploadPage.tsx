import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '@/components/FileUpload';
import { analyzeDocument } from '@/services/aiAnalysis';
import { addToHistory } from '@/services/historyService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AnalysisResult } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = useCallback(async (content: string, fileName?: string) => {
    if (!user) { 
      toast({ title: "Authentication Required", variant: "destructive" }); 
      return; 
    }
    
    setIsAnalyzing(true); 
    setProgress(0);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200);
    
    try {
      const result: AnalysisResult = await analyzeDocument(content);
      
      clearInterval(progressInterval); 
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const historyId = await addToHistory(result, fileName || 'Untitled Document');
      
      toast({ 
        title: "Success!", 
        description: `Extracted ${result.totalTasks} tasks.`,
      });
      
      // Navigate to the checklist view
      navigate(`/checklist/${historyId}`);
      
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({ 
        title: "Analysis Failed", 
        description: error.message || "Could not process document", 
        variant: "destructive" 
      });
    } finally {
      setIsAnalyzing(false); 
      setProgress(0);
    }
  }, [navigate, toast, user]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="lg:hidden">
           <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
           <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-sora">
             Upload Document
           </h1>
           <p className="text-slate-500 dark:text-slate-400">
             Drag and drop your files to extract tasks using AI.
           </p>
        </div>
      </div>

      <div className="p-[2px] bg-gradient-to-r from-sky-400 via-purple-500 to-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/10">
        <Card className="bg-white/95 dark:bg-[#161b2e] border-none rounded-[22px] backdrop-blur-xl">
           <CardContent className="p-6 md:p-12">
              <div className="flex items-center justify-center gap-2 mb-8">
                 <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
                    AI-Powered Extraction
                 </span>
              </div>
              
              <FileUpload 
                onAnalyze={handleAnalyze} 
                isAnalyzing={isAnalyzing} 
                progress={progress} 
              />
           </CardContent>
        </Card>
      </div>
      
      <div className="text-center text-sm text-slate-400">
         Supported formats: PDF, PNG, JPG, DOCX • Max size: 50MB
      </div>
    </div>
  );
}