import { useState } from 'react';
import { Brain, Sparkles, Zap, FileText, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ChecklistPage } from '@/pages/Checklist';
import { analyzeDocument } from '@/services/aiAnalysis';
import { AnalysisResult } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'checklist'>('upload');
  const { toast } = useToast();

  const handleAnalyze = async (content: string, fileName?: string) => {
    try {
      setIsAnalyzing(true);
      const result = await analyzeDocument(content, fileName);
      setAnalysisResult(result);
      setCurrentView('checklist');
      
      toast({
        title: "Analysis complete! 🎉",
        description: `Found ${result.totalTasks} tasks across ${result.groups.length} categories.`
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Please try again with a different document.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
    setAnalysisResult(null);
  };

  if (currentView === 'checklist' && analysisResult) {
    return (
      <ChecklistPage 
        analysisResult={analysisResult}
        onBack={handleBackToUpload}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 gradient-primary rounded-2xl shadow-glow">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <Badge className="gradient-primary text-white px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-primary bg-clip-text text-transparent">
            Lovable AI
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform any document into an intelligent, prioritized checklist. 
            Upload PDFs, images, or paste text and let AI extract actionable tasks automatically.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-primary" />
              Document Analysis
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              Smart Prioritization
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              Time Estimation
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              Instant Results
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="p-6 hover:shadow-elegant transition-smooth">
            <div className="gradient-primary p-3 rounded-xl w-fit mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">AI-Powered Analysis</h3>
            <p className="text-muted-foreground text-sm">
              Advanced NLP algorithms analyze your documents line by line to extract meaningful tasks and priorities.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-smooth">
            <div className="gradient-primary p-3 rounded-xl w-fit mb-4">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Prioritization</h3>
            <p className="text-muted-foreground text-sm">
              Automatically detects urgency, deadlines, and importance to prioritize your tasks intelligently.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-elegant transition-smooth">
            <div className="gradient-primary p-3 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Interactive Checklists</h3>
            <p className="text-muted-foreground text-sm">
              Beautiful, animated checklists with progress tracking, filtering, and export capabilities.
            </p>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Get Started</h2>
            <p className="text-muted-foreground">
              Upload your document or paste content to begin AI analysis
            </p>
          </div>
          
          <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>

        {/* Demo Note */}
        <Card className="mt-12 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">Demo Mode</h4>
              <p className="text-sm text-muted-foreground">
                This is a frontend demonstration. For full functionality including real AI processing, 
                file uploads, OCR, and data persistence, connect your project to Supabase for backend services.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
