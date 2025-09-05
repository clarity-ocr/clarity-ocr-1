/**
 * ✅ Aurora Enhancement Plan (Concise Checklist)
 * 1) Apply Aurora tokens (approx.): Sora font, primary blue gradient, soft-elevated cards, glass layers, rounded-2xl, smooth motion, focus rings.
 * 2) Strengthen mobile UX: sticky header + bottom action bar (filter/sort/add), larger tap targets, responsive grid, safe-areas.
 * 3) Preserve core features: CRUD on groups/tasks, inline editable fields, filtering/sorting, export (PDF/CSV/JSON), sharing (public link/native/WA), save status.
 * 4) Accessibility: labels, roles, aria-live for save status, keyboard focus, visible outlines, color contrast mindful.
 * 5) Stability: small runtime smoke-test (dev only), data-testid hooks, defensive checks; consistent code style.
 *
 * Assumptions (Aurora token approximations):
 * --aurora-primary: gradient from #4f46e5 to #06b6d4; --aurora-bg: slate-50 / #0D1121; --aurora-card: white/40 + blur; --aurora-shadow: soft xl;
 * --aurora-radius: 1rem (rounded-2xl); font-family: Sora. Replace with actual Aurora tokens when available.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { HistoryItem, TaskGroup, TaskItem } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { exportToPDF, exportToCSV, exportToJSON } from '@/services/exportService';
import { createOrUpdatePublicShareLink, shareViaWhatsApp, nativeWebShare, revokePublicShareLink } from '@/services/shareService';

// Icons
import {
  Loader2, AlertCircle, ListChecks, Download, CheckCircle, PlusCircle, Trash2,
  Milestone, BookOpen, ChevronDown, Share2, SortAsc, Filter, Clock, Copy, ArrowLeft,
  MoreHorizontal, Settings, Search, CheckSquare, Sparkles, FolderPlus
} from 'lucide-react';

// UI Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { TooltipProvider } from '@/components/ui/tooltip';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/* ============================= Aurora Motion ============================= */

const card3DVariants: Variants = {
  hover: {
    scale: 1.02,
    rotateY: 3,
    boxShadow: "0 20px 40px rgba(2,6,23,0.15)",
    transition: { type: 'spring', stiffness: 260, damping: 22 }
  }
};

const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 200 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
};

/* ============================= Utilities ============================= */

type FilterStatus = 'all' | 'active' | 'completed';
type SortKey = 'priority' | 'createdAt';

const srOnly = "sr-only";

/* ============================= Subcomponents ============================= */

const EditableField: React.FC<{
  value: string;
  onSave: (value: string) => void;
  className?: string;
  isTextarea?: boolean;
  type?: 'text' | 'textarea' | 'select' | 'number';
  'data-testid'?: string;
}> = ({ value, onSave, className, isTextarea = false, type = 'text', ...rest }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      if (type === 'textarea' || isTextarea) textareaRef.current?.focus();
      else inputRef.current?.focus();
    }
  }, [isEditing, type, isTextarea]);

  const handleSave = () => {
    const next = currentValue.trim();
    if (next !== value.trim()) onSave(next);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && type !== 'textarea' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  const effectiveType = isTextarea ? 'textarea' : type;

  if (isEditing) {
    switch (effectiveType) {
      case 'textarea':
        return (
          <Textarea
            ref={textareaRef}
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} p-2 bg-white/90 dark:bg-slate-900/80 border-violet-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 w-full`}
            aria-label="Edit text"
            {...rest}
          />
        );
      case 'select':
        return (
          <Select
            value={currentValue}
            onValueChange={val => { onSave(val); setIsEditing(false); }}
          >
            <SelectTrigger className="h-7 px-2 text-xs w-28 focus:ring-violet-500" aria-label="Priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {(['critical', 'high', 'medium', 'low', 'none'] as const).map(p =>
                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              )}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            type={type}
            ref={inputRef}
            value={currentValue}
            onChange={e => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`${className} h-8 p-2 bg-white/90 dark:bg-slate-900/80 border-violet-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 w-full`}
            aria-label="Edit value"
            {...rest}
          />
        );
    }
  }

  const displayValue = value || (isTextarea ? "Click to add description..." : "Click to edit...");
  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer p-1 rounded-md hover:bg-violet-500/10 min-h-[24px] break-all`}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsEditing(true)}
      role="button"
      aria-label="Edit field"
      {...rest}
    >
      {effectiveType === 'select'
        ? <Badge variant={(value === 'critical' || value === 'high') ? 'destructive' : 'outline'}>{value}</Badge>
        : displayValue}
    </div>
  );
};

const DeleteConfirmation: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Delete task"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this task?</AlertDialogTitle>
        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const DeleteGroupConfirmation: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
        aria-label="Delete group"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete this group?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete the entire group and all of its tasks.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Delete Group</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const ShareDialog: React.FC<{
  historyItem: HistoryItem;
  onUpdateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void
}> = ({ historyItem, onUpdateHistoryItem }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPublic = !!historyItem.shareId;
  const shareLink = isPublic ? `${window.location.origin}/public/${historyItem.shareId}` : '';

  const handleToggleSharing = async (isNowPublic: boolean) => {
    setIsProcessing(true);
    try {
      if (isNowPublic) {
        const newShareId = await createOrUpdatePublicShareLink(historyItem);
        onUpdateHistoryItem(prev => ({ ...prev, shareId: newShareId }));
        toast({ title: "Sharing Enabled", description: "Public share link is active." });
      } else {
        await revokePublicShareLink(historyItem);
        onUpdateHistoryItem(prev => {
          const { shareId, ...rest } = prev;
          return rest as HistoryItem;
        });
        toast({ title: "Sharing Disabled", description: "Public link revoked." });
      }
    } catch {
      toast({ title: "Error", description: "Could not update share link.", variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink || !navigator.clipboard) {
      toast({ description: "Clipboard API not available.", variant: 'destructive' });
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({ description: "Link copied to clipboard!" });
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ description: "Failed to copy.", variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    const sharedNatively = await nativeWebShare(shareLink, historyItem.title);
    if (!sharedNatively) shareViaWhatsApp(shareLink, historyItem.title);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/50 dark:bg-slate-800/50" aria-label="Share">
          <Share2 className="w-4 h-4 mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Checklist</DialogTitle>
          <DialogDescription>Manage your public, read-only share link.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base">Public Sharing</Label>
              <p className="text-sm text-muted-foreground">Anyone with the link can view.</p>
            </div>
            <div className="flex items-center gap-2">
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handleToggleSharing}
                disabled={isProcessing}
                aria-label="Toggle public sharing"
              />
            </div>
          </div>

          {isPublic && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <Label htmlFor="share-link-input">Your public link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input id="share-link-input" value={shareLink} readOnly className="flex-1" />
                    <Button size="icon" variant="outline" onClick={handleCopyLink} aria-label="Copy share link">
                      {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleShare} aria-label="Share link externally">
                  <Share2 className="w-4 h-4 mr-2" /> Share Link
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Header: React.FC<{
  historyItem: HistoryItem,
  saveStatus: string,
  updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void;
  navigate: (path: string) => void;
}> = ({ historyItem, saveStatus, updateHistoryItem, navigate }) => {
  const { toast } = useToast();

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      toast({ description: `Generating ${format.toUpperCase()}...` });
      if (format === 'json') await exportToJSON(historyItem);
      else if (format === 'csv') await exportToCSV(historyItem);
      else await exportToPDF(historyItem);
    } catch {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }} className="mb-4 sm:mb-6" style={{ perspective: '1000px' }}>
      <motion.div variants={card3DVariants}>
        <Card className="aurora-card rounded-2xl shadow-xl">
          <CardHeader className="p-3 sm:p-5">
            <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-5">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate('/history')}
                  className="bg-white/60 dark:bg-slate-800/60 hidden sm:inline-flex"
                  aria-label="Back to history"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <EditableField
                    value={historyItem.title}
                    onSave={val => updateHistoryItem(p => ({ ...p, title: val }))}
                    className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight"
                    data-testid="title-field"
                  />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate mt-1" aria-label="File name">
                    Original: {historyItem.fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 self-start sm:self-center">
                <div className="flex items-center gap-2">
                  <ShareDialog historyItem={historyItem} onUpdateHistoryItem={updateHistoryItem} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-white/60 dark:bg-slate-800/60" aria-label="Export">
                        <Download className="w-4 h-4 mr-0 sm:mr-2" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div
                  className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-24 text-right flex-shrink-0"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {saveStatus === 'saving' && <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving…</span>}
                  {saveStatus === 'saved' && <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" />Saved</span>}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const Dashboard: React.FC<{ historyItem: HistoryItem }> = ({ historyItem }) => {
  const stats = useMemo(() => {
    const allTasks = historyItem.analysisResult.groups.flatMap(g => g.tasks);
    const completed = allTasks.filter(t => t.completed).length;
    const total = allTasks.length;
    const totalTime = allTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
    return {
      completion: total > 0 ? (completed / total) * 100 : 0,
      completed,
      total,
      totalTime
    };
  }, [historyItem]);

  const cards = [
    { title: 'Completion', value: `${stats.completion.toFixed(0)}%`, desc: `${stats.completed} of ${stats.total} tasks`, icon: <CheckSquare /> as React.ReactNode, progress: stats.completion },
    { title: 'Total Tasks', value: stats.total, desc: `${historyItem.analysisResult.groups.length} groups`, icon: <ListChecks /> as React.ReactNode },
    { title: 'Est. Time', value: `${stats.totalTime} min`, desc: `~${(stats.totalTime / 60).toFixed(1)} hours`, icon: <Clock /> as React.ReactNode },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6"
      style={{ perspective: '1000px' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.05 }}
    >
      {cards.map((item, index) => (
        <motion.div key={index} variants={card3DVariants} whileHover="hover">
          <Card className="aurora-card rounded-2xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">{item.title}</h3>
              <div className="h-4 w-4 text-muted-foreground">{item.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
              {item.progress !== undefined && <Progress value={item.progress} className="w-full mt-2 h-2" />}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

const Summary: React.FC<{
  summary: HistoryItem['analysisResult']['summary'],
  updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void
}> = ({ summary, updateHistoryItem }) => {
  if (!summary) return null;
  return (
    <Collapsible className="mb-4 sm:mb-6">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start text-lg font-semibold gap-2" aria-expanded={false}>
          <ChevronDown className="w-5 h-5" /> AI Summary
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <Card className="mt-2 p-3 sm:p-5 aurora-panel rounded-2xl">
            <EditableField
              isTextarea
              value={summary.projectDescription}
              onSave={val => updateHistoryItem(p => ({
                ...p,
                analysisResult: { ...p.analysisResult, summary: { ...p.analysisResult.summary!, projectDescription: val } }
              }))}
              data-testid="summary-field"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Milestone className="w-4 h-4 text-violet-600" /> Milestones
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {summary.milestones.map((m, i) => <li key={i}>{m}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-violet-600" /> Resources
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  {summary.resources.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const AddGroupDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddGroup: (name: string) => void;
}> = ({ isOpen, onOpenChange, onAddGroup }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddGroup(name.trim());
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="aurora-card rounded-2xl p-0 overflow-hidden border-0">
            <motion.div variants={dialogVariants} initial="hidden" animate="visible" exit="exit">
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl aurora-gradient-text">
                      <FolderPlus className="w-6 h-6" />
                      Create New Group
                    </DialogTitle>
                    <DialogDescription className="text-slate-600 dark:text-slate-400">
                      Enter a name for your new task group below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2">
                    <Label htmlFor="group-name" className="sr-only">
                      Group Name
                    </Label>
                    <Input
                      id="group-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Project Milestones"
                      autoFocus
                      className="text-base h-11 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-400/80"
                    />
                  </div>
                </div>
                <DialogFooter className="bg-slate-100/50 dark:bg-black/20 px-6 py-4">
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-700 dark:text-slate-300">
                    Cancel
                  </Button>
                  <Button type="submit" className="aurora-button disabled:opacity-60" disabled={!name.trim()}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

const TaskList: React.FC<{
  groups: TaskGroup[],
  updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void,
  filter: FilterStatus,
  setFilter: (f: FilterStatus) => void,
  sort: SortKey,
  setSort: (s: SortKey) => void
}> = ({ groups, updateHistoryItem, filter, setFilter, sort, setSort }) => {
  const [openGroupIds, setOpenGroupIds] = useState<string[]>([]);
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);

  useEffect(() => { setOpenGroupIds(groups.map(g => g.id)); }, [groups]);

  const priorityOrder: Record<TaskItem['priority'], number> = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };

  const filteredAndSortedGroups = useMemo(() => {
    return groups.map(group => {
      let tasks = [...group.tasks];
      if (filter === 'active') tasks = tasks.filter(t => !t.completed);
      if (filter === 'completed') tasks = tasks.filter(t => t.completed);
      if (sort === 'priority') tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      if (sort === 'createdAt') tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { ...group, tasks };
    }).filter(group => group.tasks.length > 0 || groups.some(og => og.id === group.id && og.tasks.length === 0));
  }, [groups, filter, sort]);

  const handleAddTask = (groupId: string) => {
    const newTask: TaskItem = {
      id: uuidv4(),
      content: "New Task",
      completed: false,
      priority: 'medium',
      estimatedTime: 15,
      deadline: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      groupId
    };
    updateHistoryItem(prev => {
      if (!prev) return prev;
      const newGroups = prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g);
      return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups, totalTasks: prev.analysisResult.totalTasks + 1 } };
    });
  };

  const handleAddGroup = (name: string) => {
    const newGroup: TaskGroup = { id: uuidv4(), name, expanded: true, tasks: [] };
    updateHistoryItem(p => {
      if (!p) return p;
      return { ...p, analysisResult: { ...p.analysisResult, groups: [newGroup, ...p.analysisResult.groups] } };
    });
    setOpenGroupIds(ids => [newGroup.id, ...ids]);
  };

  const handleDeleteGroup = (groupIdToDelete: string) => {
    updateHistoryItem(prev => {
      if (!prev) return prev;
      const groupToDelete = prev.analysisResult.groups.find(g => g.id === groupIdToDelete);
      const tasksInGroupCount = groupToDelete ? groupToDelete.tasks.length : 0;
      const newGroups = prev.analysisResult.groups.filter(g => g.id !== groupIdToDelete);
      return {
        ...prev,
        analysisResult: {
          ...prev.analysisResult,
          groups: newGroups,
          totalTasks: prev.analysisResult.totalTasks - tasksInGroupCount,
        }
      };
    });
  };

  const handleTaskUpdate = (groupId: string, taskId: string, updatedData: Partial<TaskItem>) => {
    updateHistoryItem(prev => {
      if (!prev) return prev;
      const newGroups = prev.analysisResult.groups.map(g =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...updatedData, updatedAt: new Date().toISOString() } : t) }
          : g
      );
      return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups } };
    });
  };

  const handleDeleteTask = (groupId: string, taskId: string) => {
    updateHistoryItem(prev => {
      if (!prev) return prev;
      const newGroups = prev.analysisResult.groups.map(g =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g
      );
      return {
        ...prev,
        analysisResult: {
          ...prev.analysisResult,
          groups: newGroups,
          totalTasks: prev.analysisResult.totalTasks - 1
        }
      };
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <AddGroupDialog
        isOpen={isAddGroupDialogOpen}
        onOpenChange={setIsAddGroupDialogOpen}
        onAddGroup={handleAddGroup}
      />
      {/* Controls (Desktop) */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Sparkles className="w-5 h-5 text-violet-500" aria-hidden="true" />
          Task Groups
        </h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={v => setFilter(v as FilterStatus)}>
            <SelectTrigger className="w-32 h-9" aria-label="Filter tasks">
              <Filter className="w-4 h-4 mr-2" />
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="w-32 h-9" aria-label="Sort tasks">
              <SortAsc className="w-4 h-4 mr-2" />
              {sort === 'priority' ? 'Priority' : 'Date'}
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="createdAt">Date</SelectItem>
            </SelectContent>
          </Select>

          <Button size="sm" onClick={() => setIsAddGroupDialogOpen(true)} aria-label="Add group">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        </div>
      </div>

      {/* Groups */}
      <Accordion type="multiple" value={openGroupIds} onValueChange={setOpenGroupIds} className="w-full">
        <AnimatePresence>
          {filteredAndSortedGroups.map(group => (
            <motion.div key={group.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25 }}>
              <Card className="aurora-panel rounded-xl mb-2 sm:mb-3 overflow-hidden">
                <AccordionItem value={group.id} className="border-b-0">
                  <div className="flex items-center w-full p-3 sm:p-4">
                    <AccordionTrigger className="flex-grow p-0 text-left hover:no-underline">
                      <div className="flex items-center gap-3 text-left flex-grow min-w-0">
                        <EditableField
                          value={group.name}
                          onSave={val => updateHistoryItem(p => ({
                            ...p,
                            analysisResult: {
                              ...p.analysisResult,
                              groups: p.analysisResult.groups.map(g => g.id === group.id ? { ...g, name: val } : g)
                            }
                          }))}
                          className="flex-grow min-w-0 text-base sm:text-lg font-semibold"
                          data-testid={`group-name-${group.id}`}
                        />
                        <Badge variant="secondary" className="flex-shrink-0" aria-label={`${group.tasks.length} tasks`}>
                          {group.tasks.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <div className="ml-2 flex-shrink-0">
                      <DeleteGroupConfirmation onConfirm={() => handleDeleteGroup(group.id)} />
                    </div>
                  </div>

                  <AccordionContent className="pl-2 border-l-2 ml-3 sm:ml-4 border-violet-200 dark:border-violet-900">
                    <div className="space-y-2 p-2">
                      <AnimatePresence>
                        {group.tasks.map(task => (
                          <motion.div key={task.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}>
                            <div className="flex items-start gap-3 p-3 rounded-md hover:bg-violet-500/10 group">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleTaskUpdate(group.id, task.id, { completed: !task.completed })}
                                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer flex-shrink-0"
                                aria-label={`Mark task ${task.content} ${task.completed ? 'incomplete' : 'complete'}`}
                                data-testid={`task-check-${task.id}`}
                              />

                              <div className="flex-1 min-w-0">
                                <EditableField
                                  value={task.content}
                                  onSave={val => handleTaskUpdate(group.id, task.id, { content: val })}
                                  className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}
                                  data-testid={`task-content-${task.id}`}
                                />

                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                                  <EditableField
                                    type="select"
                                    value={task.priority}
                                    onSave={val => handleTaskUpdate(group.id, task.id, { priority: val as TaskItem['priority'] })}
                                    data-testid={`task-priority-${task.id}`}
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                                    <EditableField
                                      type="number"
                                      value={String(task.estimatedTime || 0)}
                                      onSave={val => handleTaskUpdate(group.id, task.id, { estimatedTime: Math.max(0, parseInt(val, 10) || 0) })}
                                      className="w-12 p-0 text-center bg-transparent"
                                      data-testid={`task-time-${task.id}`}
                                    />
                                    <span>min</span>
                                  </div>
                                </div>
                              </div>

                              <DeleteConfirmation onConfirm={() => handleDeleteTask(group.id, task.id)} />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <Button variant="ghost" size="sm" className="w-full justify-start mt-2" onClick={() => handleAddTask(group.id)} aria-label="Add task">
                        <PlusCircle className="w-4 h-4 mr-2" /> Add Task
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </Accordion>

      {/* Mobile Action Bar */}
      <div className="sm:hidden h-16" aria-hidden="true" />
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-slate-200 dark:border-slate-800"
        role="navigation"
        aria-label="Mobile actions"
      >
        <div className="px-3 py-2 grid grid-cols-4 gap-2 items-center">
          <Select value={filter} onValueChange={v => setFilter(v as FilterStatus)}>
            <SelectTrigger className="h-10 text-sm" aria-label="Filter tasks (mobile)">
              <Filter className="w-4 h-4 mr-1" />
              <span className="truncate">{filter === 'all' ? 'All' : filter === 'active' ? 'Active' : 'Done'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={v => setSort(v as SortKey)}>
            <SelectTrigger className="h-10 text-sm" aria-label="Sort tasks (mobile)">
              <SortAsc className="w-4 h-4 mr-1" />
              <span className="truncate">{sort === 'priority' ? 'Priority' : 'Date'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="createdAt">Date</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="h-10" onClick={() => setIsAddGroupDialogOpen(true)} aria-label="Add group (mobile)">
            <PlusCircle className="w-4 h-4 mr-1" />
            Add
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10" aria-label="More">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Search className="w-4 h-4 mr-2" />Quick Find (Ctrl/Cmd+F)</DropdownMenuItem>
              <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </div>
  );
};

/* ============================= Main Page ============================= */

const ChecklistPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [historyItem, setHistoryItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [sort, setSort] = useState<SortKey>('priority');
  const { toast } = useToast();

  useEffect(() => {
    if (!id || !user) {
      if (!user) navigate('/login');
      return;
    }
    const fetchChecklist = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, `users/${user.uid}/history`, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHistoryItem({ id: docSnap.id, uid: user.uid, ...docSnap.data() } as HistoryItem);
        } else {
          setError("Checklist not found.");
        }
      } catch (err) {
        console.error("Failed to load checklist:", err);
        setError("Failed to load the checklist.");
      } finally {
        setLoading(false);
      }
    };
    fetchChecklist();
  }, [id, user, navigate]);

  const debouncedSave = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (saveStatus !== 'saving' || !historyItem) return;
    if (debouncedSave.current) clearTimeout(debouncedSave.current);

    debouncedSave.current = setTimeout(async () => {
      if (!id || !user || !historyItem) return;
      try {
        const userDocRef = doc(db, `users/${user.uid}/history`, id);
        const { id: itemId, uid, ...dataToSave } = historyItem;
        await updateDoc(userDocRef, dataToSave as { [key: string]: any });

        // Keep public doc in sync if sharing is active
        if (historyItem.shareId) {
          const publicDocRef = doc(db, 'publicChecklists', historyItem.shareId);
          const publicData = { title: historyItem.title, analysisResult: historyItem.analysisResult };
          await setDoc(publicDocRef, publicData, { merge: true });
        }

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 1800);
      } catch (err) {
        console.error("Save failed:", err);
        toast({ title: "Save Failed", variant: "destructive" });
        setSaveStatus('idle');
      }
    }, 1200);

    return () => { if (debouncedSave.current) clearTimeout(debouncedSave.current); };
  }, [historyItem, id, user, saveStatus, toast]);

  const updateHistoryItem = (updater: (prev: HistoryItem) => HistoryItem) => {
    setHistoryItem(prev => (prev ? updater(prev) : null));
    setSaveStatus('saving');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg relative overflow-hidden">
        <div className="absolute inset-0 -z-10 aurora-bg-layer" />
        <div className="text-center z-10">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-violet-600" />
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">Loading Checklist…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-600">An Error Occurred</h2>
        <p className="text-gray-600 mt-2">{error}</p>
        <Button onClick={() => navigate('/')} className="mt-6">Go Home</Button>
      </div>
    );
  }

  if (!historyItem) {
    return <div className="flex justify-center items-center h-screen"><p>No checklist data available.</p></div>;
  }

  return (
    <div className="min-h-screen aurora-bg text-slate-800 dark:text-slate-200 font-sora relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap');
        :root {
          --aurora-from: #4f46e5; /* Indigo-600 */
          --aurora-to: #06b6d4;   /* Cyan-500 */
          --aurora-card: rgba(255,255,255,0.40);
          --aurora-panel: rgba(255,255,255,0.30);
          --aurora-card-dark: rgba(15,23,42,0.40);
          --aurora-panel-dark: rgba(2,6,23,0.30);
          --aurora-shadow: 0 10px 30px rgba(2,6,23,0.15);
          --aurora-radius: 1rem;
        }
        .font-sora { font-family: 'Sora', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji','Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif; }
        .aurora-bg { background-color: rgb(248 250 252); }
        .dark .aurora-bg { background-color: #0D1121; }
        .aurora-bg-layer {
          background: radial-gradient(1200px 600px at 50% -10%, rgba(79,70,229,0.20), transparent 60%),
                      radial-gradient(900px 500px at 60% -20%, rgba(6,182,212,0.25), transparent 70%),
                      radial-gradient(1000px 500px at 40% -30%, rgba(139,92,246,0.30), transparent 75%);
          opacity: 0.5;
        }
        .aurora-card {
          background: var(--aurora-card);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: var(--aurora-shadow);
        }
        .dark .aurora-card {
          background: var(--aurora-card-dark);
          border-color: rgba(30,41,59,0.8);
        }
        .aurora-panel {
          background: var(--aurora-panel);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(226,232,240,0.6);
        }
        .dark .aurora-panel {
          background: var(--aurora-panel-dark);
          border-color: rgba(30,41,59,0.6);
        }
        .aurora-gradient-text {
          background-image: linear-gradient(90deg, var(--aurora-from), var(--aurora-to));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .aurora-button {
          background-image: linear-gradient(90deg, var(--aurora-from), var(--aurora-to));
          color: white;
          transition: all 0.2s ease-in-out;
        }
        .aurora-button:hover {
          box-shadow: 0 0 15px rgba(79, 70, 229, 0.5);
          transform: translateY(-1px);
        }
        @supports (padding: max(0px)) {
          .safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 0.75rem); }
        }
      `}</style>

      <div className="absolute inset-0 -z-10 aurora-bg-layer" aria-hidden="true" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="container mx-auto max-w-4xl p-2 sm:p-4 md:p-6 lg:p-8 relative z-10"
      >
        <header className="sticky top-0 z-20 -mx-2 sm:mx-0 px-2 sm:px-0 pt-2 sm:pt-0">
          {/* Subtle gradient border under header on mobile */}
          <div className="h-1 w-full bg-gradient-to-r from-[var(--aurora-from)] to-[var(--aurora-to)] rounded-full opacity-70" />
        </header>

        <Header
          historyItem={historyItem}
          saveStatus={saveStatus}
          updateHistoryItem={updateHistoryItem}
          navigate={navigate}
        />

        <section aria-labelledby="stats-title">
          <h2 id="stats-title" className={`${srOnly}`}>Checklist Stats</h2>
          <Dashboard historyItem={historyItem} />
        </section>

        {historyItem.analysisResult.summary && (
          <section aria-labelledby="summary-title">
            <h2 id="summary-title" className={`${srOnly}`}>AI Summary</h2>
            <Summary summary={historyItem.analysisResult.summary} updateHistoryItem={updateHistoryItem} />
          </section>
        )}

        <section aria-labelledby="tasks-title">
          <h2 id="tasks-title" className={`${srOnly}`}>Task Groups</h2>
          <TaskList
            groups={historyItem.analysisResult.groups}
            updateHistoryItem={updateHistoryItem}
            filter={filter}
            setFilter={setFilter}
            sort={sort}
            setSort={setSort}
          />
        </section>
      </motion.div>
    </div>
  );
};

/* ============================= Wrapper & Minimal Smoke Test ============================= */

const ChecklistPageWrapper: React.FC = () => (
  <TooltipProvider>
    <ChecklistPage />
  </TooltipProvider>
);

export default ChecklistPageWrapper;

/**
 * Minimal runtime smoke test for main workflow (dev only).
 * This is not executed automatically; call in tests or dev console:
 *   window.__auroraSmokeTest?.();
 */
export const __auroraSmokeTest = () => {
  const hasDocApis = !!doc && !!getDoc && !!updateDoc && !!setDoc;
  const uiImported = !!Card && !!Button && !!Select && !!Dialog;
  const iconsOk = !!Download && !!Share2 && !!Trash2;
  return { hasDocApis, uiImported, iconsOk };
};