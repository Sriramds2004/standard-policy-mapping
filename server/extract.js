import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';

export async function extractDocx(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (e) {
    return '';
  }
}

export async function extractPdf(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('PDF file does not exist:', filePath);
      return '';
    }
    
    const buffer = fs.readFileSync(filePath);
    if (buffer.length === 0) {
      console.error('PDF file is empty:', filePath);
      return '';
    }
    
    // Lazy dynamic import to avoid initialization side effects at server boot
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (e) {
    console.error('PDF extraction failed:', filePath, e.message);
    return '';
  }
}

// Extract PDF with metadata to help detect scanned PDFs (no text layer)
export async function extractPdfWithMeta(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file does not exist');
    }
    
    const buffer = fs.readFileSync(filePath);
    if (buffer.length === 0) {
      throw new Error('PDF file is empty');
    }
    
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return {
      text: data.text || '',
      numpages: data.numpages || 0,
      info: data.info || {},
      metadata: data.metadata || null,
      error: null
    };
  } catch (e) {
    console.error('PDF extraction error:', e.message);
    return {
      text: '',
      numpages: 0,
      info: {},
      metadata: null,
      error: e.message
    };
  }
}

export async function extractByExtension(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();
  if (ext === '.docx') return await extractDocx(fullPath);
  if (ext === '.pdf') return await extractPdf(fullPath);
  if (ext === '.txt' || ext === '.md') {
    try { return fs.readFileSync(fullPath, 'utf8'); } catch { return ''; }
  }
  return '';
}
