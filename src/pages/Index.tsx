import { useState, useCallback } from 'react';
import {
  Eye, Sparkles, Zap, FileText, Target, Clock, Menu, X, User,
  LogOut, History as HistoryIcon, Loader2, Star, Settings, CheckCircle,
  UploadCloud, ScanLine, ListChecks, Twitter, Github, Linkedin, 
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { analyzeDocument } from '@/services/aiAnalysis';
import { AnalysisResult } from '@/types/task';
import { useToast } from '@/hooks/use-toast'; 
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { addToHistory } from '@/services/historyService';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { motion, Variants } from "framer-motion";

const FEATURES_DATA = [ { icon: Eye, title: "Advanced OCR Technology", description: "Accurately extracts text from images, PDFs, and even handwritten notes with state-of-the-art recognition.", benefits: ["Multi-language support", "Handwriting recognition", "Table extraction"] }, { icon: Target, title: "Smart Task Extraction", description: "AI identifies actionable tasks, deadlines, and key information from unstructured text content.", benefits: ["Automatic task detection", "Priority assignment", "Deadline extraction"] }, { icon: Clock, title: "AI Time Estimation", description: "Predicts the time required to complete each task based on its complexity and your historical data.", benefits: ["Accurate time predictions", "Customizable estimates", "Improves over time"] }, { icon: Zap, title: "Lightning Fast Processing", description: "Optimized cloud algorithms ensure you get results in seconds, not minutes, even for large documents.", benefits: ["Real-time processing", "Batch uploads", "Cloud acceleration"] }, { icon: FileText, title: "Multi-Format Support", description: "Handles a wide range of document types, including PDFs, all major image formats, and Word documents.", benefits: ["PDF processing", "Image OCR", "Document parsing"] }, { icon: User, title: "User-Friendly Interface", description: "Intuitive drag-and-drop design makes it easy to upload, analyze, and manage your tasks.", benefits: ["Simple drag & drop", "Progress tracking", "Multiple export options"] } ];
const TESTIMONIALS = [ { name: "Sarah Johnson", role: "Project Manager, TechCorp", content: "Clarity OCR has transformed how we process client briefs. It cuts our planning time by over 70%!", avatar: "SJ", rating: 5 }, { name: "Michael Chen", role: "PhD Researcher, UniLab", content: "The accuracy is phenomenal. It understands scientific papers and extracts tasks like a human assistant.", avatar: "MC", rating: 5 }, { name: "David Rodriguez", role: "Legal Assistant, Law Partners", content: "Finding key dates and obligations in contracts used to take hours. Now it's instant. An absolute game-changer.", avatar: "DR", rating: 5 } ];
const FAQ_ITEMS = [ { question: "What file formats do you support?", answer: "We support PDFs, JPG, PNG, GIF, BMP, TIFF, and WEBP images. Our system is optimized for high-resolution scans and digital documents for best results." }, { question: "Is my data secure?", answer: "Absolutely. We use industry-standard encryption (TLS in transit, AES-256 at rest). Your file content is deleted from our servers immediately after analysis is complete. Your privacy is our priority." }, { question: "How accurate is the task extraction?", answer: "Our AI model is trained on millions of documents and achieves very high accuracy in identifying tasks, dates, and priorities. Accuracy is highest on clear, structured text." }, { question: "Can I export the results?", answer: "Yes, you can export your generated task lists as JSON, PDF, or CSV files directly from the checklist page after analysis. This makes it easy to import into your favorite project management tools." } ];

export default function Index() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAnalyze = useCallback(async (content: string, fileName?: string) => {
    if (!user) { toast({ title: "Authentication Required", description: "Please log in or sign up to analyze documents.", variant: "destructive" }); navigate('/login'); return; }
    setIsAnalyzing(true); setProgress(0); const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200); try { const result: AnalysisResult = await analyzeDocument(content, fileName); clearInterval(progressInterval); setProgress(100); await new Promise(resolve => setTimeout(resolve, 300)); const historyId = await addToHistory(result, fileName || 'Untitled Document'); toast({ title: "Analysis Complete! 🎉", description: `Found ${result.totalTasks} tasks. Redirecting...` }); setTimeout(() => navigate(`/checklist/${historyId}`), 500); } catch (error: any) { clearInterval(progressInterval); console.error("[Index] Analysis failed:", error); toast({ title: "Analysis Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" }); } finally { setIsAnalyzing(false); setProgress(0); }
  }, [navigate, toast, user]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true); try { await signOut(auth); toast({ title: "Logged Out", description: "You have been successfully logged out." }); navigate('/login'); } catch (error: any) { console.error("[Index] Logout error:", error); toast({ title: "Logout Failed", description: "There was an error logging out. Please try again.", variant: "destructive" }); } finally { setIsLoggingOut(false); }
  }, [navigate, toast]);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const scrollToSection = useCallback((sectionId: string) => { document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }); closeMobileMenu(); }, [closeMobileMenu]);

  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.2 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  const GuestNav = () => (
    <>
      <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
      <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
      <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
      <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
      <Button onClick={() => navigate('/register')}>Sign Up</Button>
    </>
  );

  const UserNav = () => (
    <>
      <Button variant="ghost" onClick={() => scrollToSection('upload-zone')}>Analyze</Button>
      <Button variant="ghost" onClick={() => navigate('/history')}>History</Button>
      <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild> <Button variant="ghost" className="relative h-10 w-10 rounded-full"> <User className="h-6 w-6 text-slate-600 dark:text-slate-300" /> </Button> </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">My Account</p><p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p></div></DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/history')}><HistoryIcon className="mr-2 h-4 w-4" /><span>History</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/about')}><User className="mr-2 h-4 w-4" /><span>About</span></DropdownMenuItem>
          <DropdownMenuItem disabled><Settings className="mr-2 h-4 w-4" /><span>Settings</span></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/50">{isLoggingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}<span>Log out</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 transition-shadow hover:shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => scrollToSection('hero')}><div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"><img src="/icon.png" alt="Clarity OCR Logo" className="w-6 h-6" /></div><h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 hidden sm:block">Clarity OCR</h1></Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" onClick={toggleMobileMenu} aria-label="Toggle menu">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            <div className="hidden md:flex items-center gap-2">{user ? <UserNav /> : <GuestNav />}</div>
          </div>
          {mobileMenuOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="md:hidden mt-4 pb-4 space-y-2 border-t border-slate-200 dark:border-slate-700 overflow-hidden">{user ? (<><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { scrollToSection('upload-zone'); closeMobileMenu(); }}>Analyze Document</Button><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { navigate('/history'); closeMobileMenu(); }}>History</Button><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { navigate('/pricing'); closeMobileMenu(); }}>Pricing</Button><div className="pt-2"><Button variant="destructive" className="w-full justify-center text-base py-6" onClick={handleLogout} disabled={isLoggingOut}>{isLoggingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogOut className="w-5 h-5 mr-2" />} Logout</Button></div></>) : (<><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { navigate('/features'); closeMobileMenu(); }}>Features</Button><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { navigate('/pricing'); closeMobileMenu(); }}>Pricing</Button><Button variant="ghost" className="w-full justify-start text-base py-6" onClick={() => { navigate('/about'); closeMobileMenu(); }}>About</Button><div className="flex gap-2 pt-4"><Button variant="outline" className="w-full text-base py-6" onClick={() => { navigate('/login'); closeMobileMenu(); }}>Login</Button><Button className="w-full text-base py-6" onClick={() => { navigate('/register'); closeMobileMenu(); }}>Sign Up</Button></div></>)}</motion.div>)}
        </div>
      </nav>
      
      <main>
        <section id="hero" className="relative overflow-hidden pt-20 pb-24"><div className="absolute inset-0 -z-10 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/95"></div><div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] opacity-30 dark:opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/80 via-indigo-500/50 to-transparent rounded-full blur-3xl" aria-hidden="true"></div><div className="container mx-auto px-4 text-center"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><Badge variant="outline" className="py-1.5 px-4 text-sm border-purple-300 text-purple-600 dark:border-purple-700 dark:text-purple-400 backdrop-blur-sm"><Sparkles className="w-4 h-4 mr-2" /> AI-Powered Task Extraction</Badge></motion.div><motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-slate-300 dark:to-white">Transform Documents into Action</motion.h1><motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">Clarity OCR intelligently reads your documents, identifies tasks, and creates organized checklists, saving you hours of manual work.</motion.p><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 flex justify-center gap-4"><Button size="lg" className="text-base" onClick={() => scrollToSection('upload-zone')}>Get Started Below <ArrowDown className="w-4 h-4 ml-2" /></Button></motion.div></div></section>
        <section id="upload-zone" className="container mx-auto px-4 pb-20 -mt-8"><div className="p-6 sm:p-8 bg-white dark:bg-slate-800/50 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto ring-1 ring-black/5 dark:ring-white/10"><h2 className="text-2xl font-bold text-center mb-2 text-slate-800 dark:text-slate-200">Start Your Analysis</h2><p className="text-center text-slate-500 dark:text-slate-400 mb-6">Upload a file or paste text to begin.</p><FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} progress={progress} /></div></section>
        <section id="how-it-works" className="py-20"><div className="container mx-auto px-4"><div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">A Simple Three-Step Process</h2><p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Get from document to checklist in under a minute.</p></div><motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"><motion.div variants={itemVariants}><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/50 rounded-full border-8 border-indigo-50 dark:border-indigo-900/30"><UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /></div><h3 className="text-xl font-semibold mb-2">1. Upload Document</h3><p className="text-slate-600 dark:text-slate-400">Securely upload your file or paste text directly into the analyzer.</p></motion.div><motion.div variants={itemVariants}><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/50 rounded-full border-8 border-purple-50 dark:border-purple-900/30"><ScanLine className="w-8 h-8 text-purple-600 dark:text-purple-400" /></div><h3 className="text-xl font-semibold mb-2">2. AI Analysis</h3><p className="text-slate-600 dark:text-slate-400">Our AI engine performs OCR and extracts actionable tasks in seconds.</p></motion.div><motion.div variants={itemVariants}><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/50 rounded-full border-8 border-green-50 dark:border-green-900/30"><ListChecks className="w-8 h-8 text-green-600 dark:text-green-400" /></div><h3 className="text-xl font-semibold mb-2">3. Get Checklist</h3><p className="text-slate-600 dark:text-slate-400">Receive an organized, editable checklist with priorities and deadlines.</p></motion.div></motion.div></div></section>
        <section id="features" className="py-20 bg-slate-100 dark:bg-slate-900/50"><div className="container mx-auto px-4"><div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">Powerful Features, Simple Interface</h2><p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Everything you need to streamline your document workflow and boost productivity.</p></div><motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{FEATURES_DATA.map((feature) => (<motion.div variants={itemVariants} key={feature.title}><Card className="bg-white dark:bg-slate-800 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300"><CardHeader><div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-lg w-fit mb-4 shadow-lg shadow-indigo-500/20"><feature.icon className="w-6 h-6 text-white" /></div><CardTitle>{feature.title}</CardTitle></CardHeader><CardContent><p className="text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p><ul className="space-y-2">{feature.benefits.map((benefit) => (<li key={benefit} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> <span className="text-slate-700 dark:text-slate-300">{benefit}</span></li> ))}</ul></CardContent></Card></motion.div>))}</motion.div></div></section>
        <section id="testimonials" className="py-20"><div className="container mx-auto px-4"><div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">Trusted by Professionals Worldwide</h2><p className="mt-4 text-lg text-slate-600 dark:text-slate-400">See what our users are saying about Clarity OCR.</p></div><motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">{TESTIMONIALS.map((testimonial) => (<motion.div variants={itemVariants} key={testimonial.name}><Card className="bg-white dark:bg-slate-800 h-full"><CardContent className="pt-6 flex flex-col h-full"><div className="flex-grow"><div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}</div><p className="text-slate-600 dark:text-slate-300 italic mb-6">"{testimonial.content}"</p></div><div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-4 mt-auto"><div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-lg">{testimonial.avatar}</div><div><p className="font-semibold text-slate-800 dark:text-slate-200">{testimonial.name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p></div></div></CardContent></Card></motion.div>))}</motion.div></div></section>
        <section id="faq" className="py-20 bg-slate-100 dark:bg-slate-900/50"><div className="container mx-auto px-4 max-w-4xl"><div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">Frequently Asked Questions</h2></div><Accordion type="single" collapsible className="w-full">{FAQ_ITEMS.map((faq) => (<AccordionItem value={faq.question} key={faq.question}><AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger><AccordionContent className="text-base text-slate-600 dark:text-slate-400">{faq.answer}</AccordionContent></AccordionItem>))}</Accordion></div></section>
      </main>

      <footer className="bg-slate-800 dark:bg-slate-950 text-slate-400">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2"><Link to="/" className="flex items-center gap-3 mb-4"><div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl"><img src="/icon.png" alt="Clarity OCR Logo" className="w-6 h-6" /></div><h1 className="text-xl font-bold text-slate-100">Clarity OCR</h1></Link><p className="max-w-md">Transforming unstructured documents into actionable insights with the power of AI.</p></div>
            <div><h3 className="font-semibold text-white mb-4">Navigate</h3><ul className="space-y-2"><li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features') }} className="hover:text-white transition-colors">Features</a></li><li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials') }} className="hover:text-white transition-colors">Testimonials</a></li><li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq') }} className="hover:text-white transition-colors">FAQ</a></li></ul></div>
            <div><h3 className="font-semibold text-white mb-4">Legal</h3><ul className="space-y-2"><li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li><li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li></ul></div>
          </div>
          {/* ✅ FIXED: Corrected JSX closing tag from </dvi> to </div> */}
          <div className="mt-12 border-t border-slate-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm">&copy; {new Date().getFullYear()} Clarity OCR. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" aria-label="Twitter" className="hover:text-white transition-colors"><Twitter className="w-5 h-5"/></a>
              <a href="#" aria-label="Github" className="hover:text-white transition-colors"><Github className="w-5 h-5"/></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5"/></a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`html { scroll-behavior: smooth; }`}</style>
    </div>
  );
}