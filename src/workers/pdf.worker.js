import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
