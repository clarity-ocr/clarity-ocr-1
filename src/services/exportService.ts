import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { HistoryItem } from '../types/task';

// Helper to convert the logo to Base64
const getImageBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportToPDF = async (data: HistoryItem): Promise<void> => {
    const doc = new jsPDF();
    const title = data.title || 'Untitled Checklist';
    const logoBase64 = await getImageBase64('/icon.png'); // Assumes icon.png is in /public

    // Add Watermark
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(40);
    doc.setTextColor(240, 240, 240); // Light gray
    doc.text("Clarity OCR", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    doc.addImage(logoBase64, 'PNG', (pageWidth / 2) - 15, (pageHeight / 2) - 45, 30, 30, undefined, 'FAST');
    doc.setTextColor(0, 0, 0); // Reset color

    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    const allTasks = data.analysisResult.groups.flatMap(g => g.tasks.map(t => ({ ...t, groupName: g.name })));

    if (allTasks.length > 0) {
        const tableData = allTasks.map(t => [t.groupName, t.content, t.priority, t.completed ? 'Yes' : 'No']);
        (doc as any).autoTable({
            startY: 30,
            head: [['Group', 'Task', 'Priority', 'Completed']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [76, 55, 145] },
        });
    } else {
        doc.setFontSize(12);
        doc.text("No tasks found in this checklist.", 14, 30);
    }
    const blob = doc.output('blob');
    triggerDownload(blob, `${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToJSON = async (data: HistoryItem): Promise<void> => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, `${data.title.replace(/\s+/g, '_')}.json`);
};

export const exportToCSV = async (data: HistoryItem): Promise<void> => {
    const allTasks = data.analysisResult.groups.flatMap(g => g.tasks.map(t => ({ ...t, groupName: g.name })));
    const headers = ['GroupID', 'GroupName', 'TaskID', 'TaskContent', 'Completed', 'Priority', 'EstimatedTime', 'Deadline'];
    const rows = allTasks.map(t => [t.groupId, t.groupName, t.id, `"${t.content.replace(/"/g, '""')}"`, t.completed, t.priority, t.estimatedTime || '', t.deadline || ''].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${data.title.replace(/\s+/g, '_')}.csv`);
};