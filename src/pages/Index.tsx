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
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async (content: string, fileName?: string) => {
    try {
      setIsAnalyzing(true);
      setProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await analyzeDocument(content, fileName);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setAnalysisResult(result);
        setCurrentView('checklist');
        
        toast({
          title: "Analysis complete! 🎉",
          description: `Found ${result.totalTasks} tasks across ${result.groups.length} categories.`,
          duration: 5000
        });
      }, 500);
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
    setProgress(0);
  };

  // Enhanced AI features
  const aiFeatures = [
    {
      icon: Brain,
      title: "Advanced NLP",
      description: "Context-aware task extraction using transformer models"
    },
    {
      icon: Target,
      title: "Priority Detection",
      description: "Semantic analysis for urgency and importance scoring"
    },
    {
      icon: Clock,
      title: "Time Estimation",
      description: "ML-powered duration prediction for each task"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Parallel processing for instant results"
    }
  ];

  if (currentView === 'checklist' && analysisResult) {
    return (
      <ChecklistPage 
        analysisResult={analysisResult}
        onBack={handleBackToUpload}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="p-3 gradient-primary rounded-2xl shadow-glow transform transition-transform hover:scale-110">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <Badge className="gradient-primary text-white px-4 py-2 animate-pulse-slow">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 gradient-primary bg-clip-text text-transparent animate-slide-up">
            Lovable AI
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-slide-up animation-delay-200">
            Transform any document into an intelligent, prioritized checklist. 
            Upload PDFs, images, or paste text and let AI extract actionable tasks automatically.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-up animation-delay-400">
            {[
              { icon: FileText, text: "Document Analysis" },
              { icon: Target, text: "Smart Prioritization" },
              { icon: Clock, text: "Time Estimation" },
              { icon: Zap, text: "Instant Results" }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm bg-secondary/30 px-3 py-1.5 rounded-full transition-transform hover:-translate-y-1"
              >
                <item.icon className="w-4 h-4 text-primary" />
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {aiFeatures.map((feature, index) => (
            <div
              key={index}
              className="h-full transition-all duration-300 hover:-translate-y-2"
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-primary/20">
                <div className="p-6">
                  <div className="gradient-primary p-3 rounded-xl w-fit mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="max-w-4xl mx-auto animate-fade-in animation-delay-600">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Get Started</h2>
            <p className="text-muted-foreground">
              Upload your document or paste content to begin AI analysis
            </p>
          </div>
          
          <div className="transition-transform hover:scale-[1.02]">
            <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} progress={progress} />
          </div>
        </div>

        {/* Demo Note */}
        <div className="animate-fade-in animation-delay-800">
          <Card className="mt-12 p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium mb-1">Enhanced AI Demo</h4>
                <p className="text-sm text-muted-foreground">
                  This demo showcases advanced AI capabilities including contextual task extraction, 
                  semantic priority detection, and time estimation. For production use, connect to 
                  your backend for full OCR and data persistence.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .gradient-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
        
        .shadow-glow {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
        }
        
        .transition-smooth {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover\:shadow-elegant:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
};

export default Index;