// src/pages/About.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Award, Target, Shield, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEAM_MEMBERS = [
  {
    name: "Jeevasurya Palanisamy",
    role: "Founder & Developer",
    bio: "Gmail : jeevasurya.global@gmail.com"
  },
];

function AboutPage() {
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
              <Target className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Extract What Matters</h3>
              <p>Our AI-powered technology transforms documents into actionable insights</p>
            </div>
          </div>
        </div>
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-slate-200">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Innovation</h3>
              <p className="text-slate-600 dark:text-slate-400">We push the boundaries of what's possible with AI and OCR technology.</p>
            </div>
            <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">User-Centric</h3>
              <p className="text-slate-600 dark:text-slate-400">Our users are at the heart of every decision we make and feature we build.</p>
            </div>
            <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="gradient-primary p-3 rounded-xl w-fit mx-auto mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">Security</h3>
              <p className="text-slate-600 dark:text-slate-400">We protect your data with enterprise-grade security and privacy measures.</p>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800 dark:text-slate-200">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM_MEMBERS.map((member, index) => (
              <div key={index} className="p-6 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-200">{member.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 mb-3">{member.role}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
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

export default AboutPage;