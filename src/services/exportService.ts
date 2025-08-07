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

// Function to add watermark to PDF pages
const addWatermark = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Save the current graphics state
    doc.saveGraphicsState();
    
    // Set transparency for watermark
    doc.setGState({ opacity: 0.07 });
    
    // Add text watermark
    doc.setFontSize(30);
    doc.setTextColor(150, 150, 150);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add "Clarity OCR" watermark at an angle
    // Using a simpler approach to avoid the equals method error
    doc.text('Clarity OCR', pageWidth / 2, pageHeight / 2, { 
      angle: 45, 
      align: 'center'
    });
    
    // Restore the graphics state
    doc.restoreGraphicsState();
    
    // Add logo in the footer (placeholder for now)
    // In a real implementation, you would use doc.addImage with the actual logo
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Clarity OCR', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
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
    // Handle long text by splitting it into multiple lines
    const lines = doc.splitTextToSize(data.summary.projectDescription, 170);
    let yPos = 80;
    lines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 5;
    });
    
    // Add milestones
    yPos += 5;
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
  let currentY = data.summary ? 140 + (data.summary.projectDescription.length > 50 ? 20 : 0) + (data.summary.milestones.length * 7) : 80;
  
  data.groups.forEach((group, groupIndex) => {
    // Check if we need a new page
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
    // Handle long group description
    const groupDescLines = doc.splitTextToSize(group.description, 170);
    groupDescLines.forEach(line => {
      doc.text(line, 20, currentY);
      currentY += 5;
    });
    currentY += 5;
    
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
  
  // Add watermark to all pages
  try {
    addWatermark(doc);
  } catch (error) {
    console.error('Error adding watermark:', error);
    // Continue without watermark if it fails
  }
  
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