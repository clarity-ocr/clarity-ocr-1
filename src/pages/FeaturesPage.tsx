// src/pages/Features.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Target, Clock, Zap, FileText, User, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FEATURES_DATA = [
  {
    icon: Eye,
    title: "Advanced OCR Technology",
    description: "State-of-the-art optical character recognition that accurately extracts text from images, PDFs, and scanned documents with high precision.",
    benefits: ["Multi-language support", "Handwriting recognition", "Table extraction", "Preserves formatting"]
  },
  {
    icon: Target,
    title: "Smart Task Extraction",
    description: "AI-powered analysis that identifies actionable tasks, deadlines, and priorities from unstructured text content.",
    benefits: ["Automatic task detection", "Priority assignment", "Deadline extraction", "Context understanding"]
  },
  {
    icon: Clock,
    title: "Time Estimation",
    description: "Machine learning algorithms that predict the time required to complete each task based on complexity and historical data.",
    benefits: ["Accurate predictions", "Customizable estimates", "Historical learning", "Adjustable parameters"]
  },
  {
    icon: Zap,
    title: "Lightning Fast Processing",
    description: "Optimized algorithms and parallel processing ensure quick results even for large documents.",
    benefits: ["Real-time processing", "Batch processing", "Cloud acceleration", "Scalable architecture"]
  },
  {
    icon: FileText,
    title: "Multi-Format Support",
    description: "Support for a wide range of document formats including PDFs, images, Word documents, and plain text.",
    benefits: ["PDF processing", "Image OCR", "Document parsing", "Text extraction"]
  },
  {
    icon: User,
    title: "User-Friendly Interface",
    description: "Intuitive design that makes it easy to upload, analyze, and manage extracted tasks and information.",
    benefits: ["Drag & drop", "Progress tracking", "Export options", "Mobile responsive"]
  }
];

function FeaturesPage() {
  const navigate = useNavigate();
  
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="gradient-primary p-2 rounded-xl">
                  <img src="/icon.png" alt="Clarity OCR Logo" className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Clarity OCR
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                    Extract What Matters
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Powerful Features
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Discover the comprehensive capabilities of Clarity OCR designed to transform your document processing workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.map((feature, index) => (
            <div key={index} className="h-full overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-6 h-full bg-white dark:bg-slate-800">
                <div className="gradient-primary p-3 rounded-xl w-fit mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700 dark:text-slate-300">Key Benefits:</h4>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .gradient-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default FeaturesPage;