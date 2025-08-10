// src/pages/Index.tsx
import React, { useState, useCallback } from 'react';
import {
  Eye,
  Sparkles,
  Zap,
  FileText,
  Target,
  Clock,
  Menu,
  X,
  FileImage,
  File,
  User,
  Info,
  Shield,
  ArrowLeft,
  LogOut,
  History as HistoryIcon,
  Loader2,
  ChevronRight,
  Star,
  Users,
  Globe,
  Lock,
  BarChart3,
  Lightbulb,
  ThumbsUp,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Settings,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Github,
  Instagram,
  Youtube,
  Home,
  Upload,
  BookOpen,
  Briefcase,
  DollarSign,
  Award,
  Calendar,
  Bell,
  Search,
  Filter,
  Grid,
  List,
  Plus,
  Edit,
  Trash2,
  Share2,
  Download,
  Printer,
  Moon,
  Sun,
  Monitor,
  UserCircle,
  CreditCard,
  LifeBuoy,
  Newspaper,
  Building,
  Map,
  Navigation,
  Compass,
  Anchor,
  Sailboat,
  Rocket,
  Flame,
  Snowflake,
  Leaf,
  TreePine,
  Mountain,
  Waves,
  Sunrise,
  Sunset,
  Candy,
  Coffee,
  Wine,
  Beer,
  GlassWater,
  Apple,
  Cherry,
  Carrot,
  Egg,
  Milk,
  Pizza,
  Cake,
  IceCream,
  Cookie,
  CandyCane,
  Lollipop,
  Popcorn,
  Film,
  Gamepad2,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { analyzeDocument } from '@/services/aiAnalysis';
import { AnalysisResult } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { addToHistory } from '@/services/historyService';

// --- FEATURE DATA ---
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

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Project Manager",
    company: "TechCorp",
    content: "Clarity OCR has transformed how we process contracts. It cuts our review time by 70%!",
    avatar: "SJ",
    rating: 5
  },
  {
    name: "Michael Chen",
    role: "Researcher",
    company: "University Lab",
    content: "The accuracy of the OCR and task extraction is phenomenal. It understands context like a human.",
    avatar: "MC",
    rating: 5
  },
  {
    name: "David Rodriguez",
    role: "Legal Assistant",
    company: "Law Partners",
    content: "Finding clauses and deadlines used to take hours. Now it's instant. A game-changer for our firm.",
    avatar: "DR",
    rating: 4
  }
];

const FAQ_ITEMS = [
  {
    question: "What file formats do you support?",
    answer: "We support PDFs, JPG, PNG, GIF, BMP, TIFF, WEBP images, DOCX, TXT, and Markdown files."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We process your files securely and do not store them after analysis. All processing happens in memory."
  },
  {
    question: "How accurate is the OCR?",
    answer: "Our advanced OCR engine achieves over 99% accuracy on standard printed text and performs well on common fonts and clear scans."
  },
  {
    question: "Can I export the results?",
    answer: "Yes, you can export your task lists as JSON, PDF, or CSV files directly from the checklist page."
  }
];

// --- MAIN COMPONENT ---
export default function Index() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- HANDLERS ---
  const handleAnalyze = useCallback(async (content: string, fileName?: string) => {
    console.log(`[Index] Initiating analysis for content of length ${content.length}`);
    try {
      setIsAnalyzing(true);
      setProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      console.log("[Index] Calling AI analysis service...");
      const result: AnalysisResult = await analyzeDocument(content, fileName);
      console.log("[Index] AI analysis completed successfully.");
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Small delay to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Save to history and get the ID
      console.log("[Index] Saving analysis result to history...");
      const historyId = await addToHistory(result, fileName || 'Untitled Document');
      console.log(`[Index] Analysis saved with ID: ${historyId}`);
      
      // Show success toast
      toast({
        title: "Analysis Complete! 🎉",
        description: `Found ${result.totalTasks} tasks across ${result.groups.length} categories.`,
        duration: 5000
      });
      
      // Navigate to the checklist page
      console.log(`[Index] Navigating to checklist page for ID: ${historyId}`);
      
      // Use a small delay to ensure the toast is shown before navigation
      setTimeout(() => {
        navigate(`/checklist/${historyId}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("[Index] Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0); // Reset progress on finish/error
    }
  }, [navigate, toast]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      console.log("[Index] Initiating user logout...");
      await signOut(auth);
      console.log("[Index] User logged out successfully.");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error: any) {
      console.error("[Index] Logout error:", error);
      toast({
        title: "Logout Failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  }, [navigate, toast]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    closeMobileMenu();
  }, [closeMobileMenu]);

  // --- MEMOIZED DATA ---
  const aiFeatures = FEATURES_DATA;
  const testimonials = TESTIMONIALS;
  const faqs = FAQ_ITEMS;

  // --- RENDERING ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and App Name */}
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="gradient-primary p-2.5 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <img src="/icon.png" alt="Clarity OCR Logo" className="w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
              </div>
              <div className="transform transition-transform duration-300 group-hover:scale-105">
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Clarity OCR
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Extract What Matters
                </p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => scrollToSection('hero')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => scrollToSection('features')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Features
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigate('/history')}
              >
                <HistoryIcon className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigate('/about')}
              >
                <Info className="w-4 h-4 mr-2" />
                About
              </Button>
              
              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => scrollToSection('hero')}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => scrollToSection('features')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Features
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/history')}>
                <HistoryIcon className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigate('/about')}>
                <Info className="w-4 h-4 mr-2" />
                About
              </Button>
              
              {/* Logout Button for Mobile */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleLogout();
                  closeMobileMenu(); // Close menu after click
                }}
                disabled={isLoggingOut}
                className="w-full justify-start text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </nav>
      
      {/* Hero Section */}
      <div id="hero" className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
            <div className="gradient-primary p-3 rounded-2xl shadow-glow transform transition-transform hover:scale-110 hover:rotate-6">
              <img src="/icon.png" alt="Clarity OCR Logo" className="w-8 h-8" />
            </div>
            <Badge className="gradient-primary text-white px-4 py-2 animate-pulse-slow shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered OCR
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-slide-up">
            Transform Documents into Action
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto animate-slide-up animation-delay-200">
            Clarity OCR transforms any document into actionable insights. Upload PDFs, images, or paste text to extract tasks with precision.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10 md:mb-12 animate-slide-up animation-delay-400">
            {[
              { icon: FileImage, text: "Image Recognition" },
              { icon: FileText, text: "PDF Processing" },
              { icon: Target, text: "Smart Extraction" },
              { icon: Zap, text: "Instant Results" }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <item.icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {item.text}
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { value: "10K+", label: "Documents Processed" },
            { value: "99.5%", label: "OCR Accuracy" },
            { value: "< 30s", label: "Avg. Processing Time" },
            { value: "24/7", label: "Cloud Availability" }
          ].map((stat, index) => (
            <div key={index} className="p-4 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stat.value}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
        
        {/* File Upload Section */}
        <div className="mb-20">
          <div className="p-8 bg-gradient-to-br from-white/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-900/50 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-200">Start Analyzing Now</h2>
              <p className="text-slate-600 dark:text-slate-400">Upload a document or paste text to get started.</p>
            </div>
            <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} progress={progress} />
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-200">Powerful Features</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Discover the comprehensive capabilities of Clarity OCR designed to transform your document processing workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiFeatures.map((feature, index) => (
              <div
                key={index}
                className={`h-full overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  hoveredFeature === index ? 'ring-2 ring-indigo-500' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
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
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0"></div>
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
        
        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-200">Trusted by Professionals</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              See what our users are saying about Clarity OCR.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center text-indigo-800 font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{testimonial.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-200">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Everything you need to know about Clarity OCR.
            </p>
          </div>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 pb-2">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                    {faq.question}
                  </h3>
                </div>
                <div className="px-4 pb-4 pt-0">
                  <p className="text-slate-600 dark:text-slate-400">{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="text-center mb-16">
          <div className="p-12 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-700/20 dark:to-purple-700/20 backdrop-blur-sm shadow-xl rounded-3xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-200">Ready to Get Started?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who trust Clarity OCR to streamline their document workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="text-lg px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                Start Free Trial
              </button>
              <button className="text-lg px-8 py-6 bg-white hover:bg-gray-50 border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 font-bold rounded-xl shadow hover:shadow-md transition-all duration-300">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="gradient-primary p-2 rounded-xl">
                  <img src="/icon.png" alt="Clarity OCR Logo" className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Clarity OCR</h3>
              </div>
              <p className="mb-4">
                Transforming documents into actionable insights with cutting-edge AI technology.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Linkedin, Github, Instagram, Youtube].map((Icon, index) => (
                  <a key={index} href="#" className="text-slate-400 hover:text-white transition-colors" aria-label={`Follow us on ${Icon.name}`}>
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link to="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/guides" className="hover:text-white transition-colors">Guides</Link></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/legal" className="hover:text-white transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Clarity OCR. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/security" className="hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Custom Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-float {
          animation: float 4s ease-in-out infinite;
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
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
        
        .shadow-glow {
          box-shadow: 0 0 25px rgba(79, 70, 229, 0.4);
        }
        
        /* Enhanced transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        
        /* Mobile-first responsive adjustments */
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          h1 {
            font-size: 2.5rem;
          }
          
          .text-3xl {
            font-size: 1.875rem;
          }
          
          .text-2xl {
            font-size: 1.5rem;
          }
        }
        
        /* Dark mode enhancements */
        .dark {
          color-scheme: dark;
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Focus styles for accessibility */
        button:focus, a:focus, input:focus, select:focus {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }
        
        /* Enhanced card hover effects */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
}