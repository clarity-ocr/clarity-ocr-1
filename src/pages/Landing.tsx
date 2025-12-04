import { useState } from 'react';
import { Menu, X, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from "@/components/ui/accordion";
import { motion, Variants } from "framer-motion";
import {
    IconAdvancedOCR, IconTaskExtraction, IconTimeEstimation, 
    IconFastProcessing, IconMultiFormat, IconIntuitiveUI
} from '@/components/ui/3d-icons';

// --- Constants & Data ---
const FEATURES_DATA = [ 
    { icon: IconAdvancedOCR, title: "Advanced OCR", description: "Accurately extracts text from images, PDFs, and handwritten notes.", benefits: ["Multi-language", "Handwriting", "Tables"] }, 
    { icon: IconTaskExtraction, title: "Smart Extraction", description: "AI identifies actionable tasks, deadlines, and key info.", benefits: ["Auto-detection", "Priorities", "Deadlines"] }, 
    { icon: IconTimeEstimation, title: "Time AI", description: "Predicts the time required to complete each task.", benefits: ["Predictions", "Estimates", "Learning"] },
    { icon: IconFastProcessing, title: "Lightning Fast", description: "Optimized cloud algorithms ensure results in seconds.", benefits: ["Real-time", "Batch", "Cloud"] },
    { icon: IconMultiFormat, title: "Multi-Format", description: "Handles PDFs, images, and Word docs with ease.", benefits: ["PDF", "Image", "DOCX"] },
    { icon: IconIntuitiveUI, title: "Easy UI", description: "Simple drag-and-drop design for managing tasks.", benefits: ["Drag & Drop", "Tracking", "Exports"] } 
];

const TESTIMONIALS = [ 
    { name: "Sarah J.", role: "Project Manager", content: "Clarity OCR has transformed how we process client briefs. Cuts planning time by 70%!", rating: 5 }, 
    { name: "Michael C.", role: "PhD Researcher", content: "The accuracy is phenomenal. It understands scientific papers like a human.", rating: 5 }, 
    { name: "David R.", role: "Legal Assistant", content: "Finding key dates in contracts used to take hours. Now it's instant.", rating: 5 } 
];

const FAQ_ITEMS = [ 
    { question: "What formats supported?", answer: "PDFs, JPG, PNG, WEBP, and DOCX." }, 
    { question: "Is data secure?", answer: "Yes. AES-256 encryption. Files are deleted after processing." }, 
    { question: "Can I export?", answer: "Yes, to JSON, PDF, CSV, or Notion." } 
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (user) {
        navigate('/dashboard');
    } else {
        navigate('/register');
    }
  };

  const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants: Variants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans">
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-[#0D1121]/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-bold font-sora">Clarity OCR</span>
            </Link>

            <div className="hidden md:flex items-center gap-4">
                <Button variant="ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</Button>
                <Button variant="ghost" onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}>Testimonials</Button>
                {user ? (
                    <Button onClick={() => navigate('/dashboard')} className="bg-sky-600 hover:bg-sky-700 text-white">Go to Dashboard</Button>
                ) : (
                    <>
                        <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
                        <Button onClick={() => navigate('/register')} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90">Get Started</Button>
                    </>
                )}
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
        {mobileMenuOpen && (
            <div className="md:hidden border-t p-4 space-y-2 bg-white dark:bg-[#0D1121]">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/login')}>Sign In</Button>
                <Button className="w-full" onClick={handleGetStarted}>Get Started</Button>
            </div>
        )}
      </nav>
      
      <main>
        {/* Hero */}
        <section className="relative pt-24 pb-32 text-center px-4 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-sky-100 via-transparent to-transparent dark:from-sky-900/20"></div>
          <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{duration: 0.5}}>
            <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm border-sky-500 text-sky-600 dark:text-sky-400">
               ✨ AI-Powered Task Extraction v2.0
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold font-sora tracking-tight mb-6 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
              Stop typing.<br />Start doing.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
              Transform invoices, contracts, and handwritten notes into organized, actionable checklists instantly with AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/25" onClick={handleGetStarted}>
                    Start for Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-300 dark:border-slate-700" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth'})}>
                    See How It Works
                </Button>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 bg-slate-50 dark:bg-[#111625]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-sora mb-4">One Tool, Limitless Productivity</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">Everything you need to turn chaos into clarity.</p>
                </div>
                <motion.div variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
                    {FEATURES_DATA.map((f, i) => (
                        <motion.div variants={itemVariants} key={i}>
                            <Card className="h-full hover:shadow-xl transition-all duration-300 border-none shadow-md">
                                <CardHeader>
                                    <div className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 mb-4">
                                        <f.icon className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-xl">{f.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-500 mb-4">{f.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {f.benefits.map(b => (
                                            <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12 font-sora">Trusted by Professionals</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <Card key={i} className="bg-slate-50 dark:bg-slate-900 border-none">
                            <CardContent className="pt-6">
                                <div className="flex mb-4 text-yellow-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <p className="italic text-slate-600 dark:text-slate-300 mb-6">"{t.content}"</p>
                                <div className="font-semibold">{t.name}</div>
                                <div className="text-sm text-slate-500">{t.role}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-slate-50 dark:bg-[#111625]">
             <div className="container mx-auto px-4 max-w-3xl">
                <h2 className="text-3xl font-bold text-center mb-12 font-sora">Questions?</h2>
                <Accordion type="single" collapsible>
                    {FAQ_ITEMS.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                            <AccordionTrigger>{faq.question}</AccordionTrigger>
                            <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
             </div>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} Clarity OCR. All rights reserved.
      </footer>
    </div>
  );
}