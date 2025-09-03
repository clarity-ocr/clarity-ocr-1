import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HistoryItem } from '../types/task';

// Helper to trigger a file download
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
    try {
        const doc = new jsPDF();
        const title = data.title || 'Untitled Checklist';
       // Assumes icon.png is in /public

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Add Watermark
        doc.setFontSize(40);
        doc.setTextColor(240, 240, 240);
        doc.text("Clarity OCR", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
        doc.setTextColor(0, 0, 0);

        doc.setFontSize(18);
        doc.text(title, pageWidth / 2, 20, { align: 'center' });
        
        const allTasks = data.analysisResult.groups.flatMap(g => g.tasks.map(t => ({ ...t, groupName: g.name })));

        if (allTasks.length > 0) {
            const tableData = allTasks.map(t => [t.groupName, t.content, t.priority, t.completed ? 'Yes' : 'No']);
            
            autoTable(doc, {
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
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("An error occurred while generating the PDF. Please check the console for details.");
    }
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