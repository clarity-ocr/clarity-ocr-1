import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Scan, CheckSquare, Users, ArrowRight, Check, ChevronLeft, Sparkles } from 'lucide-react';
// Fixed: Removed 'cn' import

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Clarity OCR',
    description: 'Turn your physical documents into digital data instantly. No more manual typing.',
    icon: <Scan className="w-12 h-12 md:w-16 md:h-16 text-sky-500" />,
    color: 'bg-sky-500/10',
    ring: 'ring-sky-500/20'
  },
  {
    id: 'extract',
    title: 'AI Smart Extraction',
    description: 'Upload invoices or contracts. Our AI automatically identifies dates, totals, and key terms.',
    icon: <CheckSquare className="w-12 h-12 md:w-16 md:h-16 text-indigo-500" />,
    color: 'bg-indigo-500/10',
    ring: 'ring-indigo-500/20'
  },
  {
    id: 'collaborate',
    title: 'Collaborate & Conquer',
    description: 'Work together with your team. Assign tasks, track progress, and approve documents in real-time.',
    icon: <Users className="w-12 h-12 md:w-16 md:h-16 text-purple-500" />,
    color: 'bg-purple-500/10',
    ring: 'ring-purple-500/20'
  }
];

// Animation variants for sliding effect
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  })
};

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for back, 1 for next
  const [isCompleting, setIsCompleting] = useState(false);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const paginate = useCallback((newDirection: number) => {
    const nextStep = currentStep + newDirection;
    if (nextStep >= 0 && nextStep < steps.length) {
      setDirection(newDirection);
      setCurrentStep(nextStep);
      // Haptic feedback for mobile
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }, [currentStep]);

  const handleFinish = async () => {
    setIsCompleting(true);
    if (navigator.vibrate) navigator.vibrate([50, 100, 50]); // Success pattern
    try {
      await completeOnboarding();
      navigate('/');
    } catch (error) {
      console.error("Onboarding failed", error);
      setIsCompleting(false);
    }
  };

  // Fixed: Renamed unused 'e' to '_'
  const handleDragEnd = (_: any, { offset, velocity }: PanInfo) => {
    const swipeConfidenceThreshold = 10000;
    const swipePower = Math.abs(offset.x) * velocity.x;

    if (swipePower < -swipeConfidenceThreshold) {
      if (currentStep < steps.length - 1) paginate(1);
    } else if (swipePower > swipeConfidenceThreshold) {
      if (currentStep > 0) paginate(-1);
    }
  };

  const currentData = steps[currentStep];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0D1121] p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-20%] right-[-10%] w-[80vw] h-[80vw] bg-sky-500/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-indigo-500/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="w-full max-w-md z-10 relative flex flex-col h-[85vh] md:h-auto justify-center">
        
        {/* Progress Indicator */}
        <div className="flex gap-2 mb-8 px-4">
          {steps.map((_, index) => (
            <div 
              key={index}
              className="relative h-1.5 flex-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700"
            >
              <motion.div 
                initial={false}
                animate={{ 
                  width: index <= currentStep ? '100%' : '0%' 
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={`absolute left-0 top-0 h-full w-full ${index <= currentStep ? 'bg-sky-500' : ''}`}
              />
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="relative overflow-hidden min-h-[450px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={handleDragEnd}
              className="absolute w-full h-full touch-pan-y"
            >
              <Card className="h-full border border-white/20 shadow-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl">
                <CardContent className="flex flex-col items-center text-center p-8 h-full">
                  
                  {/* Icon Container */}
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className={`relative p-8 rounded-[2rem] mb-8 ${currentData.color} ring-1 ${currentData.ring}`}
                  >
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/10 rounded-[2rem] blur-sm" />
                    <div className="relative z-10">
                      {currentData.icon}
                    </div>
                    {/* Decorative Sparkle for "Pro" feel */}
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 fill-yellow-400 animate-pulse" />
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight"
                  >
                    {currentData.title}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed mb-auto"
                  >
                    {currentData.description}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex flex-col gap-4 px-2">
          <Button 
            size="lg" 
            onClick={() => currentStep === steps.length - 1 ? handleFinish() : paginate(1)} 
            className={`w-full h-14 text-lg rounded-2xl shadow-lg transition-all duration-300 ${
              currentStep === steps.length - 1 
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:scale-105 hover:shadow-sky-500/25' 
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'
            }`}
            disabled={isCompleting}
          >
            {currentStep === steps.length - 1 ? (
              <span className="flex items-center gap-2 font-bold">
                Get Started <Check className="w-5 h-5" />
              </span>
            ) : (
              <span className="flex items-center gap-2 font-semibold">
                Continue <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          <div className="flex justify-between items-center h-10">
            {currentStep > 0 ? (
              <button 
                onClick={() => paginate(-1)}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            {currentStep < steps.length - 1 && (
              <button 
                onClick={() => {
                   if (navigator.vibrate) navigator.vibrate(20);
                   setCurrentStep(steps.length - 1);
                   setDirection(1);
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-2"
              >
                Skip
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}