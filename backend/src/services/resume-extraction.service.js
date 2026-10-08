import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import yauzl from 'yauzl';
import { fileURLToPath } from 'node:url';

export const RESUME_MIME_TYPES = Object.freeze({
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

const MAX_EXTRACTED_CHARACTERS = 1_000_000;
const MAX_DOCX_ENTRIES = 250;
const MAX_DOCX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;
const MAX_DOCX_ENTRY_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 100;
const PDF_STANDARD_FONTS_PATH = fileURLToPath(new URL(
  '../../standard_fonts/',
  import.meta.resolve('pdfjs-dist/legacy/build/pdf.mjs'),
));

function badResume(message, statusCode = 422) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = 'RESUME_EXTRACTION_FAILED';
  return error;
}

function validatePdfSignature(buffer) {
  if (buffer.length < 8 || buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw badResume('The uploaded file does not contain a valid PDF signature.', 400);
  }
}

function inspectDocxArchive(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, {
      lazyEntries: true,
      autoClose: true,
      decodeStrings: true,
      validateEntrySizes: true,
      strictFileNames: true,
    }, (error, zipFile) => {
      if (error) {
        reject(badResume('The DOCX file is not a valid Office document.', 400));
        return;
      }

      let entryCount = 0;
      let totalBytes = 0;
      const names = new Set();
      let documentXml;
      let settled = false;

      const fail = (message) => {
        if (settled) return;
        settled = true;
        zipFile.close();
        reject(badResume(message, 400));
      };

      zipFile.on('error', () => fail('The DOCX archive could not be safely inspected.'));
      zipFile.on('entry', (entry) => {
        entryCount += 1;
        totalBytes += entry.uncompressedSize;
        const name = entry.fileName.replace(/\\/g, '/');
        const segments = name.split('/');
        if (
          entryCount > MAX_DOCX_ENTRIES ||
          entry.uncompressedSize > MAX_DOCX_ENTRY_BYTES ||
          totalBytes > MAX_DOCX_UNCOMPRESSED_BYTES
        ) {
          fail('The DOCX archive exceeds safe extraction limits.');
          return;
        }
        if (
          name.startsWith('/') ||
          segments.some((segment) => segment === '..') ||
          (entry.externalFileAttributes >>> 16 & 0o170000) === 0o120000
        ) {
          fail('The DOCX archive contains an unsafe file entry.');
          return;
        }
        if (/vbaProject\.bin$/i.test(name)) {
          fail('Macro-enabled documents are not accepted.');
          return;
        }
        names.add(name);
        if (name === 'word/document.xml') {
          zipFile.openReadStream(entry, (streamError, stream) => {
            if (streamError) {
              fail('The DOCX document body could not be read.');
              return;
            }
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', () => fail('The DOCX document body could not be read.'));
            stream.on('end', () => {
              documentXml = Buffer.concat(chunks);
              zipFile.readEntry();
            });
          });
          return;
        }
        zipFile.readEntry();
      });
      zipFile.on('end', () => {
        if (settled) return;
        settled = true;
        if (!names.has('[Content_Types].xml') || !names.has('word/document.xml')) {
          reject(badResume('The ZIP file is not a valid DOCX document.', 400));
          return;
        }
        resolve(documentXml);
      });
      zipFile.readEntry();
    });
  });
}

async function extractPdfText(buffer) {
  validatePdfSignature(buffer);
  let document;
  try {
    document = await getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      isEvalSupported: false,
      useSystemFonts: false,
      stopAtErrors: true,
      standardFontDataUrl: PDF_STANDARD_FONTS_PATH,
    }).promise;
    if (!document.numPages || document.numPages > MAX_PDF_PAGES) {
      throw badResume(`PDF resumes must contain between 1 and ${MAX_PDF_PAGES} pages.`, 400);
    }
    const pages = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let previousY;
      const pageLines = [];
      for (const item of content.items) {
        const y = item.transform?.[5];
        const separator = previousY === undefined || y === undefined
          ? ' '
          : Math.abs(y - previousY) > 2
            ? '\n'
            : ' ';
        pageLines.push(`${separator}${item.str}`);
        previousY = y;
      }
      pages.push(pageLines.join('').trim());
      if (pages.join('\n').length > MAX_EXTRACTED_CHARACTERS) {
        throw badResume('The resume contains too much extractable text.', 400);
      }
    }
    return pages.join('\n').slice(0, MAX_EXTRACTED_CHARACTERS);
  } catch (error) {
    if (error.statusCode) throw error;
    throw badResume('The PDF could not be read. Please upload a text-based PDF or DOCX resume.');
  } finally {
    await document?.destroy().catch(() => {});
  }
}

function decodeXmlText(value) {
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (entity, code) => {
    const named = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: '\'',
    };
    if (code[0] !== '#') return named[code.toLowerCase()];
    const codePoint = code[1]?.toLowerCase() === 'x'
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10);
    return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : '';
  });
}

async function extractDocxText(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw badResume('The uploaded file does not contain a valid DOCX archive signature.', 400);
  }
  const documentXml = await inspectDocxArchive(buffer);
  if (!documentXml || /<!DOCTYPE|<!ENTITY/i.test(documentXml.toString('utf8'))) {
    throw badResume('The DOCX document contains unsupported XML.', 400);
  }
  const xml = documentXml.toString('utf8');
  const paragraphs = xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/gi) ?? [];
  const text = paragraphs.map((paragraph) => paragraph
    .replace(/<w:tab(?:\s[^>]*)?\/>/gi, '\t')
    .replace(/<w:br(?:\s[^>]*)?\/>/gi, '\n')
    .match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi)
    ?.map((node) => decodeXmlText(node.replace(/^<w:t(?:\s[^>]*)?>/i, '').replace(/<\/w:t>$/i, '')))
    .join('') ?? '')
    .filter(Boolean);
  const value = paragraphs.length ? text.join('\n') : '';
  if (value.length > MAX_EXTRACTED_CHARACTERS) {
    throw badResume('The resume contains too much extractable text.', 400);
  }
  return value.slice(0, MAX_EXTRACTED_CHARACTERS);
}

export async function extractResumeText(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw badResume('The uploaded resume is empty.', 400);
  }
  let text;
  if (mimeType === RESUME_MIME_TYPES.pdf) {
    text = await extractPdfText(buffer);
  } else if (mimeType === RESUME_MIME_TYPES.docx) {
    text = await extractDocxText(buffer);
  } else {
    throw badResume('Only PDF and DOCX resumes are supported.', 400);
  }
  const normalized = text
    .replace(/\u0000/g, '')
    .replace(/-\s*\n\s*/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length < 40) {
    throw badResume('Not enough readable text was found. Scanned image-only resumes are not supported yet.');
  }
  return normalized;
}
