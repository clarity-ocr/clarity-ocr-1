/**
 * Enhanced OCR & document parsing service
 * Supports up to 50MB files with optimized performance
 * - PDF text extraction (pdfjs-dist)
 * - DOCX text extraction (mammoth)
 * - Image OCR (tesseract.js) with optimization
 * - Text files (txt, md, markdown)
 * - Progress tracking and error handling
 */

import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker - using compatible version
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.mjs';

export interface OcrResult {
  text: string;
  confidence: number;
  pages?: number;
  processingTime?: number;
  fileType: string;
}

export type ProgressCallback = (progress: number) => void;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const OCR_CHUNK_SIZE = 2048; // Process images in chunks for better performance

/**
 * Validate file size and type
 */
function validateFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 50MB`);
  }
  
  const allowedExtensions = ['.pdf', '.docx', '.txt', '.md', '.markdown', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  const fileName = file.name.toLowerCase();
  const isValidType = allowedExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValidType) {
    throw new Error(`Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`);
  }
}

/**
 * Optimize image for OCR processing
 */
async function optimizeImageForOCR(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate optimal dimensions (max 2048px on longest side)
      const maxDimension = 2048;
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and enhance image
      ctx!.drawImage(img, 0, 0, width, height);
      
      // Apply image enhancements for better OCR
      const imageData = ctx!.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Increase contrast and brightness for better text recognition
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale with better contrast
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const enhanced = gray > 128 ? Math.min(255, gray * 1.2) : Math.max(0, gray * 0.8);
        
        data[i] = enhanced;     // R
        data[i + 1] = enhanced; // G
        data[i + 2] = enhanced; // B
      }
      
      ctx!.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(optimizedFile);
        } else {
          reject(new Error('Failed to optimize image'));
        }
      }, 'image/png', 0.9);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract text from PDF with progress tracking
 */
async function extractTextFromPDF(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
  const startTime = Date.now();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    progressCallback?.(20);
    
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
    }).promise;
    
    progressCallback?.(40);
    
    let textContent = "";
    const totalPages = pdf.numPages;
    
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      const pageText = content.items
        .map((item: any) => {
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');
      
      textContent += pageText + '\n\n';
      
      // Update progress
      const progress = 40 + (pageNum / totalPages) * 50;
      progressCallback?.(Math.round(progress));
    }
    
    progressCallback?.(100);
    
    return {
      text: textContent.trim(),
      confidence: 95, // PDFs typically have high confidence
      pages: totalPages,
      processingTime: Date.now() - startTime,
      fileType: 'PDF'
    };
  } catch (error) {
    throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from DOCX with progress tracking
 */
async function extractTextFromDOCX(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
  const startTime = Date.now();
  
  try {
    progressCallback?.(20);
    const arrayBuffer = await file.arrayBuffer();
    progressCallback?.(60);
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    progressCallback?.(100);
    
    return {
      text: result.value.trim(),
      confidence: 98, // DOCX files have very high confidence
      processingTime: Date.now() - startTime,
      fileType: 'DOCX'
    };
  } catch (error) {
    throw new Error(`DOCX processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract text from plain text files
 */
async function extractTextFromPlainFile(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
  const startTime = Date.now();
  
  try {
    progressCallback?.(20);
    const text = await file.text();
    progressCallback?.(100);
    
    return {
      text: text.trim(),
      confidence: 100, // Plain text files have perfect confidence
      processingTime: Date.now() - startTime,
      fileType: 'TEXT'
    };
  } catch (error) {
    throw new Error(`Text file processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Run optimized OCR on images
 */
async function runImageOCR(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
  const startTime = Date.now();
  
  try {
    // Validate image size
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`Image size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 10MB for OCR processing`);
    }
    
    progressCallback?.(10);
    
    // Optimize image for better OCR results
    const optimizedFile = await optimizeImageForOCR(file);
    progressCallback?.(30);
    
    // Run OCR with optimized settings
    const { data } = await Tesseract.recognize(optimizedFile, 'eng', {
      logger: (info) => {
        if (info.status === 'recognizing text') {
          const progress = 30 + (info.progress * 60);
          progressCallback?.(Math.round(progress));
        }
      },
    });
    
    progressCallback?.(100);
    
    // Clean up the recognized text
    const cleanText = data.text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    return {
      text: cleanText,
      confidence: Math.round(data.confidence),
      processingTime: Date.now() - startTime,
      fileType: 'IMAGE'
    };
  } catch (error) {
    throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to extract text from any supported file type
 */
export async function extractTextFromFile(file: File, progressCallback?: ProgressCallback): Promise<OcrResult> {
  // Validate file
  validateFile(file);
  
  const fileName = file.name.toLowerCase();
  
  progressCallback?.(5);
  
  try {
    if (fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file, progressCallback);
    } 
    else if (fileName.endsWith('.docx')) {
      return await extractTextFromDOCX(file, progressCallback);
    } 
    else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
      return await extractTextFromPlainFile(file, progressCallback);
    } 
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].some(ext => fileName.endsWith(ext))) {
      return await runImageOCR(file, progressCallback);
    } 
    else {
      throw new Error(`Unsupported file format: ${file.name}`);
    }
  } catch (error) {
    progressCallback?.(0);
    throw error;
  }
}

/**
 * Get file type information
 */
export function getFileTypeInfo(fileName: string): { type: string; icon: string; color: string } {
  const ext = fileName.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'pdf':
      return { type: 'PDF Document', icon: 'FileText', color: 'red' };
    case 'docx':
      return { type: 'Word Document', icon: 'FileText', color: 'blue' };
    case 'txt':
    case 'md':
    case 'markdown':
      return { type: 'Text File', icon: 'FileCode', color: 'green' };
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'tiff':
    case 'webp':
      return { type: 'Image File', icon: 'FileImage', color: 'purple' };
    default:
      return { type: 'Unknown', icon: 'File', color: 'gray' };
  }
}

/**
 * Estimate processing time based on file size and type
 */
export function estimateProcessingTime(file: File): number {
  const sizeInMB = file.size / (1024 * 1024);
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return Math.max(2, sizeInMB * 0.5); // ~0.5 seconds per MB for PDFs
  } else if (fileName.endsWith('.docx')) {
    return Math.max(1, sizeInMB * 0.2); // ~0.2 seconds per MB for DOCX
  } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp'].some(ext => fileName.endsWith(ext))) {
    return Math.max(3, sizeInMB * 2); // ~2 seconds per MB for images (OCR is slower)
  } else {
    return Math.max(1, sizeInMB * 0.1); // ~0.1 seconds per MB for text files
  }
}