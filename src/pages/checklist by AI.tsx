// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence, Variants } from 'framer-motion';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { ArrowLeft, History as HistoryIcon, Calendar, FileText, Trash2, Eye, Loader2, AlertTriangle } from 'lucide-react';
// import { getHistory, deleteHistoryItem } from '@/services/historyService';
// import { useToast } from '@/hooks/use-toast';
// import { formatDistanceToNow } from 'date-fns';
// import { useAuth } from '@/contexts/AuthContext';

// // This custom type represents a Firestore Timestamp object or a standard date string/number.
// type FirestoreTimestamp = {
//   toDate: () => Date;
// };
// type DateInput = string | number | FirestoreTimestamp;

// interface HistoryItem {
//   id: string;
//   fileName?: string;
//   createdAt?: DateInput;
//   lastViewedAt?: DateInput;
//   analysisResult?: {
//     totalTasks?: number;
//     groups?: Array<any>;
//   };
// }

// // --- Confirmation Dialog Component ---
// interface ConfirmationDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   isDeleting: boolean;
// }

// const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, isDeleting }) => {
//   // ... (This component remains unchanged)
//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
//           onClick={onClose}
//         >
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9, y: 20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.9, y: 20 }}
//             transition={{ type: 'spring', stiffness: 300, damping: 25 }}
//             className="w-full max-w-md p-4"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl">
//               <CardHeader>
//                 <div className="flex items-center gap-3">
//                   <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
//                     <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
//                   </div>
//                   <div>
//                     <CardTitle className="font-sora text-slate-900 dark:text-white">Confirm Deletion</CardTitle>
//                     <CardDescription className="text-slate-600 dark:text-slate-400">
//                       This action is irreversible.
//                     </CardDescription>
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-slate-700 dark:text-slate-300">
//                   Are you sure you want to permanently delete this analysis?
//                 </p>
//               </CardContent>
//               <CardFooter className="flex justify-end gap-3">
//                 <Button variant="outline" onClick={onClose} className="bg-transparent">
//                   Cancel
//                 </Button>
//                 <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
//                   {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
//                   Delete
//                 </Button>
//               </CardFooter>
//             </Card>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// };


// function HistoryPage() {
//   const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const [itemToDelete, setItemToDelete] = useState<string | null>(null);
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { user } = useAuth();

//   useEffect(() => {
//     if (user) {
//       const fetchHistory = async () => {
//         try {
//           const items = await getHistory();
//           setHistoryItems(items);
//         } catch (error) {
//           console.error("Failed to fetch history:", error);
//           toast({ title: "Error", description: "Failed to load history.", variant: "destructive" });
//         } finally {
//           setLoading(false);
//         }
//       };
//       fetchHistory();
//     } else {
//       setLoading(false);
//     }
//   }, [toast, user]);

//   const handleOpenConfirm = (id: string) => {
//     setItemToDelete(id);
//   };

//   const handleCloseConfirm = () => {
//     setItemToDelete(null);
//   };

//   const handleConfirmDelete = async () => {
//     if (!itemToDelete || !user) {
//       toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
//       return;
//     }

//     setDeletingId(itemToDelete);
//     try {
//       await deleteHistoryItem(user.uid, itemToDelete);
//       setHistoryItems(prev => prev.filter(item => item.id !== itemToDelete));
//       toast({ title: "Deleted", description: "History item removed successfully." });
//     } catch (error) {
//       toast({ title: "Error", description: "Failed to delete history item.", variant: "destructive" });
//     } finally {
//       setDeletingId(null);
//       handleCloseConfirm();
//     }
//   };

//   /**
//    * [FIXED] Renders a date robustly by using an `if / else if` structure.
//    * This helps TypeScript correctly narrow the type of `dateInput` in each
//    * block, resolving the "No overload matches this call" error.
//    */
//   const renderDate = (dateInput?: DateInput) => {
//     if (!dateInput) return 'Date unknown';

//     let date: Date;

//     try {
//       // Handle objects with a .toDate() method, like Firestore Timestamps
//       if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
//         date = (dateInput as FirestoreTimestamp).toDate();
//       } 
//       // Handle strings or numbers, which are valid for the new Date() constructor
//       else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
//         date = new Date(dateInput);
//       } 
//       // If the format is something else, return an error string
//       else {
//         return 'Unsupported date format';
//       }

//       // Check if the resulting date is valid before formatting
//       if (isNaN(date.getTime())) {
//         return 'Invalid date';
//       }
      
//       return formatDistanceToNow(date, { addSuffix: true });
//     } catch {
//       return 'Invalid date';
//     }
//   };
  
//   const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
//   const itemVariants: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } } };
//   const card3DVariants: Variants = {
//       hover: { scale: 1.03, rotateY: 5, boxShadow: "0px 15px 30px rgba(0,0,0,0.15)", transition: { type: 'spring', stiffness: 300, damping: 20 } }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1121] relative overflow-hidden">
//         <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
//         <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-sky-500" />
//           <p className="text-lg text-slate-600 dark:text-slate-400">Loading your history...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <ConfirmationDialog 
//         isOpen={!!itemToDelete}
//         onClose={handleCloseConfirm}
//         onConfirm={handleConfirmDelete}
//         isDeleting={!!deletingId}
//       />
//       <div className="min-h-screen bg-slate-50 dark:bg-[#0D1121] text-slate-800 dark:text-slate-200 font-sans relative overflow-hidden">
//         <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap'); .font-sora { font-family: 'Sora', sans-serif; }`}</style>
//         <div className="absolute inset-0 -z-10 bg-white dark:bg-[#0D1121]"></div>
//         <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-20 dark:opacity-30 bg-[radial-gradient(circle_at_center,_#06b6d420,_#3b82f640,_#8b5cf660,_transparent_70%)]" aria-hidden="true"></div>
        
//         <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
//           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-10">
//             <div className="flex items-center gap-4">
//               <Button variant="outline" size="icon" onClick={() => navigate('/')} className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-300 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80">
//                 <ArrowLeft className="w-4 h-4" />
//               </Button>
//               <div>
//                 <h1 className="text-3xl font-bold font-sora text-slate-900 dark:text-white">Analysis History</h1>
//                 <p className="text-slate-500 dark:text-slate-400">Review your past document analyses.</p>
//               </div>
//             </div>
//             <HistoryIcon className="w-8 h-8 text-sky-500" />
//           </motion.div>

//           {historyItems.length === 0 ? (
//             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
//                 <Card className="p-12 text-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-lg border-slate-200 dark:border-slate-800 rounded-2xl">
//                   <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" />
//                   <h3 className="text-2xl font-bold font-sora mb-2 text-slate-800 dark:text-slate-100">No History Found</h3>
//                   <p className="text-slate-600 dark:text-slate-400 mb-6">When you analyze a document, your results will be saved here.</p>
//                   <Button onClick={() => navigate('/')} size="lg" className="text-base h-12 px-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold shadow-lg shadow-sky-500/20 hover:scale-105 transition-transform">
//                     Analyze First Document
//                   </Button>
//                 </Card>
//             </motion.div>
//           ) : (
//             <motion.div className="space-y-4" style={{ perspective: '1000px' }} variants={containerVariants} initial="hidden" animate="show">
//               {historyItems.map((item) => (
//                 <motion.div key={item.id} variants={itemVariants} whileHover="hover">
//                     <motion.div variants={card3DVariants}>
//                       <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 transition-shadow duration-300 rounded-2xl overflow-hidden">
//                           <CardHeader className="p-4 sm:p-6">
//                             <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
//                                 <div className="flex-grow min-w-0">
//                                   <CardTitle className="text-lg flex items-center gap-3 font-sora text-slate-900 dark:text-white">
//                                       <FileText className="w-5 h-5 flex-shrink-0 text-sky-500" />
//                                       <span className="truncate break-all">{item.fileName || 'Untitled Analysis'}</span>
//                                   </CardTitle>
//                                   <div className="flex flex-col gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
//                                       <div className="flex items-center gap-2">
//                                           <Calendar className="w-4 h-4" />
//                                           <span>Created: {renderDate(item.createdAt)}</span>
//                                       </div>
//                                       <div className="flex items-center gap-2">
//                                           <Calendar className="w-4 h-4" />
//                                           <span>Last Seen: {renderDate(item.lastViewedAt)}</span>
//                                       </div>
//                                   </div>
//                                   <div className="flex items-center gap-2 mt-4 flex-wrap">
//                                       <Badge variant="secondary" className="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">{item.analysisResult?.totalTasks ?? 0} tasks</Badge>
//                                       <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">{item.analysisResult?.groups?.length ?? 0} categories</Badge>
//                                   </div>
//                                 </div>
//                                 <div className="flex gap-2 flex-shrink-0 self-start sm:self-center">
//                                   <Button variant="outline" size="sm" onClick={() => navigate(`/checklist/${item.id}`)} className="flex items-center gap-1 bg-white/50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600">
//                                       <Eye className="w-4 h-4" /> View
//                                   </Button>
//                                   <Button variant="destructive" size="sm" onClick={() => handleOpenConfirm(item.id)} disabled={deletingId === item.id} className="flex items-center gap-1">
//                                       {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
//                                   </Button>
//                                 </div>
//                             </div>
//                           </CardHeader>
//                       </Card>
//                     </motion.div>
//                 </motion.div>
//               ))}
//             </motion.div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// export default HistoryPage;