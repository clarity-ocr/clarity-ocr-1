import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { OCRResult } from '@/types/schema';

// Initialize PDF.js worker
// Note: In Vite, we need to point to the worker file in node_modules or public
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Process an Image using Tesseract.js
 */
const processImage = async (imageUrl: string, language: string = 'eng'): Promise<OCRResult> => {
  try {
    const result = await Tesseract.recognize(imageUrl, language, {
      logger: (m) => console.log('[Tesseract Log]:', m), // Optional logging
    });

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      pages: [{ pageNumber: 1, text: result.data.text }],
    };
  } catch (error) {
    console.error('Image OCR Error:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Process a PDF using PDF.js to extract text layer
 * Note: If scanned PDF (images inside PDF), we would need to render canvas and send to Tesseract.
 * This implementation extracts embedded text first (faster), falling back to basic extraction.
 */
const processPDF = async (fileUrl: string): Promise<OCRResult> => {
  try {
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      fullText += pageText + '\n\n';
      pages.push({ pageNumber: i, text: pageText });
    }

    // If text is empty, it might be a scanned PDF (image-only).
    // In a real production environment, we would detect this and render the PDF 
    // to a canvas, then send that canvas to Tesseract.
    if (fullText.trim().length === 0) {
      console.warn("PDF appears to be image-only (scanned). OCR fallback required.");
      // For Phase 1, we return empty/warning. 
      // Phase 2 enhancement: Render page -> Canvas -> Tesseract
      return { text: "[SCANNED PDF DETECTED - RAW IMAGE MODE NEEDED]", confidence: 0, pages: [] };
    }

    return {
      text: fullText,
      confidence: 95, // Assumed high for digital PDFs
      pages,
    };
  } catch (error) {
    console.error('PDF Processing Error:', error);
    throw new Error('Failed to process PDF');
  }
};

/**
 * Main Entry Point for OCR
 */
export const runOCR = async (file: File, language: string = 'eng'): Promise<OCRResult> => {
  const fileType = file.type;
  
  // Create a local URL for processing (avoids downloading from Firebase again if we have the file)
  const objectUrl = URL.createObjectURL(file);

  try {
    if (fileType === 'application/pdf') {
      return await processPDF(objectUrl);
    } else if (fileType.startsWith('image/')) {
      return await processImage(objectUrl, language);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } finally {
    URL.revokeObjectURL(objectUrl); // Cleanup
  }
};