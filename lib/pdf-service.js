const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { PDFDocument } = require('pdf-lib');

// 256 MB — suporta PDFs grandes em Base64 (~192 MB de PDF original)
const CLIPBOARD_MAX_BUFFER = 256 * 1024 * 1024;

function readClipboardText() {
  const platform = process.platform;

  if (platform === 'darwin') {
    return execSync('pbpaste', { encoding: 'utf8', maxBuffer: CLIPBOARD_MAX_BUFFER });
  }

  if (platform === 'win32') {
    return execSync('powershell -command Get-Clipboard', {
      encoding: 'utf8',
      maxBuffer: CLIPBOARD_MAX_BUFFER,
    });
  }

  try {
    return execSync('xclip -selection clipboard -o', {
      encoding: 'utf8',
      maxBuffer: CLIPBOARD_MAX_BUFFER,
    });
  } catch (xclipError) {
    try {
      return execSync('wl-paste', { encoding: 'utf8', maxBuffer: CLIPBOARD_MAX_BUFFER });
    } catch (wlPasteError) {
      throw new Error(
        `Não foi possível ler a área de transferência no Linux. xclip: ${xclipError.message}; wl-paste: ${wlPasteError.message}`
      );
    }
  }
}

function normalizeBase64(input) {
  if (!input?.trim()) {
    throw new Error('A área de colagem está vazia.');
  }

  let value = input.trim();

  if (value.startsWith('data:')) {
    const match = value.match(/^data:application\/pdf;base64,(.+)$/is);
    if (!match) {
      throw new Error('Data URI encontrado, mas não é um PDF em Base64.');
    }
    value = match[1];
  }

  value = value.replaceAll(/\s+/g, '');

  if (value.length === 0) {
    throw new Error('Base64 inválido (conteúdo vazio após normalização).');
  }

  // Muitos codificadores omitem o padding '='. Adicionamos automaticamente.
  const remainder = value.length % 4;
  if (remainder !== 0) {
    value += '='.repeat(4 - remainder);
  }

  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) {
    throw new Error('Base64 inválido (caracteres não permitidos).');
  }

  return value;
}

function base64ToBuffer(base64) {
  const buffer = Buffer.from(base64, 'base64');

  if (!buffer || buffer.length < 5) {
    throw new Error('Conteúdo decodificado inválido ou muito pequeno.');
  }

  return buffer;
}

function isPdf(buffer) {
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

function sanitizeFileName(name) {
  return name
    .replaceAll(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

function buildFallbackName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');

  const date = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}_${pad(now.getMinutes())}`;

  return `${date}_${time}_PDF.pdf`;
}

function ensurePdfExtension(name) {
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

function makeUniquePath(filePath) {
  if (!fs.existsSync(filePath)) {
    return filePath;
  }

  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);

  let counter = 1;
  let candidate;

  do {
    candidate = path.join(dir, `${base}_${counter}${ext}`);
    counter += 1;
  } while (fs.existsSync(candidate));

  return candidate;
}

async function getPdfTitle(buffer) {
  try {
    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    return pdfDoc.getTitle();
  } catch {
    return null;
  }
}

function getDownloadsPath() {
  return path.join(os.homedir(), 'Downloads');
}

function listPdfFilesInDownloads() {
  const downloadsPath = getDownloadsPath();

  if (!fs.existsSync(downloadsPath)) {
    return [];
  }

  const entries = fs.readdirSync(downloadsPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /\.pdf$/i.test(entry.name))
    .map((entry) => {
      const filePath = path.join(downloadsPath, entry.name);
      const stats = fs.statSync(filePath);

      return {
        name: entry.name,
        path: filePath,
        modifiedAt: stats.mtimeMs,
      };
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)
    .slice(0, 50);
}

async function savePdfFromClipboard() {
  const clipboardText = readClipboardText();
  const base64 = normalizeBase64(clipboardText);
  const pdfBuffer = base64ToBuffer(base64);

  if (!isPdf(pdfBuffer)) {
    throw new Error('O conteúdo em Base64 não representa um PDF válido.');
  }

  const rawTitle = await getPdfTitle(pdfBuffer);
  const safeTitle = rawTitle ? sanitizeFileName(rawTitle) : '';

  const finalFileName = safeTitle
    ? ensurePdfExtension(safeTitle.replace(/\.pdf$/i, ''))
    : buildFallbackName();

  const destination = makeUniquePath(path.join(getDownloadsPath(), finalFileName));

  fs.writeFileSync(destination, pdfBuffer);

  return {
    destination,
    fileName: path.basename(destination),
    usedTitle: Boolean(safeTitle),
  };
}

module.exports = {
  normalizeBase64,
  isPdf,
  savePdfFromClipboard,
  listPdfFilesInDownloads,
};
