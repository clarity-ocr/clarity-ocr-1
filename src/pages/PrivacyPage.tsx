// src/pages/Privacy.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Lock, Shield, Database, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
        <Card className="p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
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
      
      <style jsx>{`
        .gradient-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
}

export default PrivacyPage;