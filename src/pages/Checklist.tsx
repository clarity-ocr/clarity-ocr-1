import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// ✅ FIXED: Correct import path for firestore
import { doc, getDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '@/firebase';
import { useAuth, AuthUser } from '@/contexts/AuthContext';
import { HistoryItem, TaskGroup, TaskItem } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToPDF, exportToCSV, exportToJSON } from '@/services/exportService';
import { createPublicShareLink, shareViaWhatsApp } from '@/services/shareService';

// Icons
import { Loader2, AlertCircle, FileText, ListChecks, Download, CheckCircle, PlusCircle, Trash2, Milestone, BookOpen, ChevronDown, Share2, SortAsc, Filter, Clock, Copy, PartyPopper, Lock } from 'lucide-react';

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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types
type FilterStatus = 'all' | 'active' | 'completed';
type SortKey = 'priority' | 'createdAt';

// ===================================================================================
// --- SUB-COMPONENTS (Defined first to avoid "Cannot find name" errors) ---
// ===================================================================================

const EditableField: React.FC<{ value: string; onSave: (value: string) => void; className?: string; isTextarea?: boolean; type?: 'text' | 'textarea' | 'select'; }> = ({ value, onSave, className, isTextarea = false, type = 'text' }) => {
    const [isEditing, setIsEditing] = useState(false); const [currentValue, setCurrentValue] = useState(value); const inputRef = useRef<HTMLInputElement>(null); const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => { if (isEditing) { if (type === 'textarea' || isTextarea) textareaRef.current?.focus(); else inputRef.current?.focus(); } }, [isEditing, type, isTextarea]);
    const handleSave = () => { if (currentValue.trim() !== value.trim()) onSave(currentValue.trim()); setIsEditing(false); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => { if (e.key === 'Enter' && type !== 'textarea' && !e.nativeEvent.isComposing) handleSave(); if (e.key === 'Escape') { setCurrentValue(value); setIsEditing(false); } };
    const effectiveType = isTextarea ? 'textarea' : type;
    if (isEditing) { switch (effectiveType) { case 'textarea': return <Textarea ref={textareaRef} value={currentValue} onChange={e => setCurrentValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${className} p-1 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full`} />; case 'select': return ( <Select value={currentValue} onValueChange={val => { onSave(val); setIsEditing(false); }}><SelectTrigger className="h-6 px-2 text-xs w-28 focus:ring-purple-500"><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>{(['critical', 'high', 'medium', 'low', 'none'] as const).map(p => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select> ); default: return <Input ref={inputRef} value={currentValue} onChange={e => setCurrentValue(e.target.value)} onBlur={handleSave} onKeyDown={handleKeyDown} className={`${className} h-auto p-1 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full`} />; } }
    const displayValue = value || (isTextarea ? "Click to add description..." : "Click to edit...");
    return ( <div onClick={() => setIsEditing(true)} className={`${className} cursor-pointer p-1 rounded-md hover:bg-purple-50 min-h-[24px]`}>{effectiveType === 'select' ? <Badge variant={currentValue === 'critical' || currentValue === 'high' ? 'destructive' : 'outline'}>{currentValue}</Badge> : displayValue}</div> );
};

const DeleteConfirmation: React.FC<{onConfirm: () => void}> = ({ onConfirm }) => (<AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4 text-red-500"/></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the task.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onConfirm}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>);

const ShareDialog: React.FC<{ isPro: boolean, historyItem: HistoryItem, onUpdateShareId: (shareId: string) => void }> = ({ isPro, historyItem, onUpdateShareId }) => { const { toast } = useToast(); const navigate = useNavigate(); const [isSharing, setIsSharing] = useState(false); const [shareLink, setShareLink] = useState(''); useEffect(() => { if (historyItem.shareId) { setShareLink(`${window.location.origin}/public/${historyItem.shareId}`); } }, [historyItem.shareId]); const handleCreateLink = async () => { setIsSharing(true); try { const newShareId = await createPublicShareLink(historyItem); const newLink = `${window.location.origin}/public/${newShareId}`; setShareLink(newLink); onUpdateShareId(newShareId); toast({ title: "Success!", description: "Your public share link has been created." }); } catch (error) { toast({ title: "Error", variant: 'destructive' }); } finally { setIsSharing(false); } }; const handleCopyLink = async () => { if (!shareLink) return; try { await navigator.clipboard.writeText(shareLink); toast({ description: "Link copied to clipboard!" }); } catch (err) { toast({ description: "Failed to copy link.", variant: 'destructive' }); } }; return ( <Dialog><TooltipProvider><Tooltip><TooltipTrigger asChild><DialogTrigger asChild><Button variant="outline" size="sm" disabled={!isPro}><Share2 className="w-4 h-4 mr-0 sm:mr-2" /><span className="hidden sm:inline">Share</span>{!isPro && <Lock className="w-3 h-3 ml-2"/>}</Button></DialogTrigger></TooltipTrigger>{!isPro && <TooltipContent><p>Upgrade to Pro to share checklists. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pricing')}>Upgrade now</Button></p></TooltipContent>}</Tooltip></TooltipProvider><DialogContent><DialogHeader><DialogTitle>Share Checklist</DialogTitle><DialogDescription>Create a public, read-only link to share with others.</DialogDescription></DialogHeader><div className="space-y-4 py-4">{shareLink ? (<div className="space-y-3"><p className="text-sm font-medium">Your public link is ready:</p><div className="flex items-center gap-2"><Input value={shareLink} readOnly className="flex-1" /><Button size="icon" onClick={handleCopyLink}><Copy className="w-4 h-4" /></Button></div><Button variant="ghost" onClick={() => shareViaWhatsApp(shareLink, historyItem.title)}>Share via WhatsApp</Button></div>) : (<div className="text-center"><p className="mb-4">This checklist is currently private.</p><Button onClick={handleCreateLink} disabled={isSharing}>{isSharing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PartyPopper className="w-4 h-4 mr-2" />} Make Public & Get Link</Button></div>)}</div></DialogContent></Dialog> ); };

const Header: React.FC<{ user: AuthUser | null, historyItem: HistoryItem, saveStatus: string, updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void }> = ({ user, historyItem, saveStatus, updateHistoryItem }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    // ✅ FIXED: Type check includes all valid paid roles
    const isPro = user?.stripeRole === 'pro' || user?.stripeRole === 'business';

    const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
        if (!isPro && (format === 'csv' || format === 'pdf')) {
            toast({ title: "Upgrade to Pro", description: "PDF and CSV exports are a Pro feature.", action: <Button onClick={() => navigate('/pricing')}>Upgrade</Button> });
            return;
        }
        try {
            toast({ description: `Exporting to ${format.toUpperCase()}...` });
            if (format === 'json') await exportToJSON(historyItem);
            else if (format === 'csv') await exportToCSV(historyItem);
            else if (format === 'pdf') await exportToPDF(historyItem);
        } catch (error) {
            toast({ title: "Export Failed", variant: "destructive" });
        }
    };

    return (
        <motion.div whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 300 }}>
            <Card className="mb-6 shadow-lg overflow-hidden">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                                <FileText className="w-7 h-7 mt-1 text-purple-600 flex-shrink-0" />
                                <EditableField value={historyItem.title} onSave={val => updateHistoryItem(p => ({ ...p, title: val }))} className="text-2xl md:text-3xl font-bold tracking-tight" />
                            </div>
                            <p className="text-sm text-gray-500 ml-10 truncate">Original: {historyItem.fileName}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 self-start sm:self-center">
                            <ShareDialog isPro={isPro} historyItem={historyItem} onUpdateShareId={(shareId) => updateHistoryItem(p => ({ ...p, shareId }))} />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-0 sm:mr-2" /><span className="hidden sm:inline">Export</span></Button></DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleExport('json')}>JSON</DropdownMenuItem>
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><DropdownMenuItem disabled={!isPro} onClick={() => handleExport('pdf')}>PDF {!isPro && <Lock className="w-3 h-3 ml-2"/>}</DropdownMenuItem></TooltipTrigger>{!isPro && <TooltipContent><p>Upgrade to Pro to export as PDF</p></TooltipContent>}</Tooltip></TooltipProvider>
                                    <TooltipProvider><Tooltip><TooltipTrigger asChild><DropdownMenuItem disabled={!isPro} onClick={() => handleExport('csv')}>CSV {!isPro && <Lock className="w-3 h-3 ml-2"/>}</DropdownMenuItem></TooltipTrigger>{!isPro && <TooltipContent><p>Upgrade to Pro to export as CSV</p></TooltipContent>}</Tooltip></TooltipProvider>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="text-sm text-gray-500 w-20 text-right">
                                {saveStatus === 'saving' && <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Saving...</span>}
                                {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3"/>Saved</span>}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </motion.div>
    );
};

const Dashboard: React.FC<{ historyItem: HistoryItem }> = ({ historyItem }) => {
    const stats = useMemo(() => {
        const allTasks = historyItem.analysisResult.groups.flatMap(g => g.tasks);
        const completed = allTasks.filter(t => t.completed).length;
        const total = allTasks.length;
        const totalTime = allTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
        return { completion: total > 0 ? (completed / total) * 100 : 0, completed, total, totalTime };
    }, [historyItem]);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><h3 className="text-sm font-medium">Completion</h3><CheckCircle className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.completion.toFixed(0)}%</div><p className="text-xs text-muted-foreground">{stats.completed} of {stats.total} tasks</p><Progress value={stats.completion} className="w-full mt-2 h-2" /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><h3 className="text-sm font-medium">Total Tasks</h3><ListChecks className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">{historyItem.analysisResult.groups.length} groups</p></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><h3 className="text-sm font-medium">Est. Time</h3><Clock className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalTime} min</div><p className="text-xs text-muted-foreground">~{(stats.totalTime / 60).toFixed(1)} hours</p></CardContent></Card>
        </div>
    );
};

const Summary: React.FC<{ summary: HistoryItem['analysisResult']['summary'], updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void }> = ({ summary, updateHistoryItem }) => {
    if (!summary) return null;
    return (
      <Collapsible className="mb-6"><CollapsibleTrigger asChild><Button variant="ghost" className="w-full justify-start text-lg font-semibold gap-2"><ChevronDown className="w-5 h-5"/> AI Summary</Button></CollapsibleTrigger><CollapsibleContent asChild><motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><Card className="mt-2 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50"><EditableField isTextarea value={summary.projectDescription} onSave={val => updateHistoryItem(p => ({...p, analysisResult: {...p.analysisResult, summary: {...p.analysisResult.summary!, projectDescription: val}} }))} /><div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"><div><h4 className="font-semibold flex items-center gap-2 mb-2"><Milestone className="w-4 h-4 text-purple-600"/>Milestones</h4><ul className="list-disc list-inside text-sm text-gray-700 space-y-1">{summary.milestones.map((m, i) => <li key={i}>{m}</li>)}</ul></div><div><h4 className="font-semibold flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-purple-600"/>Resources</h4><ul className="list-disc list-inside text-sm text-gray-700 space-y-1">{summary.resources.map((r, i) => <li key={i}>{r}</li>)}</ul></div></div></Card></motion.div></CollapsibleContent></Collapsible>
    );
};

const TaskList: React.FC<{ groups: TaskGroup[], updateHistoryItem: (updater: (prev: HistoryItem) => HistoryItem) => void, filter: FilterStatus, setFilter: (f: FilterStatus) => void, sort: SortKey, setSort: (s: SortKey) => void }> = ({ groups, updateHistoryItem, filter, setFilter, sort, setSort }) => {
    const priorityOrder: Record<TaskItem['priority'], number> = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };
    const filteredAndSortedGroups = useMemo(() => groups.map(group => { let tasks = [...group.tasks]; if (filter === 'active') tasks = tasks.filter(t => !t.completed); if (filter === 'completed') tasks = tasks.filter(t => t.completed); if (sort === 'priority') tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]); if (sort === 'createdAt') tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); return { ...group, tasks }; }).filter(group => group.tasks.length > 0), [groups, filter, sort]);
    const handleAddTask = (groupId: string) => { const newTask: TaskItem = { id: uuidv4(), content: "New Task", completed: false, priority: 'medium', estimatedTime: null, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), groupId }; updateHistoryItem(prev => { if(!prev) return prev; const newGroups = prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: [...g.tasks, newTask] } : g); return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups, totalTasks: prev.analysisResult.totalTasks + 1 } }; }); };
    const handleAddGroup = () => { const newGroup: TaskGroup = { id: uuidv4(), name: "New Group", expanded: true, tasks: [] }; updateHistoryItem(p => { if(!p) return p; return { ...p, analysisResult: { ...p.analysisResult, groups: [...p.analysisResult.groups, newGroup] } }; }); };
    const handleTaskUpdate = (groupId: string, taskId: string, updatedData: Partial<TaskItem>) => { updateHistoryItem(prev => { if(!prev) return prev; const newGroups = prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? {...t, ...updatedData, updatedAt: new Date().toISOString()} : t) } : g); return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups }}; }); };
    const handleDeleteTask = (groupId: string, taskId: string) => { updateHistoryItem(prev => { if(!prev) return prev; const newGroups = prev.analysisResult.groups.map(g => g.id === groupId ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) } : g); return { ...prev, analysisResult: { ...prev.analysisResult, groups: newGroups, totalTasks: prev.analysisResult.totalTasks - 1 }}; }); };
    
    return (
        <div className="space-y-4"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><h2 className="text-xl font-bold flex items-center gap-3"><ListChecks className="w-6 h-6 text-purple-600" />Task Groups</h2><div className="flex items-center gap-2"><Select value={filter} onValueChange={v => setFilter(v as FilterStatus)}><SelectTrigger className="w-32 h-9"><Filter className="w-4 h-4 mr-2"/>{filter.charAt(0).toUpperCase() + filter.slice(1)}</SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select><Select value={sort} onValueChange={v => setSort(v as SortKey)}><SelectTrigger className="w-32 h-9"><SortAsc className="w-4 h-4 mr-2"/>{sort === 'priority' ? 'Priority' : 'Date'}</SelectTrigger><SelectContent><SelectItem value="priority">Priority</SelectItem><SelectItem value="createdAt">Date</SelectItem></SelectContent></Select><Button size="sm" onClick={handleAddGroup}><PlusCircle className="w-4 h-4 mr-2"/>Add Group</Button></div></div><Accordion type="multiple" defaultValue={groups.map(g => g.id)} className="w-full"><AnimatePresence>{filteredAndSortedGroups.map(group => (<motion.div key={group.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><AccordionItem value={group.id}><AccordionTrigger className="text-lg font-semibold hover:no-underline"><div className="flex items-center gap-3">{group.name}<Badge variant="secondary">{group.tasks.length}</Badge></div></AccordionTrigger><AccordionContent className="pl-2 border-l-2"><div className="space-y-2"><AnimatePresence>{group.tasks.map(task => (<motion.div key={task.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}><div className="flex items-start gap-3 p-3 rounded-md hover:bg-slate-50/50 dark:hover:bg-slate-900/50 group"><input type="checkbox" checked={task.completed} onChange={() => handleTaskUpdate(group.id, task.id, { completed: !task.completed })} className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"/><div className="flex-1"><EditableField value={task.content} onSave={val => handleTaskUpdate(group.id, task.id, { content: val })} className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}/><div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500"><EditableField type="select" value={task.priority} onSave={val => handleTaskUpdate(group.id, task.id, { priority: val as TaskItem['priority'] })}/><span>Est: {task.estimatedTime || 'N/A'} min</span></div></div><DeleteConfirmation onConfirm={() => handleDeleteTask(group.id, task.id)} /></div></motion.div>))}</AnimatePresence><Button variant="ghost" size="sm" className="w-full justify-start mt-2" onClick={() => handleAddTask(group.id)}><PlusCircle className="w-4 h-4 mr-2"/>Add Task</Button></div></AccordionContent></AccordionItem></motion.div>))}</AnimatePresence></Accordion></div>
    );
};

// ===================================================================================
// --- MAIN COMPONENT & EXPORT ---
// ===================================================================================

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
        if (!id || !user) { if (!user) navigate('/login'); return; }
        const fetchChecklist = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, `users/${user.uid}/history`, id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setHistoryItem({ id: docSnap.id, ...docSnap.data() } as HistoryItem);
                else setError("Checklist not found.");
            } catch (err) { setError("Failed to load the checklist."); } 
            finally { setLoading(false); }
        };
        fetchChecklist();
    }, [id, user, navigate]);

    const debouncedSave = useRef<NodeJS.Timeout>();
    useEffect(() => {
        if (saveStatus !== 'saving' || !historyItem) return;
        if (debouncedSave.current) clearTimeout(debouncedSave.current);
        debouncedSave.current = setTimeout(async () => {
            if (!id || !user) return;
            try {
                const docRef = doc(db, `users/${user.uid}/history`, id);
                const { id: itemId, ...dataToSave } = historyItem;
                await updateDoc(docRef, dataToSave);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                toast({ title: "Save Failed", variant: "destructive" });
                setSaveStatus('idle');
            }
        }, 1500);
        return () => { if (debouncedSave.current) clearTimeout(debouncedSave.current); };
    }, [historyItem, id, user, saveStatus, toast]);

    const updateHistoryItem = (updater: (prev: HistoryItem) => HistoryItem) => {
        setHistoryItem(prev => (prev ? updater(prev) : null));
        setSaveStatus('saving');
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-purple-600" /></div>;
    if (error) return <div className="container mx-auto p-4 text-center"><AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" /><h2 className="text-xl font-semibold text-red-600">An Error Occurred</h2><p className="text-gray-600 mt-2">{error}</p><Button onClick={() => navigate('/')} className="mt-6">Go Home</Button></div>;
    if (!historyItem) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="container mx-auto max-w-4xl p-2 sm:p-4 md:p-6 lg:p-8">
            <Header user={user} historyItem={historyItem} saveStatus={saveStatus} updateHistoryItem={updateHistoryItem} />
            <Dashboard historyItem={historyItem} />
            <Summary summary={historyItem.analysisResult.summary} updateHistoryItem={updateHistoryItem} />
            <TaskList groups={historyItem.analysisResult.groups} updateHistoryItem={updateHistoryItem} filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
        </motion.div>
    );
};

// The wrapper is important for context providers like TooltipProvider
const ChecklistPageWrapper: React.FC = () => (
    <TooltipProvider>
        <ChecklistPage />
    </TooltipProvider>
);

export default ChecklistPageWrapper;