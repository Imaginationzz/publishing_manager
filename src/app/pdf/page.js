'use client';
import { useState, useRef, useCallback } from 'react';
import { addEntry } from '@/lib/dataStore';

export default function PdfPage() {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(async (selectedFile) => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      alert('يرجى اختيار ملف PDF صالح');
      return;
    }

    setFile(selectedFile);
    setIsLoading(true);
    setExtractedText('');
    setProgress(0);

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPageCount(pdf.numPages);

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        setCurrentPage(i);
        setProgress(Math.round((i / pdf.numPages) * 100));

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');

        fullText += `\n\n— الصفحة ${i} —\n\n${pageText}`;
      }

      const trimmedText = fullText.trim();
      setExtractedText(trimmedText);

      // Push to Data Hub
      addEntry('pdf', selectedFile.name, trimmedText, {
        pageCount: pdf.numPages,
        fileSize: selectedFile.size,
      });
    } catch (err) {
      console.error('PDF extraction error:', err);
      setExtractedText('حدث خطأ أثناء استخراج النص. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      // fallback
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
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace('.pdf', '') || 'extracted'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <h1>📄 تحويل PDF إلى نص</h1>
        <p>استخراج النصوص العربية من ملفات PDF مع الحفاظ على ترتيب النص</p>
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
          <p>يدعم ملفات PDF بالعربية والإنجليزية</p>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div
          className="glass-card"
          style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}
        >
          <span style={{ fontSize: '2rem' }}>📄</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>{file.name}</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
              {pageCount > 0 && ` • ${pageCount} صفحة`}
            </p>
          </div>
          {isLoading && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
                جاري الاستخراج... الصفحة {currentPage}/{pageCount}
              </div>
              <div
                style={{
                  width: '200px',
                  height: '6px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease',
                  }}
                />
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
          <div className="results-panel">
            {extractedText}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            <span>عدد الأحرف: {extractedText.length.toLocaleString('ar-SA')}</span>
            <span>عدد الكلمات: {extractedText.split(/\s+/).filter(Boolean).length.toLocaleString('ar-SA')}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !extractedText && (
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }} />
          <h3>جاري استخراج النص...</h3>
          <p>يرجى الانتظار حتى اكتمال المعالجة</p>
        </div>
      )}
    </div>
  );
}
