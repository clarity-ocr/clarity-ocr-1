import { useState } from 'react';
import { Eye, Sparkles, Zap, FileText, Target, Clock, Menu, X, FileImage, File, User, Info, Shield, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { ChecklistPage } from '@/pages/Checklist';
import { analyzeDocument } from '@/services/aiAnalysis';
import { AnalysisResult } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { useNavigate } from 'react-router-dom';

// Page Components
const FeaturesPage = ({ onBack }: { onBack: () => void }) => {
  const features = [
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
                onClick={onBack}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
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
          {features.map((feature, index) => (
            <Card key={index} className="h-full overflow-hidden border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
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
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const AboutPage = ({ onBack }: { onBack: () => void }) => {
  const team = [
    {
      name: "Jeevasurya Palanisamy",
      role: "Founder & Developer",
      bio: "Gmail : jeevasurya.global@gmail.com"
    },
  ];
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
                onClick={onBack}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
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
            About Clarity OCR
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            We're passionate about transforming how businesses process documents with cutting-edge AI technology.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-200">Our Mission</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              At Clarity OCR, we believe that document processing should be intelligent, efficient, and accessible to everyone. Our mission is to eliminate manual data entry and unlock the valuable information trapped in documents.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Founded in 2025, we've helped thousands of organizations streamline their workflows with our advanced OCR technology. From small businesses to large enterprises, our solutions adapt to your unique needs.
            </p>
          </div>
          <div className="gradient-primary p-8 rounded-2xl shadow-xl">
            <div className="text-white text-center">
              <Eye className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Extract What Matters</h3>
              <p>Our AI-powered technology transforms documents into actionable insights</p>
            </div>
          </div>
        </div>
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-slate-200">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Innovation</h3>
              <p className="text-slate-600 dark:text-slate-400">We push the boundaries of what's possible with AI and OCR technology.</p>
            </Card>
            <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">User-Centric</h3>
              <p className="text-slate-600 dark:text-slate-400">Our users are at the heart of every decision we make and feature we build.</p>
            </Card>
            <Card className="p-6 text-center border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Security</h3>
              <p className="text-slate-600 dark:text-slate-400">We protect your data with enterprise-grade security and privacy measures.</p>
            </Card>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-slate-200">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="p-6 text-center border-slate-200 dark:border-slate-700">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-200">{member.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 mb-3">{member.role}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TermsPage = ({ onBack }: { onBack: () => void }) => {
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
                onClick={onBack}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <Card className="p-8 border-slate-200 dark:border-slate-700">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">1. Acceptance of Terms</h2>
              <p className="text-slate-600 dark:text-slate-400">
                By accessing and using Clarity OCR ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using this particular service, you shall be subject to any posted guidelines or rules applicable to such services.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">2. Use License</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Permission is granted to temporarily download one copy of the materials on Clarity OCR's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software contained on Clarity OCR</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
                <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">3. Disclaimer</h2>
              <p className="text-slate-600 dark:text-slate-400">
                The materials on Clarity OCR's website are provided on an 'as is' basis. Clarity OCR makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">4. Limitations</h2>
              <p className="text-slate-600 dark:text-slate-400">
                In no event shall Clarity OCR or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Clarity OCR's website.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">5. Accuracy of Materials</h2>
              <p className="text-slate-600 dark:text-slate-400">
                The materials appearing on Clarity OCR's website could include technical, typographical, or photographic errors. Clarity OCR does not warrant that any of the materials on its website are accurate, complete, or current. Clarity OCR may make changes to the materials contained on its website at any time without notice.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">6. Links</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Clarity OCR has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Clarity OCR of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">7. Modifications</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Clarity OCR may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">8. Governing Law</h2>
              <p className="text-slate-600 dark:text-slate-400">
                These terms and conditions are governed by and construed in accordance with the laws of [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts in that State or Location.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

const PrivacyPage = ({ onBack }: { onBack: () => void }) => {
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
                onClick={onBack}
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <Card className="p-8 border-slate-200 dark:border-slate-700">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Information We Collect</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                We collect several types of information from and about users of our Service, including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                <li><strong>Personal Identifiable Information:</strong> Name, email address, and other contact information</li>
                <li><strong>Usage Data:</strong> Information about how you use our Service, such as features accessed, documents processed, and time spent</li>
                <li><strong>Document Content:</strong> The content of documents you upload for processing, which is temporarily stored during analysis</li>
                <li><strong>Device Information:</strong> Information about the device you use to access our Service</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">How We Use Your Information</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process documents and extract information as requested</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send you technical notices and support messages</li>
                <li>Monitor and analyze usage trends and preferences</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Data Security</h2>
              <p className="text-slate-600 dark:text-slate-400">
                We value your trust in providing us your personal information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Data Retention</h2>
              <p className="text-slate-600 dark:text-slate-400">
                We will retain your document content only as long as necessary for the purpose of processing your request. After processing is complete, document content is automatically deleted from our servers. Usage and device information is retained for analysis purposes and to improve our Service.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Third-Party Services</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Our Service may contain links to third-party web sites or services that are not owned or controlled by Clarity OCR. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party web sites or services.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Children's Privacy</h2>
              <p className="text-slate-600 dark:text-slate-400">
                Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Changes to This Privacy Policy</h2>
              <p className="text-slate-600 dark:text-slate-400">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Contact Us</h2>
              <p className="text-slate-600 dark:text-slate-400">
                If you have any questions about this Privacy Policy, please contact us at privacy@clarityocr.com.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentView, setCurrentView] = useState<'upload' | 'checklist' | 'features' | 'about' | 'terms' | 'privacy'>('upload');
  const [progress, setProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle logout function
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
        duration: 3000
      });
      
      // Redirect to login page
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

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

  const navigateTo = (page: 'upload' | 'features' | 'about' | 'terms' | 'privacy') => {
    setCurrentView(page);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Enhanced AI features
  const aiFeatures = [
    {
      icon: Eye,
      title: "Advanced OCR",
      description: "State-of-the-art text recognition for any document type"
    },
    {
      icon: Target,
      title: "Smart Analysis",
      description: "AI-powered content understanding and task extraction"
    },
    {
      icon: Clock,
      title: "Time Estimation",
      description: "ML-powered duration prediction for each task"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Instant results with parallel processing"
    }
  ];

  // Render the appropriate page based on currentView
  if (currentView === 'checklist' && analysisResult) {
    return (
      <ChecklistPage 
        analysisResult={analysisResult}
        onBack={handleBackToUpload}
      />
    );
  }
  if (currentView === 'features') {
    return <FeaturesPage onBack={() => navigateTo('upload')} />;
  }
  if (currentView === 'about') {
    return <AboutPage onBack={() => navigateTo('upload')} />;
  }
  if (currentView === 'terms') {
    return <TermsPage onBack={() => navigateTo('upload')} />;
  }
  if (currentView === 'privacy') {
    return <PrivacyPage onBack={() => navigateTo('upload')} />;
  }

  // Main upload page
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Clarity OCR
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Extract What Matters
                </p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigateTo('features')}
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigateTo('about')}
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigateTo('terms')}
              >
                Terms
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => navigateTo('privacy')}
              >
                Privacy
              </Button>
              
              {/* Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigateTo('features')}>
                Features
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigateTo('about')}>
                About
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigateTo('terms')}>
                Terms
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => navigateTo('privacy')}>
                Privacy
              </Button>
              
              {/* Mobile Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
      <div className="container mx-auto px-4 py-8 md:py-16 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
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
            Extract What Matters
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto animate-slide-up animation-delay-200">
            Clarity OCR transforms any document into actionable insights. 
            Upload PDFs, images, or paste text to extract tasks with precision.
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
        
        {/* Feature Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          {aiFeatures.map((feature, index) => (
            <div
              key={index}
              className="h-full transition-all duration-500"
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                transform: hoveredFeature === index ? 'translateY(-8px)' : 'translateY(0)',
                zIndex: hoveredFeature === index ? 10 : 1
              }}
            >
              <Card className={`h-full transition-all duration-500 border-slate-200 dark:border-slate-700 ${
                hoveredFeature === index 
                  ? 'shadow-xl border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-slate-700' 
                  : 'shadow-md hover:shadow-lg'
              }`}>
                <div className="p-4 md:p-6">
                  <div className={`gradient-primary p-3 rounded-xl w-fit mb-4 transition-transform duration-300 ${
                    hoveredFeature === index ? 'scale-110 rotate-3' : ''
                  }`}>
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-base md:text-lg mb-2 text-slate-800 dark:text-slate-200">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Upload Section */}
        <div className="max-w-4xl mx-auto animate-fade-in animation-delay-600">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Get Started
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
              Upload your document or paste content to begin AI analysis
            </p>
          </div>
          
          <div className="transition-all duration-300 hover:scale-[1.02]">
            <FileUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} progress={progress} />
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/icon.png" alt="Clarity OCR Logo" className="h-8 w-8 rounded-lg" />
              <div>
                <h3 className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Clarity OCR
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Extract What Matters</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <button 
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={() => navigateTo('features')}
              >
                Features
              </button>
              <button 
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={() => navigateTo('about')}
              >
                About
              </button>
              <button 
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={() => navigateTo('terms')}
              >
                Terms
              </button>
              <button 
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                onClick={() => navigateTo('privacy')}
              >
                Privacy
              </button>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Clarity OCR. All rights reserved.
            </div>
          </div>
        </footer>
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
};

export default Index;