'use client';
import { useState, useRef, useCallback } from 'react';
import { addEntry } from '@/lib/dataStore';

// We load pdf.js directly from CDN via browser-native import()
// This completely bypasses Next.js/Turbopack bundling issues
const PDFJS_VERSION = '5.6.205';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;

let pdfjsLibCache = null;

async function loadPdfJs() {
  if (pdfjsLibCache) return pdfjsLibCache;
  const pdfjsLib = await import(/* webpackIgnore: true */ `${CDN_BASE}/build/pdf.min.mjs`);
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${CDN_BASE}/build/pdf.worker.min.mjs`;
  pdfjsLibCache = pdfjsLib;
  return pdfjsLib;
}

export default function PdfPage() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ocrMode, setOcrMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [tofuDetected, setTofuDetected] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (selectedFile, forceOcr = false) => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      alert('يرجى اختيار ملف PDF صالح');
      return;
    }

    console.log('PDF Extraction started. Mode:', forceOcr || ocrMode ? 'OCR' : 'Fast');
    setFile(selectedFile);
    setIsLoading(true);
    setExtractedText('');
    setProgress(0);
    setTofuDetected(false);
    const useOcr = forceOcr || ocrMode;

    // Background Keep-Alive Trick: Start silent audio to prevent tab throttling
    let audioContext = null;
    let oscillator = null;
    if (useOcr) {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioCtx();
        oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0; // Absolute silence
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start();
      } catch (e) {
        console.warn('Background keep-alive failed to start:', e);
      }
    }

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `${CDN_BASE}/cmaps/`,
        cMapPacked: true,
        standardFontDataUrl: `${CDN_BASE}/standard_fonts/`,
      }).promise;

      setPageCount(pdf.numPages);
      let fullTextArray = new Array(pdf.numPages);
      let localTofuDetected = false;

      if (!useOcr) {
        setStatusMessage('جاري الاستخراج السريع...');
        for (let i = 1; i <= pdf.numPages; i++) {
          setCurrentPage(i);
          setProgress(Math.round((i / pdf.numPages) * 100));
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items.map(item => item.str).join(' ');
          
          // Improved Tofu Detection: Check for replacement chars, Private Use Area, or excessive control codes
          if (
            pageText.includes('\uFFFD') || 
            /[\uE000-\uF8FF]/.test(pageText) || 
            (pageText.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g) || []).length > 20
          ) {
            localTofuDetected = true;
          }
          
          fullTextArray[i - 1] = pageText;
        }
      } else {
        setStatusMessage('جاري تهيئة محرك OCR المتوازي...');
        const { createWorker, createScheduler } = await import('tesseract.js');
        
        const scheduler = createScheduler();
        const numWorkers = Math.min(4, navigator.hardwareConcurrency || 4);
        
        for (let w = 0; w < numWorkers; w++) {
          const worker = await createWorker('ara', 1, {
            workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/worker.min.js',
            corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js',
          });
          scheduler.addWorker(worker);
        }

        const pagesToProcess = pdf.numPages;
        let finishedPages = 0;
        let nextToRender = 1;

        // Memory-safe worker loop
        const runWorker = async () => {
          while (nextToRender <= pagesToProcess) {
            const idx = nextToRender++;
            try {
              const page = await pdf.getPage(idx);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;

              await page.render({ canvasContext: context, viewport }).promise;
              
              context.globalCompositeOperation = 'destination-over';
              context.fillStyle = '#ffffff';
              context.fillRect(0, 0, canvas.width, canvas.height);
              
              const dataUrl = canvas.toDataURL('image/png');
              
              // Clear canvas memory immediately
              canvas.width = 1;
              canvas.height = 1;

              const { data: { text } } = await scheduler.addJob('recognize', dataUrl);
              
              fullTextArray[idx - 1] = text;
              finishedPages++;
              setCurrentPage(finishedPages);
              setProgress(Math.round((finishedPages / pagesToProcess) * 100));
              setStatusMessage(`جاري معالجة الصفحات... (${finishedPages}/${pagesToProcess})`);
            } catch (err) {
              console.error(`Error on page ${idx}:`, err);
              fullTextArray[idx - 1] = `[خطأ في الصفحة ${idx}]`;
            }
          }
        };

        // Launch concurrent worker loops (matching numWorkers)
        const workerThreads = [];
        for (let i = 0; i < numWorkers; i++) {
          workerThreads.push(runWorker());
        }

        await Promise.all(workerThreads);
        await scheduler.terminate();
      }

      setTofuDetected(localTofuDetected);

      const finalText = fullTextArray.join('\n\n')
        .replace(/\uFFFD/g, '')
        .replace(/[\uE000-\uF8FF]/g, ' ') // Clear Private Use Area artifacts
        .replace(/  +/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!finalText || finalText.replace(/—\s*الصفحة\s*\d+\s*—/g, '').trim().length === 0) {
        setExtractedText('لم يتم العثور على نص. يرجى تجربة وضع OCR إذا لم تقم بذلك بالفعل.');
      } else {
        setExtractedText(finalText);
        addEntry('pdf', selectedFile.name, finalText, {
          pageCount: pdf.numPages,
          fileSize: selectedFile.size,
          mode: useOcr ? 'OCR' : 'Fast',
          tofuDetected: localTofuDetected
        });
      }
    } catch (err) {
      console.error('Extraction Error:', err);
      setExtractedText(`حدث خطأ أثناء الاستخراج: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
      setStatusMessage('');
      if (audioContext) {
        try {
          oscillator?.stop();
          audioContext.close();
        } catch (e) {
          console.error('Audio cleanup error:', e);
        }
      }
    }
  }, [ocrMode]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }, [handleFile]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = extractedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadText = () => {
    const isArabic = /[\u0600-\u06FF]/.test(extractedText);
    
    let finalContent = extractedText;
    if (isArabic) {
      // Prepend RTL mark to every line to force editors to right-align each block
      const lines = extractedText.split('\n');
      const rtlLines = lines.map(line => line.trim() ? '\u200f' + line : line);
      // Add UTF-8 BOM and Arabic Letter Mark (ALM) at the very start
      finalContent = '\ufeff\u061c' + rtlLines.join('\n');
    }
    
    const blob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace('.pdf', '') || 'extracted'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTextArabic = /[\u0600-\u06FF]/.test(extractedText);

  return (
    <div>
      <div className="page-header">
        <h1>📄 تحويل PDF إلى نص</h1>
        <p>استخراج النصوص العربية بدقة عالية باستخدام تقنيات OCR المتقدمة</p>
      </div>

      {/* Mode Switches */}
      <div className="glass-card" style={{ marginBottom: '20px', padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ fontWeight: '600' }}>وضع الاستخراج:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={!ocrMode} onChange={() => setOcrMode(false)} />
            <span>سريع (Native)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={ocrMode} onChange={() => setOcrMode(true)} />
            <span>عميق (OCR) - أدق للملفات الصعبة</span>
          </label>
        </div>
        <div style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          💡 نصيحة: البقاء في هذه الصفحة يجعل الاستخراج أسرع بـ 10 أضعاف.
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div className="upload-zone-content">
          <div className="upload-zone-icon">📂</div>
          <h3>{dragOver ? 'أفلت الملف هنا' : 'اسحب ملف PDF أو انقر للاختيار'}</h3>
          <p>يدعم ملفات PDF المكتوبة والمصورة</p>
        </div>
      </div>

      {/* Tofu Notification */}
      {tofuDetected && !ocrMode && (
        <div className="glass-card" style={{ marginTop: '20px', border: '1px solid #ffc107', background: 'rgba(255, 193, 7, 0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: '#ffc107', marginBottom: '4px' }}>جودة النص قد تكون ضعيفة</h4>
              <p style={{ fontSize: '0.85rem' }}>تم اكتشاف رموز غير مدعومة. ننصح باستخدام **"الوضع العميق (OCR)"** للحصول على نتائج أفضل.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleFile(file, true)}>
              تجربة وضع OCR
            </button>
          </div>
        </div>
      )}

      {/* File Info / Progress */}
      {file && (
        <div className="glass-card" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '2rem' }}>📄</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{file.name}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount > 0 ? `${pageCount} صفحة` : 'جاري التحليل...'}
            </p>
          </div>
          {isLoading && (
            <div style={{ textAlign: 'left', minWidth: '200px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
                {statusMessage} ({progress}%)
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--color-surface)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {extractedText && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>النص المستخرج</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={copyToClipboard}>
                {copied ? '✓ تم النسخ' : '📋 نسخ'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={downloadText}>
                💾 تحميل كـ TXT
              </button>
            </div>
          </div>
          <div 
            className="results-panel" 
            style={{ 
              whiteSpace: 'pre-wrap', 
              direction: isTextArabic ? 'rtl' : 'ltr',
              textAlign: isTextArabic ? 'right' : 'left'
            }}
          >
            {extractedText}
          </div>
        </div>
      )}
    </div>
  );
}
