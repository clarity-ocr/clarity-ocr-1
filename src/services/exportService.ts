// src/services/exportService.ts
import { AnalysisResult } from '@/types/task';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToJson = (data: AnalysisResult, fileName: string = 'analysis_result') => {
  // Add app info to the data
  const enrichedData = {
    ...data,
    generatedBy: "Clarity OCR AI 🇮🇳",
    generatedAt: new Date().toISOString()
  };
  
  const jsonData = JSON.stringify(enrichedData, null, 2);
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
const addWatermark = (doc: jsPDF, isPublic: boolean = false) => {
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
    doc.text('Clarity OCR', pageWidth / 2, pageHeight / 2, { 
      angle: 45, 
      align: 'center'
    });
    
    // Restore the graphics state
    doc.restoreGraphicsState();
    
    // Add logo and text in the footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    // Add logo placeholder (in a real implementation, you would use doc.addImage with the actual logo)
    // For now, we'll just add text
    doc.text(`Clarity OCR AI 🇮🇳 | ${isPublic ? 'Public Share' : 'Confidential'}`, 
             pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
};

export const exportToPdf = (data: AnalysisResult, fileName: string = 'analysis_result', isPublic: boolean = false) => {
  const doc = new jsPDF() as any;
  
  // Document metadata
  doc.setProperties({
    title: `${fileName} - Task Analysis`,
    subject: 'Task Analysis Document',
    author: 'Clarity OCR AI',
    keywords: 'task, analysis, checklist',
    creator: 'Clarity OCR App'
  });
  
  // Add custom font if needed
  // doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  // doc.setFont('Montserrat');
  
  // Header
  const headerHeight = 30;
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Analysis Report', 105, 15, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(fileName, 105, 25, { align: 'center' });
  
  // Add logo if available
  try {
    const logo = new Image();
    logo.src = '/logo.png'; // Adjust path as needed
    doc.addImage(logo, 'PNG', 14, 12, 20, 20);
  } catch (e) {
    console.log('Logo not found, skipping');
  }
  
  // Add a divider
  doc.setDrawColor(200, 200, 200);
  doc.line(10, headerHeight, 200, headerHeight);
  
  // Summary section
  let yPos = headerHeight + 15;
  
  // Project description
  if (data.summary?.projectDescription) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Overview', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Add project description with proper wrapping
    const descriptionLines = doc.splitTextToSize(data.summary.projectDescription, 180);
    descriptionLines.forEach(line => {
      doc.text(line, 14, yPos);
      yPos += 6;
    });
    
    yPos += 10;
  }
  
  // Statistics
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Statistics', 14, yPos);
  yPos += 10;
  
  const calculateTotalEstimatedTime = () => {
    let totalTime = 0;
    data.groups.forEach(group => {
      group.tasks.forEach(task => {
        totalTime += task.estimatedTime || 15;
        if (task.subtasks) {
          task.subtasks.forEach(subtask => {
            totalTime += subtask.estimatedTime || 10;
          });
        }
      });
    });
    return totalTime;
  };
  
  const stats = [
    ['Total Tasks', data.totalTasks.toString()],
    ['Categories', data.groups.length.toString()],
    ['Assignees', new Set(data.groups.flatMap(g => g.tasks).map(t => t.assignee).filter(Boolean)).size.toString()],
    ['Estimated Time', formatTime(calculateTotalEstimatedTime())]
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: stats,
    theme: 'striped',
    headStyles: { fillColor: [76, 86, 106], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: { 
      0: { cellWidth: 80 },
      1: { cellWidth: 80 }
    }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Milestones
  if (data.summary?.milestones && data.summary.milestones.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Milestones', 14, yPos);
    yPos += 10;
    
    data.summary.milestones.forEach(milestone => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add bullet point
      doc.text('•', 14, yPos);
      
      // Add milestone text with wrapping
      const milestoneLines = doc.splitTextToSize(milestone, 170);
      milestoneLines.forEach((line, index) => {
        doc.text(line, 20, yPos + (index * 6));
      });
      
      yPos += milestoneLines.length * 6 + 8;
    });
    
    yPos += 5;
  }
  
  // Resources
  if (data.summary?.resources && data.summary.resources.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resources Needed', 14, yPos);
    yPos += 10;
    
    data.summary.resources.forEach(resource => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add bullet point
      doc.text('•', 14, yPos);
      
      // Add resource text with wrapping
      const resourceLines = doc.splitTextToSize(resource, 170);
      resourceLines.forEach((line, index) => {
        doc.text(line, 20, yPos + (index * 6));
      });
      
      yPos += resourceLines.length * 6 + 8;
    });
    
    yPos += 5;
  }
  
  // Risks
  if (data.summary?.risks && data.summary.risks.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Potential Risks', 14, yPos);
    yPos += 10;
    
    data.summary.risks.forEach(risk => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add bullet point
      doc.text('•', 14, yPos);
      
      // Add risk text with wrapping
      const riskLines = doc.splitTextToSize(risk, 170);
      riskLines.forEach((line, index) => {
        doc.text(line, 20, yPos + (index * 6));
      });
      
      yPos += riskLines.length * 6 + 8;
    });
    
    yPos += 5;
  }
  
  // Recommendations
  if (data.summary?.recommendations && data.summary.recommendations.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', 14, yPos);
    yPos += 10;
    
    data.summary.recommendations.forEach(recommendation => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      // Add bullet point
      doc.text('•', 14, yPos);
      
      // Add recommendation text with wrapping
      const recLines = doc.splitTextToSize(recommendation, 170);
      recLines.forEach((line, index) => {
        doc.text(line, 20, yPos + (index * 6));
      });
      
      yPos += recLines.length * 6 + 8;
    });
    
    yPos += 5;
  }
  
  // Task details by category
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Task Details by Category', 14, yPos);
  yPos += 15;
  
  data.groups.forEach((group: any) => {
    // Group header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(group.name, 14, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(group.description, 14, yPos);
    yPos += 12;
    
    // Group tasks table
    const tasks = group.tasks;
    const completedTasks = tasks.filter((t: any) => t.completed).length;
    const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    
    // Progress bar
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos, 180, 8, 'F');
    
    doc.setFillColor(76, 86, 106);
    doc.rect(14, yPos, (180 * progress) / 100, 8, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`${completedTasks}/${tasks.length} tasks completed (${progress}%)`, 14, yPos + 6);
    yPos += 15;
    
    // Task table
    const taskData = tasks.map((task: any) => {
      const subtasksInfo = task.subtasks && task.subtasks.length > 0 ? 
        ` (${task.subtasks.length} subtasks)` : '';
      
      return [
        task.completed ? '✓' : '□',
        task.content + subtasksInfo,
        formatPriority(task.priority),
        task.estimatedTime ? formatTime(task.estimatedTime) : '15 min',
        task.deadline || '-',
        task.assignee || '-'
      ];
    });
    
    autoTable(doc, {
      startY: yPos,
      head: [['', 'Task', 'Priority', 'Est. Time', 'Deadline', 'Assignee']],
      body: taskData,
      theme: 'striped',
      headStyles: { fillColor: [76, 86, 106], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 70 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    // Check if we need a new page
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, 200, 290, { align: 'right' });
    
    // Add footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 285, 200, 285);
    
    // Add copyright info
    doc.setFontSize(8);
    doc.text(`© ${new Date().getFullYear()} Clarity OCR. ${isPublic ? 'Public Share' : 'Confidential'}.`, 105, 288, { align: 'center' });
  }
  
  // Add watermark
  addWatermark(doc, isPublic);
  
  // Save the PDF
  doc.save(`${fileName.replace(/\s+/g, '_')}_task_analysis.pdf`);
};

export const exportToCsv = (data: AnalysisResult, fileName: string = 'analysis_result') => {
  // Add header with app info
  let csvContent = 'Generated by Clarity OCR AI 🇮🇳\n';
  csvContent += `Exported on: ${new Date().toLocaleString()}\n\n`;
  csvContent += 'Group,Task,Priority,Estimated Time,Deadline,Assignee,Tags\n';
  
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

// Helper function to format time
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

// Helper function to format priority
const formatPriority = (priority: string): string => {
  switch (priority) {
    case 'critical': return 'Critical (❗)';
    case 'high': return 'High (⚠️)';
    case 'medium': return 'Medium (📌)';
    case 'low': return 'Low (✅)';
    case 'none': return 'None';
    default: return priority;
  }
};