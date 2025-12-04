import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Scan, CheckSquare, Users, ArrowRight, Check } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Clarity OCR',
    description: 'Transform your documents into actionable data with AI-powered Optical Character Recognition.',
    icon: <Scan className="w-16 h-16 text-sky-500" />,
    color: 'bg-sky-500/10'
  },
  {
    id: 'extract',
    title: 'Smart Extraction',
    description: 'Upload invoices, contracts, or handwritten notes. We automatically extract dates, amounts, and key details.',
    icon: <CheckSquare className="w-16 h-16 text-indigo-500" />,
    color: 'bg-indigo-500/10'
  },
  {
    id: 'collaborate',
    title: 'Team Collaboration',
    description: 'Invite your team, assign tasks based on documents, and track progress in real-time.',
    icon: <Users className="w-16 h-16 text-purple-500" />,
    color: 'bg-purple-500/10'
  }
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleting(true);
      await completeOnboarding();
      navigate('/');
    }
  };

  const currentData = steps[currentStep];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0D1121] p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10 relative">
        {/* Progress Bars */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                index <= currentStep ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center text-center p-8 pt-12">
                <div className={`p-6 rounded-3xl mb-8 ${currentData.color}`}>
                  {currentData.icon}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  {currentData.title}
                </h2>
                
                <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8">
                  {currentData.description}
                </p>

                <Button 
                  size="lg" 
                  onClick={handleNext} 
                  className="w-full h-14 text-lg rounded-xl bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-500/20"
                  disabled={isCompleting}
                >
                  {currentStep === steps.length - 1 ? (
                    <span className="flex items-center gap-2">Get Started <Check className="w-5 h-5" /></span>
                  ) : (
                    <span className="flex items-center gap-2">Next <ArrowRight className="w-5 h-5" /></span>
                  )}
                </Button>

                {currentStep < steps.length - 1 && (
                  <button 
                    onClick={() => setCurrentStep(steps.length - 1)}
                    className="mt-6 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    Skip to finish
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}