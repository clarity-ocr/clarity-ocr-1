// backend/ocrService.js
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const performOCR = async (buffer, filename) => {
  const formData = new FormData();
  formData.append('apikey', process.env.OCR_API_KEY);
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('file', new Blob([buffer]), filename);

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data?.ParsedResults?.[0]?.ParsedText) {
      return response.data.ParsedResults[0].ParsedText;
    } else {
      throw new Error('OCR failed to extract text');
    }
  } catch (error) {
    throw new Error('Failed to process document with OCR');
  }
};

module.exports = { upload, performOCR };