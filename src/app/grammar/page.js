'use client';
import { useState, useCallback } from 'react';
import { addEntry } from '@/lib/dataStore';

export default function GrammarPage() {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [language, setLanguage] = useState('ar');

  const checkGrammar = useCallback(async () => {
    if (!text.trim()) return;
    setIsChecking(true);
    setResults(null);

    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text: text,
          language: language,
          enabledOnly: 'false',
        }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setResults(data);

      // Push to Data Hub
      addEntry('grammar', `تدقيق نص (${language === 'ar' ? 'العربية' : language})`, text, {
        errorCount: data.matches?.length || 0,
        language,
      });
    } catch (err) {
      console.error('Grammar check error:', err);
      setResults({ error: true, message: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.' });
    } finally {
      setIsChecking(false);
    }
  }, [text, language]);

  const applySuggestion = (match) => {
    if (match.replacements && match.replacements.length > 0) {
      const replacement = match.replacements[0].value;
      const before = text.substring(0, match.offset);
      const after = text.substring(match.offset + match.length);
      setText(before + replacement + after);

      // Re-check after applying
      setResults(null);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'TYPOS':
      case 'SPELLING': return 'var(--color-error)';
      case 'GRAMMAR': return 'var(--color-warning)';
      case 'STYLE':
      case 'PUNCTUATION': return 'var(--color-info)';
      default: return 'var(--color-primary)';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'TYPOS':
      case 'SPELLING': return 'إملائي';
      case 'GRAMMAR': return 'نحوي';
      case 'STYLE': return 'أسلوب';
      case 'PUNCTUATION': return 'ترقيم';
      default: return 'عام';
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <div>
      <div className="page-header">
        <h1>✏️ التدقيق اللغوي</h1>
        <p>فحص الأخطاء الإملائية والنحوية مع اقتراحات التصحيح</p>
      </div>

      {/* Language Selection & Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ width: 'auto', minWidth: '160px' }}
        >
          <option value="ar">العربية</option>
          <option value="en-US">الإنجليزية</option>
          <option value="fr">الفرنسية</option>
        </select>

        <div style={{ display: 'flex', gap: '16px', color: 'var(--color-text-muted)', fontSize: '0.85rem', alignItems: 'center' }}>
          <span>الأحرف: {charCount.toLocaleString('ar-SA')}</span>
          <span>الكلمات: {wordCount.toLocaleString('ar-SA')}</span>
        </div>

        <div style={{ marginRight: 'auto' }}>
          <button
            className="btn btn-primary"
            onClick={checkGrammar}
            disabled={!text.trim() || isChecking}
          >
            {isChecking ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                جاري الفحص...
              </>
            ) : (
              '🔍 فحص النص'
            )}
          </button>
        </div>
      </div>

      {/* Text Input */}
      <textarea
        className="textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="الصق أو اكتب النص هنا للتدقيق..."
        style={{ minHeight: '250px', fontSize: '1.05rem' }}
      />

      {/* Results */}
      {results && !results.error && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600' }}>نتائج الفحص</h2>
            {results.matches?.length === 0 ? (
              <span className="badge badge-success">✓ لا توجد أخطاء</span>
            ) : (
              <span className="badge badge-warning">{results.matches?.length} خطأ</span>
            )}
          </div>

          {results.matches?.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ color: 'var(--color-success)', marginBottom: '8px' }}>النص سليم!</h3>
              <p style={{ color: 'var(--color-text-secondary)' }}>لم يتم العثور على أخطاء إملائية أو نحوية</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.matches?.map((match, index) => (
                <div
                  key={index}
                  className="glass-card"
                  style={{
                    borderRight: `3px solid ${getCategoryColor(match.rule?.category?.id)}`,
                    padding: '16px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span
                          className="badge"
                          style={{
                            background: `${getCategoryColor(match.rule?.category?.id)}20`,
                            color: getCategoryColor(match.rule?.category?.id),
                          }}
                        >
                          {getCategoryLabel(match.rule?.category?.id)}
                        </span>
                      </div>

                      <p style={{ marginBottom: '8px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                        {match.message}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--color-error)', textDecoration: 'line-through' }}>
                          {text.substring(match.offset, match.offset + match.length)}
                        </span>
                        {match.replacements?.length > 0 && (
                          <>
                            <span style={{ color: 'var(--color-text-muted)' }}>←</span>
                            <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>
                              {match.replacements[0].value}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {match.replacements?.length > 0 && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => applySuggestion(match)}
                        style={{ flexShrink: 0 }}
                      >
                        تطبيق
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {results?.error && (
        <div className="glass-card" style={{ marginTop: '24px', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: 'var(--color-warning)', marginBottom: '8px' }}>حدث خطأ</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>{results.message}</p>
        </div>
      )}
    </div>
  );
}
