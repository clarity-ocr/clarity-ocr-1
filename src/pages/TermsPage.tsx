// src/pages/Terms.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function TermsPage() {
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
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Terms and Conditions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <Card className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
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
      
      <style>{`
        .gradient-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default TermsPage;