// src/services/ocrService.ts
import axios, { AxiosError } from 'axios';

// --- Configuration ---
const OCR_API_KEY = 'K87516774788957';
// Enforce 10MB limit within the service as a safety check
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
// Corrected URL (removed trailing spaces)
const OCR_API_URL = 'https://api.ocr.space/parse/image';

interface OcrResult {
  text: string;
  confidence: number;
  pages?: number;
}

export const performOCR = async (file: File): Promise<OcrResult> => {
  try {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds maximum limit of 10MB. Please upload a smaller file.');
    }

    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('scale', 'true'); // Scale image for better OCR
    formData.append('detectOrientation', 'true'); // Auto-rotate if needed
    formData.append('OCREngine', '2'); // Use advanced OCR engine
    formData.append('file', file);

    const response = await axios.post(OCR_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds
    });

    if (
      response.data &&
      response.data.ParsedResults &&
      Array.isArray(response.data.ParsedResults) &&
      response.data.ParsedResults.length > 0
    ) {
      const firstResult = response.data.ParsedResults[0];

      if (firstResult.ParsedText !== undefined && firstResult.ParsedText !== null) {
        return {
          text: firstResult.ParsedText,
          confidence: firstResult.Confidence ?? 0,
          pages: response.data.ParsedResults.length,
        };
      } else {
        console.error("OCR API response - No text found in ParsedText:", firstResult);
        throw new Error('OCR completed but failed to extract readable text from the document.');
      }
    } else {
      console.error("OCR API response - Unexpected structure or no results:", response.data);
      throw new Error('OCR failed - Unexpected response structure from the OCR service.');
    }
  } catch (error: any) {
    console.error('OCR Service Error Details:', error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('OCR request timed out. The file might be too large or the service is busy. Please try again.');
      } else if (axiosError.response) {
        console.error("OCR API HTTP Error Response:", axiosError.response.status, axiosError.response.data);
        throw new Error(`OCR Service Error (${axiosError.response.status}): ${JSON.stringify(axiosError.response.data)}`);
      } else if (axiosError.request) {
        console.error("OCR API No Response Error:", axiosError.request);
        throw new Error('Could not reach the OCR service. Please check your internet connection or try again later.');
      }
    }

    throw new Error(`An unexpected error occurred during OCR processing: ${error.message || 'Unknown error'}`);
  }
};