// extractTextService.ts
import Tesseract from 'tesseract.js';
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker with a more reliable source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface OcrResult {
  text: string;
  confidence: number;
  pages?: number;
}

/**
 * Extract text from a file using appropriate method based on file type
 * @param file File to process
 * @param onProgress Optional callback for progress (0-100)
 */
export const extractTextFromFile = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<OcrResult> => {
  try {
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `File size (${fileSizeMB} MB) exceeds the maximum allowed size of 50 MB.`
      );
    }

    const ext = file.name.toLowerCase();
    let extractedText = "";
    let confidence = 100; // Default for non-OCR files
    let pages: number | undefined;

    // Handle different file types
    if (ext.endsWith(".txt") || ext.endsWith(".md") || ext.endsWith(".markdown")) {
      // Plain text or Markdown files - optimized for speed
      extractedText = await readTextFileOptimized(file);
      if (onProgress) onProgress(100);
    } 
    else if (ext.endsWith(".docx")) {
      // Word DOCX files
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      if (onProgress) onProgress(100);
    } 
    else if (ext.endsWith(".pdf")) {
      // PDF files - optimized with better error handling
      const pdfResult = await extractPdfTextOptimized(file, onProgress);
      extractedText = pdfResult.text;
      confidence = pdfResult.confidence;
      pages = pdfResult.pages;
    } 
    else if (file.type.startsWith("image/") || /\.(jpe?g|png|gif|bmp|webp|tiff)$/i.test(ext)) {
      // Image files - use OCR
      console.log('[Tesseract] Starting OCR for image...');
      try {
        const result = await Tesseract.recognize(file, 'eng+tam+hin', {
          logger: (m) => {
            if (onProgress && m.status === 'recognizing text') {
              onProgress(Math.round((m.progress || 0) * 100));
            }
          },
        });
        console.log('[Tesseract] OCR completed for image.');
        extractedText = result.data.text;
        confidence = result.data.confidence ?? 0;
      } catch (ocrError) {
        console.error('OCR for image failed:', ocrError);
        throw new Error('Failed to extract text from image using OCR.');
      }
    } 
    else {
      throw new Error(
        `Unsupported file type. Supported: TXT, MD, DOCX, PDF, JPG, PNG, GIF, BMP, WEBP, TIFF`
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No readable text was found in the file.');
    }

    return {
      text: extractedText,
      confidence,
      pages
    };
  } catch (error: any) {
    console.error('[extractTextFromFile] Error:', error);
    throw new Error(`Failed to extract text: ${error.message || error}`);
  }
};

// Optimized text file reading
const readTextFileOptimized = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
};

// Optimized PDF text extraction with better error handling
const extractPdfTextOptimized = async (
  file: File, 
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number; pages?: number }> => {
  try {
    // Convert file to ArrayBuffer for PDF.js
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a loading task to better handle PDF loading
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    
    // Set up progress listener for PDF loading
    loadingTask.onProgress = (progress) => {
      if (onProgress && progress.total) {
        // Map loading progress (0-1) to 0-50% of total progress
        onProgress(Math.min(50, Math.round((progress.loaded / progress.total) * 50)));
      }
    };

    const pdf = await loadingTask.promise;
    let pdfText = "";
    let textFound = false;
    
    // Extract text from each page with error handling
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        // Update progress for each page (from 50% to 100%)
        if (onProgress) {
          const pageProgress = 50 + Math.round((pageNum / pdf.numPages) * 50);
          onProgress(Math.min(100, pageProgress));
        }
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Process text items more carefully
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        if (pageText.length > 0) {
          textFound = true;
          pdfText += pageText + "\n";
        }
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with next page if one fails
      }
    }
    
    if (textFound) {
      if (onProgress) onProgress(100);
      return {
        text: pdfText,
        confidence: 100,
        pages: pdf.numPages
      };
    } else {
      // If no text found, use OCR
      console.log('[Tesseract] Starting OCR for PDF...');
      try {
        // For PDF OCR, we need to convert each page to an image
        const ocrResult = await performPdfOcr(pdf, onProgress);
        console.log('[Tesseract] OCR completed for PDF.');
        return ocrResult;
      } catch (ocrError) {
        console.error('OCR for PDF failed:', ocrError);
        throw new Error('Failed to extract text from PDF using both text extraction and OCR.');
      }
    }
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`PDF processing failed: ${error.message || error}`);
  }
};

// Perform OCR on PDF by converting pages to images
const performPdfOcr = async (
  pdf: any, 
  onProgress?: (progress: number) => void
): Promise<{ text: string; confidence: number; pages?: number }> => {
  // Check if we're in a browser environment
  if (typeof document === 'undefined') {
    throw new Error('PDF OCR requires a browser environment');
  }

  let fullText = "";
  let totalConfidence = 0;
  let processedPages = 0;
  
  // Process each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      // Update progress
      if (onProgress) {
        const progress = 50 + Math.round((processedPages / pdf.numPages) * 50);
        onProgress(Math.min(100, progress));
      }
      
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render PDF page to canvas
      await page.render({ canvasContext: context, viewport }).promise;
      
      // Convert canvas to image blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      // Create a file from the blob
      const imageFile = new File([blob], `page-${pageNum}.png`, { type: 'image/png' });
      
      // Perform OCR on the image
      const result = await Tesseract.recognize(imageFile, 'eng+tam+hin', {
        logger: (m) => {
          // We could update progress within the page, but we're already updating per page
        },
      });
      
      fullText += result.data.text + "\n";
      totalConfidence += result.data.confidence;
      processedPages++;
    } catch (pageError) {
      console.error(`Error processing page ${pageNum} for OCR:`, pageError);
      // Continue with next page
    }
  }
  
  if (processedPages === 0) {
    throw new Error('Failed to process any pages for OCR');
  }
  
  const avgConfidence = totalConfidence / processedPages;
  
  return {
    text: fullText,
    confidence: avgConfidence,
    pages: processedPages
  };
};

// Keep the old function name for backward compatibility
export const performOCR = extractTextFromFile;