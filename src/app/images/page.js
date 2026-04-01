'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { addEntry } from '@/lib/dataStore';

const TEMPLATES = [
  { name: 'غلاف كتاب', width: 600, height: 800, bg: '#1a1a2e' },
  { name: 'شعار مربع', width: 500, height: 500, bg: '#0f0f23' },
  { name: 'بانر عرضي', width: 800, height: 300, bg: '#16213e' },
  { name: 'بطاقة دعوة', width: 500, height: 700, bg: '#1a1a3e' },
  { name: 'ملصق', width: 600, height: 600, bg: '#0a1628' },
];

const COLORS = [
  '#d4a15c', '#e8c87a', '#ffffff', '#f0f0f0',
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#14b8a6', '#a855f7', '#06b6d4', '#84cc16',
];

const FONTS = [
  'Noto Kufi Arabic',
  'Arial',
  'Georgia',
  'Impact',
  'Courier New',
];

const SHAPES = ['rect', 'circle', 'triangle', 'line', 'star'];

export default function ImagesPage() {
  const canvasRef = useRef(null);
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeTool, setActiveTool] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(36);
  const [selectedColor, setSelectedColor] = useState('#d4a15c');
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [gallery, setGallery] = useState([]);

  // Draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = template.width;
    canvas.height = template.height;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw elements
    elements.forEach((el, idx) => {
      ctx.save();

      if (el.type === 'text') {
        ctx.fillStyle = el.color;
        ctx.font = `${el.bold ? 'bold ' : ''}${el.fontSize}px ${el.font}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el.content, el.x, el.y);
      } else if (el.type === 'rect') {
        ctx.fillStyle = el.color;
        ctx.fillRect(el.x - el.size / 2, el.y - el.size / 2, el.size, el.size * 0.6);
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(el.x, el.y, el.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = el.color;
        ctx.fill();
      } else if (el.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(el.x, el.y - el.size / 2);
        ctx.lineTo(el.x - el.size / 2, el.y + el.size / 2);
        ctx.lineTo(el.x + el.size / 2, el.y + el.size / 2);
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();
      } else if (el.type === 'line') {
        ctx.beginPath();
        ctx.moveTo(el.x - el.size / 2, el.y);
        ctx.lineTo(el.x + el.size / 2, el.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (el.type === 'star') {
        drawStar(ctx, el.x, el.y, 5, el.size / 2, el.size / 4, el.color);
      }

      // Selection outline
      if (idx === selectedElement) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(el.x - (el.size || el.fontSize * 2) / 2 - 5, el.y - (el.size || el.fontSize) / 2 - 5,
          (el.size || el.fontSize * 4) + 10, (el.size || el.fontSize) + 10);
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }, [elements, template, bgColor, selectedElement]);

  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, color) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  useEffect(() => { drawCanvas(); }, [drawCanvas]);

  const addText = () => {
    if (!textInput.trim()) return;
    setElements(prev => [...prev, {
      type: 'text',
      content: textInput,
      x: template.width / 2,
      y: template.height / 2,
      color: selectedColor,
      font: selectedFont,
      fontSize: fontSize,
      bold: false,
    }]);
    setTextInput('');
  };

  const addShape = (shape) => {
    setElements(prev => [...prev, {
      type: shape,
      x: template.width / 2,
      y: template.height / 2,
      size: 80,
      color: selectedColor,
    }]);
  };

  const moveElement = (idx, dx, dy) => {
    setElements(prev => prev.map((el, i) =>
      i === idx ? { ...el, x: el.x + dx, y: el.y + dy } : el
    ));
  };

  const deleteElement = (idx) => {
    setElements(prev => prev.filter((_, i) => i !== idx));
    setSelectedElement(null);
  };

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = template.width / rect.width;
    const scaleY = template.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Find clicked element
    let foundIdx = -1;
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const size = el.size || el.fontSize * 3;
      if (Math.abs(x - el.x) < size / 2 + 20 && Math.abs(y - el.y) < size / 2 + 20) {
        foundIdx = i;
        break;
      }
    }
    setSelectedElement(foundIdx >= 0 ? foundIdx : null);
  };

  const exportImage = (format) => {
    const canvas = canvasRef.current;
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const link = document.createElement('a');
    link.download = `design.${format}`;
    link.href = canvas.toDataURL(mimeType, 0.95);
    link.click();
  };

  const saveToGallery = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setGallery(prev => [...prev, { src: dataUrl, date: new Date().toLocaleString('ar-SA') }]);

    // Push to Data Hub (store small thumbnail)
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = Math.round(200 * (template.height / template.width));
    const thumbCtx = thumbCanvas.getContext('2d');
    thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);

    addEntry('image', `تصميم — ${template.name}`, '', {
      template: template.name,
      dimensions: `${template.width}×${template.height}`,
      elementCount: elements.length,
      dataUrl: thumbUrl,
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1>🎨 مولّد الصور والشعارات</h1>
        <p>أداة تصميم احترافية لإنشاء شعارات وأغلفة الكتب</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Canvas Area */}
        <div>
          <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-md)',
                cursor: 'crosshair',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {/* Export Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => exportImage('png')}>💾 تحميل PNG</button>
            <button className="btn btn-secondary btn-sm" onClick={() => exportImage('jpg')}>💾 تحميل JPG</button>
            <button className="btn btn-gold btn-sm" onClick={saveToGallery}>📁 حفظ في المعرض</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setElements([]); setSelectedElement(null); }}>🗑️ مسح الكل</button>
          </div>

          {/* Element Controls */}
          {selectedElement !== null && elements[selectedElement] && (
            <div className="glass-card" style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>العنصر المحدد:</span>
              <button className="btn btn-sm btn-secondary" onClick={() => moveElement(selectedElement, 0, -10)}>⬆</button>
              <button className="btn btn-sm btn-secondary" onClick={() => moveElement(selectedElement, 0, 10)}>⬇</button>
              <button className="btn btn-sm btn-secondary" onClick={() => moveElement(selectedElement, 10, 0)}>⬅</button>
              <button className="btn btn-sm btn-secondary" onClick={() => moveElement(selectedElement, -10, 0)}>➡</button>
              <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: 'white' }} onClick={() => deleteElement(selectedElement)}>🗑️ حذف</button>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Template Selection */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-gold)' }}>📐 القالب</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${template.name === t.name ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setTemplate(t); setBgColor(t.bg); }}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {t.name} ({t.width}×{t.height})
                </button>
              ))}
            </div>
          </div>

          {/* Background Color */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-gold)' }}>🎨 لون الخلفية</h3>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: '100%', height: '36px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent' }}
            />
          </div>

          {/* Add Text */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-gold)' }}>✍️ إضافة نص</h3>
            <input
              className="input"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="اكتب النص..."
              style={{ marginBottom: '8px' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select className="select" value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} style={{ flex: 1 }}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <input
                type="number"
                className="input"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                min="12"
                max="120"
                style={{ width: '70px' }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={addText} style={{ width: '100%' }}>➕ إضافة نص</button>
          </div>

          {/* Colors */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-gold)' }}>🎨 الألوان</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: c,
                    border: selectedColor === c ? '3px solid white' : '2px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>

          {/* Shapes */}
          <div className="glass-card">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', color: 'var(--color-gold)' }}>⬡ الأشكال</h3>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { shape: 'rect', icon: '▬' },
                { shape: 'circle', icon: '●' },
                { shape: 'triangle', icon: '▲' },
                { shape: 'line', icon: '━' },
                { shape: 'star', icon: '★' },
              ].map(({ shape, icon }) => (
                <button key={shape} className="btn btn-sm btn-secondary" onClick={() => addShape(shape)}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {gallery.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px' }}>📁 المعرض</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {gallery.map((item, i) => (
              <div key={i} className="glass-card" style={{ padding: '8px' }}>
                <img
                  src={item.src}
                  alt={`تصميم ${i + 1}`}
                  style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: '6px' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{item.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
