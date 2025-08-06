// src/services/exportService.ts
import { AnalysisResult } from '@/types/task';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToJson = (data: AnalysisResult, fileName: string = 'analysis_result') => {
  const jsonData = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPdf = (data: AnalysisResult, fileName: string = 'analysis_result') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(22);
  doc.text('Task Analysis Report', 105, 20, { align: 'center' });
  
  // Add document info
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Document: ${data.fileName || 'Untitled'}`, 20, 35);
  doc.text(`Processed: ${new Date(data.processedAt).toLocaleString()}`, 20, 45);
  doc.text(`Total Tasks: ${data.totalTasks}`, 20, 55);
  
  // Add summary if available
  if (data.summary) {
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Project Summary', 20, 70);
    
    doc.setFontSize(12);
    doc.text(data.summary.projectDescription, 20, 80, { maxWidth: 170 });
    
    // Add milestones
    let yPos = 95;
    doc.setFontSize(14);
    doc.text('Key Milestones', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    data.summary.milestones.forEach((milestone, index) => {
      doc.text(`${index + 1}. ${milestone}`, 25, yPos);
      yPos += 7;
    });
  }
  
  // Add task groups
  let currentY = data.summary ? 140 : 80;
  
  data.groups.forEach((group, groupIndex) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Group header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(`${group.name} (${group.tasks.length} tasks)`, 20, currentY);
    currentY += 10;
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(group.description, 20, currentY);
    currentY += 15;
    
    // Tasks table
    const tableData = group.tasks.map(task => [
      task.content.substring(0, 50) + (task.content.length > 50 ? '...' : ''),
      task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
      `${task.estimatedTime} min`,
      task.deadline || 'None',
      task.assignee || 'Unassigned'
    ]);
    
    autoTable(doc, {
      startY: currentY,
      head: [['Task', 'Priority', 'Time', 'Deadline', 'Assignee']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
      margin: { top: 20 }
    });
    
    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 15;
  });
  
  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

export const exportToCsv = (data: AnalysisResult, fileName: string = 'analysis_result') => {
  let csvContent = 'Group,Task,Priority,Estimated Time,Deadline,Assignee,Tags\n';
  
  data.groups.forEach(group => {
    group.tasks.forEach(task => {
      const row = [
        `"${group.name}"`,
        `"${task.content.replace(/"/g, '""')}"`,
        task.priority,
        task.estimatedTime,
        task.deadline || '',
        task.assignee || '',
        task.tags.join('|')
      ].join(',');
      csvContent += row + '\n';
    });
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};