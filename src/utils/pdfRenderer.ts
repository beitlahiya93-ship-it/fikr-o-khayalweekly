import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('Could not set workerSrc from unpkg', e);
}

export interface RenderedPage {
  pageNumber: number;
  imageUrl: string;
  title: string;
  sizeKb?: number;
}

/**
 * Calculates byte size of a data URL
 */
export function getDataUrlSizeInBytes(dataUrl: string): number {
  const base64Str = dataUrl.split(',')[1] || '';
  return Math.round((base64Str.length * 3) / 4);
}

/**
 * Compresses a canvas into a JPEG data URL targeted at 40 KB - 60 KB
 */
function compressCanvasToTargetSize(
  sourceCanvas: HTMLCanvasElement,
  targetMinKb = 40,
  targetMaxKb = 60
): { dataUrl: string; sizeKb: number } {
  // Start with standard readable broadsheet width
  let currentWidth = Math.min(1050, sourceCanvas.width);
  let currentHeight = Math.round((currentWidth / sourceCanvas.width) * sourceCanvas.height);

  let canvas = document.createElement('canvas');
  canvas.width = currentWidth;
  canvas.height = currentHeight;
  let ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight);
  }

  let quality = 0.65;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  let sizeKb = Number((getDataUrlSizeInBytes(dataUrl) / 1024).toFixed(1));

  // Loop to converge within 40 KB - 60 KB target
  for (let iter = 0; iter < 8; iter++) {
    if (sizeKb >= targetMinKb && sizeKb <= targetMaxKb) {
      break;
    }

    if (sizeKb > targetMaxKb) {
      if (quality > 0.35) {
        quality = Math.max(0.25, quality - 0.12);
      } else {
        currentWidth = Math.round(currentWidth * 0.88);
        currentHeight = Math.round(currentHeight * 0.88);
        const nextCanvas = document.createElement('canvas');
        nextCanvas.width = currentWidth;
        nextCanvas.height = currentHeight;
        const nCtx = nextCanvas.getContext('2d');
        if (nCtx) {
          nCtx.fillStyle = '#ffffff';
          nCtx.fillRect(0, 0, currentWidth, currentHeight);
          nCtx.drawImage(canvas, 0, 0, currentWidth, currentHeight);
          canvas = nextCanvas;
        }
      }
    } else if (sizeKb < targetMinKb) {
      if (quality < 0.90) {
        quality = Math.min(0.95, quality + 0.12);
      } else {
        if (currentWidth < sourceCanvas.width) {
          currentWidth = Math.min(sourceCanvas.width, Math.round(currentWidth * 1.15));
          currentHeight = Math.round((currentWidth / sourceCanvas.width) * sourceCanvas.height);
          const nextCanvas = document.createElement('canvas');
          nextCanvas.width = currentWidth;
          nextCanvas.height = currentHeight;
          const nCtx = nextCanvas.getContext('2d');
          if (nCtx) {
            nCtx.fillStyle = '#ffffff';
            nCtx.fillRect(0, 0, currentWidth, currentHeight);
            nCtx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight);
            canvas = nextCanvas;
          }
        } else {
          break;
        }
      }
    }

    dataUrl = canvas.toDataURL('image/jpeg', quality);
    sizeKb = Number((getDataUrlSizeInBytes(dataUrl) / 1024).toFixed(1));
  }

  return { dataUrl, sizeKb };
}

/**
 * Render a PDF file into an array of page image data URLs (JPEG)
 * Strictly compressed to ~40 to 60 KB per page to optimize Supabase Cloud storage
 */
export async function renderPdfToImages(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<RenderedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pages: RenderedPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    // Render at scale 1.5 for crisp glyphs
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Compress to 40 - 60 KB
      const { dataUrl, sizeKb } = compressCanvasToTargetSize(canvas, 40, 60);

      pages.push({
        pageNumber: pageNum,
        title: `Page No ${pageNum}`,
        imageUrl: dataUrl,
        sizeKb,
      });
    }

    if (onProgress) {
      onProgress(pageNum, numPages);
    }
  }

  return pages;
}

/**
 * Read image file and optimize to 40 - 60 KB target
 */
export function readAndCompressImageFile(file: File): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const result = compressCanvasToTargetSize(canvas, 40, 60);
          resolve(result);
        } else {
          reject(new Error('Canvas context error'));
        }
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a data URL to a binary Blob for cloud upload
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
