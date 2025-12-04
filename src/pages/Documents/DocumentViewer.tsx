import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getDocument, updateDocumentMetadata } from '@/services/documentService';
import { ClarityDocument } from '@/types/schema';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doc, setDoc] = useState<ClarityDocument | null>(null);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchDoc = async () => {
      if (!id) return;
      const data = await getDocument(id);
      if (data) {
        setDoc(data);
        setEditedText(data.extractedText || '');
      } else {
        toast({ title: "Error", description: "Document not found", variant: "destructive" });
        navigate('/documents');
      }
      setLoading(false);
    };
    fetchDoc();
  }, [id, navigate, toast]);

  const handleSave = async () => {
    if (!doc || !id) return;
    setSaving(true);
    try {
      await updateDocumentMetadata(id, { extractedText: editedText });
      setDoc({ ...doc, extractedText: editedText });
      toast({ title: "Saved", description: "Changes saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([editedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc?.name || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0D1121]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0D1121] overflow-hidden">
      {/* Toolbar */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
              {doc.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
               <span className="uppercase font-bold text-sky-600">{doc.processingStatus}</span>
               <span>•</span>
               <span>{doc.ocrConfidence}% Confidence</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadText} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={saving || editedText === doc.extractedText}
            className="bg-sky-600 hover:bg-sky-700 text-white min-w-[100px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Document Preview */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-4 overflow-auto flex items-center justify-center relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button variant="secondary" size="icon" onClick={() => setZoom(z => Math.max(z - 10, 50))}>-</Button>
            <span className="bg-white dark:bg-slate-800 px-3 py-2 rounded-md text-sm font-medium shadow-sm">{zoom}%</span>
            <Button variant="secondary" size="icon" onClick={() => setZoom(z => Math.min(z + 10, 200))}>+</Button>
          </div>

          <div 
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 shadow-2xl"
          >
            {doc.fileType === 'application/pdf' ? (
              <iframe 
                src={`${doc.fileUrl}#toolbar=0&navpanes=0`} 
                className="w-[600px] h-[800px] bg-white"
                title="PDF Preview"
              />
            ) : (
              <img 
                src={doc.fileUrl} 
                alt="Document" 
                className="max-w-[600px] object-contain bg-white"
              />
            )}
          </div>
        </div>

        {/* Right: Extracted Text */}
        <div className="flex-1 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Extracted Text
            </h3>
            <span className="text-xs text-slate-400">Editable</span>
          </div>
          <Textarea 
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="flex-1 resize-none border-none focus-visible:ring-0 p-6 text-base leading-relaxed font-mono text-slate-800 dark:text-slate-300 bg-transparent"
            spellCheck={false}
          />
        </div>

      </div>
    </div>
  );
}