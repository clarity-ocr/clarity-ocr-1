import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  MoreVertical, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Eye,
  Plus,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getUserDocuments, deleteDocument } from '@/services/documentService';
import { ClarityDocument, ProcessingStatus } from '@/types/schema';

// Status Badge Component
const StatusBadge = ({ status }: { status: ProcessingStatus }) => {
  const styles = {
    queued: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
    extracting_tasks: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const labels = {
    queued: 'Queued',
    processing: 'OCR Scanning',
    extracting_tasks: 'AI Extraction',
    completed: 'Ready',
    error: 'Failed',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default function DocumentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [docs, setDocs] = useState<ClarityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load Docs
  const loadDocs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserDocuments(user.uid);
      setDocs(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load documents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [user]);

  // Handle Delete
  const handleDelete = async (doc: ClarityDocument) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await deleteDocument(doc);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
      toast({ title: "Deleted", description: "Document removed successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Could not delete document", variant: "destructive" });
    }
  };

  // Filter Logic
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.extractedText?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.processingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-[#0D1121]">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1121] p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and organize your scanned files.</p>
        </div>
        <Button onClick={() => navigate('/upload')} className="bg-sky-600 hover:bg-sky-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Upload New
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search documents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="w-4 h-4 mr-2" /> Filter: {statusFilter === 'all' ? 'All Status' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('processing')}>Processing</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('error')}>Failed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Document List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No documents found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your filters or upload a new file.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Icon & Name */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate cursor-pointer hover:text-sky-500" onClick={() => navigate(`/documents/${doc.id}`)}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>{doc.createdAt ? format(doc.createdAt.toDate(), 'MMM d, yyyy') : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                {/* Badges & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 mt-2 md:mt-0">
                  <StatusBadge status={doc.processingStatus} />
                  
                  {doc.ocrConfidence > 0 && (
                    <Badge variant="outline" className={`${doc.ocrConfidence > 80 ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700'} hidden sm:flex`}>
                      {doc.ocrConfidence}% Conf.
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/documents/${doc.id}`)}>
                      <Eye className="w-4 h-4 text-slate-500 hover:text-sky-600" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/documents/${doc.id}`)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                          <Download className="w-4 h-4 mr-2" /> Download Original
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(doc)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}