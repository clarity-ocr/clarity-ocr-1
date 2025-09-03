import { useState, useCallback, useEffect, FC } from 'react';
import { Menu, X, User, Settings, Twitter, Github, Linkedin, ArrowDown, Star, CheckCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import { analyzeDocument } from '@/services/aiAnalysis';
import { AnalysisResult } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { addToHistory } from '@/services/historyService';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, ValidationError } from '@formspree/react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { motion, Variants } from "framer-motion";

// --- Custom Dual-Tone Icons for the New Design ---
interface IconProps { className?: string; }
const IconLogo: FC<IconProps> = ({ className }) => <img src="/icon.png" alt="Clarity OCR Logo" className={className} />;

const GradientDefs = () => (
  <defs>
    <linearGradient id="aurora-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#06B6D4" />
      <stop offset="50%" stopColor="#3B82F6" />
      <stop offset="100%" stopColor="#8B5CF6" />
    </linearGradient>
  </defs>
);

const IconSparkles: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="url(#aurora-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconAdvancedOCR: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" stroke="url(#aurora-gradient)" strokeWidth="1.5"/></svg>);
const IconTaskExtraction: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M14 20L20 14M14.5 3.5L17 6L11 12L8.5 9.5L14.5 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M12 22H5C3.89543 22 3 21.1046 3 20V5C3 3.89543 3.89543 3 5 3H12" stroke="url(#aurora-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconTimeEstimation: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#aurora-gradient)" strokeWidth="1.5"/></svg>);
const IconMultiFormat: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="url(#aurora-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>);
const IconFastProcessing: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M13 10L18 14L13 18V10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M6 3L11 7L6 11V3Z" stroke="url(#aurora-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IconIntuitiveUI: FC<IconProps> = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><GradientDefs /><path d="M18 10L21 7L17 3L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/><path d="M3 21L12 12L15 15L21 9M3 21H8V16" stroke="url(#aurora-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);

// --- Component Data ---
const FEATURES_DATA = [ { icon: IconAdvancedOCR, title: "Advanced OCR", description: "Accurately extracts text from images, PDFs, and even handwritten notes.", benefits: ["Multi-language support", "Handwriting recognition", "Table extraction"] }, { icon: IconTaskExtraction, title: "Smart Task Extraction", description: "AI identifies actionable tasks, deadlines, and key info from unstructured text.", benefits: ["Automatic task detection", "Priority assignment", "Deadline extraction"] }, { icon: IconTimeEstimation, title: "AI Time Estimation", description: "Predicts the time required to complete each task based on its complexity.", benefits: ["Accurate time predictions", "Customizable estimates", "Improves over time"] }, { icon: IconFastProcessing, title: "Lightning Fast", description: "Optimized cloud algorithms ensure you get results in seconds, not minutes.", benefits: ["Real-time processing", "Batch uploads", "Cloud acceleration"] }, { icon: IconMultiFormat, title: "Multi-Format Support", description: "Handles PDFs, all major image formats, and Word documents with ease.", benefits: ["PDF processing", "Image OCR", "Document parsing"] }, { icon: IconIntuitiveUI, title: "Intuitive Interface", description: "A simple drag-and-drop design makes it easy to upload, analyze, and manage tasks.", benefits: ["Simple drag & drop", "Progress tracking", "Multiple export options"] } ];
const TESTIMONIALS = [ { name: "Sarah J.", role: "Project Manager", content: "Clarity OCR has transformed how we process client briefs. It cuts our planning time by over 70%!", avatar: "SJ", rating: 5 }, { name: "Michael C.", role: "PhD Researcher", content: "The accuracy is phenomenal. It understands scientific papers and extracts tasks like a human assistant.", avatar: "MC", rating: 5 }, { name: "David R.", role: "Legal Assistant", content: "Finding key dates and obligations in contracts used to take hours. Now it's instant. An absolute game-changer.", avatar: "DR", rating: 5 } ];
const FAQ_ITEMS = [ { question: "What file formats do you support?", answer: "We support PDFs, JPG, PNG, GIF, BMP, TIFF, and WEBP images. Our system is optimized for high-resolution scans and digital documents for best results." }, { question: "Is my data secure?", answer: "Absolutely. We use industry-standard encryption (TLS in transit, AES-256 at rest). Your file content is deleted from our servers immediately after analysis is complete. Your privacy is our priority." }, { question: "Can I export the results?", answer: "Yes, you can export your generated task lists as JSON, PDF, or CSV files directly from the checklist page after analysis. This makes it easy to import into your favorite project management tools." } ];

// --- Contact Form Component ---
const ContactSection: FC = () => {
    const { toast } = useToast();
    const [state, handleSubmit] = useForm("xblapjll"); 

    useEffect(() => {
        if (state.succeeded) {
            toast({
                title: "Message Sent!",
                description: "Thanks for reaching out. We'll get back to you soon.",
            });
        }
    }, [state.succeeded, toast]);

    return (
        <section id="contact" className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold font-sora text-slate-800 dark:text-slate-200">Get In Touch</h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Have questions or feedback? We'd love to hear from you.</p>
                </div>
                <div className="p-1 bg-gradient-to-br from-sky-400 via-purple-500 to-indigo-600 rounded-2xl shadow-2xl shadow-purple-500/10">
                    <Card className="p-6 sm:p-8 bg-white/80 dark:bg-[#12172a]/80 backdrop-blur-2xl rounded-[15px] border-none">
                        {state.succeeded ? (
                            <div className="text-center py-10">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold font-sora text-slate-800 dark:text-slate-200">Thank You!</h3>
                                <p className="text-slate-600 dark:text-slate-400 mt-2">Your message has been sent successfully.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Your Email</Label>
                                    <Input id="email" type="email" name="email" placeholder="you@example.com" required className="bg-white/50 dark:bg-slate-900/50" />
                                    <ValidationError prefix="Email" field="email" errors={state.errors} className="text-red-500 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-slate-700 dark:text-slate-300">Message</Label>
                                    <Textarea id="message" name="message" placeholder="Your questions or feedback..." required rows={5} className="bg-white/50 dark:bg-slate-900/50" />
                                    <ValidationError prefix="Message" field="message" errors={state.errors} className="text-red-500 text-sm" />
                                </div>
                                <Button type="submit" disabled={state.submitting} size="lg" className="w-full text-base h-12 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform disabled:opacity-70 disabled:scale-100">
                                    {state.submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                                    Send Message
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </section>
    );
};

// --- Main Redesigned Component ---
export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const handleAnalyze = useCallback(async (content: string, fileName?: string) => {
    if (!user) { toast({ title: "Authentication Required", variant: "destructive" }); return; }
    setIsAnalyzing(true); setProgress(0);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 200);
    try {
      const result: AnalysisResult = await analyzeDocument(content, fileName);
      clearInterval(progressInterval); setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      const historyId = await addToHistory(result, fileName || 'Untitled Document');
      toast({ title: "Analysis Complete!", description: `Found ${result.totalTasks} tasks. Redirecting...` });
      setTimeout(() => navigate(`/checklist/${historyId}`), 500);
    } catch (error: any) {
      clearInterval(progressInterval);
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false); setProgress(0);
    }
  }, [navigate, toast, user]);

  const toggleMobileMenu = useCallback(() => setMobileMenuOpen(prev => !prev), []);
  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.15 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } } };

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#0D1121]"><Loader2 className="h-10 w-10 animate-spin text-slate-500" /></div>;
  }
  
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
      
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-[#0D1121]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group" onClick={() => scrollToSection('hero')}>
              <div className="bg-gradient-to-br from-sky-400 to-purple-600 p-2 rounded-xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <IconLogo className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold font-sora text-slate-800 dark:text-slate-100 hidden sm:block">Clarity OCR</h1>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white" onClick={() => scrollToSection('features')}>Features</Button>
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white" onClick={() => navigate('/history')}>History</Button>
                <Button variant="ghost" className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white" onClick={() => scrollToSection('contact')}>Contact</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-10 w-10 rounded-full"><User /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount><DropdownMenuLabel>{user?.email}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onClick={() => navigate('/profile')}><Settings className="mr-2 h-4 w-4" />Profile</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="p-2 rounded-lg" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-slate-200/80 dark:border-slate-800/80 pt-4">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="w-full justify-start text-base py-3" onClick={() => scrollToSection('features')}>Features</Button>
                <Button variant="ghost" className="w-full justify-start text-base py-3" onClick={() => { navigate('/history'); setMobileMenuOpen(false); }}>History</Button>
                <Button variant="ghost" className="w-full justify-start text-base py-3" onClick={() => scrollToSection('contact')}>Contact</Button>
                <DropdownMenuSeparator />
                <div className="px-3 py-2 text-sm font-semibold">{user?.email}</div>
                <Button variant="ghost" className="w-full justify-start text-base py-3" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>
                  <Settings className="mr-2 h-4 w-4" />Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main>
        <section id="hero" className="relative text-center overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>
          <div className="container mx-auto px-4">
            <motion.div variants={itemVariants} initial="hidden" animate="show">
              <Badge className="py-2 px-4 text-sm bg-sky-100/80 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border border-sky-300 dark:border-sky-800 backdrop-blur-sm">
                <IconSparkles className="w-5 h-5 mr-2" /> AI-Powered Task Extraction
              </Badge>
            </motion.div>
            <motion.h1 variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="mt-6 text-4xl md:text-6xl font-bold font-sora tracking-tighter bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-white dark:via-slate-300 dark:to-white">
              Transform Documents into Action
            </motion.h1>
            <motion.p variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Clarity OCR intelligently reads your documents, identifies tasks, and creates organized checklists, saving you hours of manual work.
            </motion.p>
            <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="mt-10">
              <Button size="lg" className="text-base h-12 px-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform" onClick={() => scrollToSection('upload-zone')}>
                Start Analyzing Now <ArrowDown className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        <section id="upload-zone" className="container mx-auto px-4 pb-20 -mt-16">
          <div className="p-1 bg-gradient-to-br from-sky-400 via-purple-500 to-indigo-600 rounded-2xl max-w-4xl mx-auto shadow-2xl shadow-purple-500/10">
            <div className="p-6 sm:p-8 bg-white/80 dark:bg-[#12172a]/80 backdrop-blur-2xl rounded-[15px]">
              <h2 className="text-3xl font-bold text-center mb-2 font-sora text-slate-800 dark:text-slate-200">Get Started Here</h2>
              <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Upload a file or paste text to begin.</p>
              <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} progress={progress} />
            </div>
          </div>
        </section>
        
        <section id="features" className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-sora text-slate-800 dark:text-slate-200">One Tool, Limitless Productivity</h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Clarity OCR is packed with intelligent features designed to save you time and effort.</p>
                </div>
                <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {FEATURES_DATA.map((feature) => (
                        <motion.div variants={itemVariants} key={feature.title}>
                            <Card className="bg-slate-50 dark:bg-slate-800/30 h-full hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 transition-all duration-300 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <CardHeader>
                                    <div className="p-3 rounded-lg w-fit mb-4 bg-gradient-to-br from-sky-400 to-purple-600 text-white shadow-lg shadow-sky-500/20">
                                        <feature.icon className="w-8 h-8" />
                                    </div>
                                    <CardTitle className="font-sora text-xl text-slate-900 dark:text-white">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 dark:text-slate-400 mb-4">{feature.description}</p>
                                    <ul className="space-y-2">
                                        {feature.benefits.map((benefit) => (
                                            <li key={benefit} className="flex items-center gap-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-sky-500 flex-shrink-0" /> 
                                                <span className="text-slate-700 dark:text-slate-300">{benefit}</span>
                                            </li> 
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
        
        <section id="testimonials" className="py-20 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-sora text-slate-800 dark:text-slate-200">Trusted by Professionals</h2>
                    <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">See what our users are saying about Clarity OCR.</p>
                </div>
                <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((testimonial) => (
                        <motion.div variants={itemVariants} key={testimonial.name}>
                            <Card className="bg-white dark:bg-slate-800/50 h-full rounded-2xl">
                                <CardContent className="pt-8 flex flex-col h-full">
                                    <div className="flex-grow">
                                        <div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />)}</div>
                                        <p className="text-slate-600 dark:text-slate-300 italic">"{testimonial.content}"</p>
                                    </div>
                                    <div className="flex items-center gap-4 border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center font-bold text-white text-lg">{testimonial.avatar}</div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{testimonial.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>

        <section id="faq" className="py-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold font-sora text-slate-800 dark:text-slate-200">Frequently Asked Questions</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {FAQ_ITEMS.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index} className="border-b border-slate-200 dark:border-slate-800">
                            <AccordionTrigger className="text-lg text-left font-semibold text-slate-700 dark:text-slate-300 hover:no-underline py-6">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-slate-600 dark:text-slate-400 pb-6">{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
        
        <ContactSection />
      </main>

      <footer className="bg-white dark:bg-[#0D1121] border-t border-slate-200 dark:border-slate-800/50">
          <div className="container mx-auto px-4 py-12">
              <div className="text-center">
                  <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
                      <div className="bg-gradient-to-br from-sky-400 to-purple-600 p-2 rounded-xl"><IconLogo className="w-6 h-6" /></div>
                      <h1 className="text-xl font-bold font-sora text-slate-800 dark:text-slate-100">Clarity OCR</h1>
                  </Link>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Transforming unstructured documents into actionable insights with the power of AI.</p>
                  <div className="flex justify-center space-x-6 mt-6">
                      <a href="#" aria-label="Twitter" className="text-slate-500 hover:text-sky-500 transition-colors"><Twitter className="w-6 h-6"/></a>
                      <a href="#" aria-label="Github" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"><Github className="w-6 h-6"/></a>
                      <a href="#" aria-label="LinkedIn" className="text-slate-500 hover:text-blue-600 transition-colors"><Linkedin className="w-6 h-6"/></a>
                  </div>
              </div>
              <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 text-center text-sm text-slate-500">
                  <p>&copy; {new Date().getFullYear()} Clarity OCR. All rights reserved. | <Link to="/privacy" className="hover:text-slate-800 dark:hover:text-white">Privacy Policy</Link></p>
              </div>
          </div>
      </footer>
    </div>
  );
}