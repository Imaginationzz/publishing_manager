'use client';
import { useState, useCallback } from 'react';

export default function BooksPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('q');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('search');

  const searchBooks = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResults([]);
    setSelectedBook(null);

    try {
      const url = `https://openlibrary.org/search.json?${searchType}=${encodeURIComponent(query)}&limit=20&language=ara`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.docs || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, searchType]);

  const getCoverUrl = (coverId, size = 'M') => {
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  };

  const toggleBookmark = (book) => {
    setBookmarks(prev => {
      const exists = prev.find(b => b.key === book.key);
      if (exists) {
        return prev.filter(b => b.key !== book.key);
      }
      return [...prev, book];
    });
  };

  const isBookmarked = (key) => bookmarks.some(b => b.key === key);

  return (
    <div>
      <div className="page-header">
        <h1>📚 بحث الكتب والمؤلفين</h1>
        <p>البحث عن معلومات الكتب من مكتبة Open Library العالمية</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: '400px' }}>
        <button className={`tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
          🔍 بحث
        </button>
        <button className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`} onClick={() => setActiveTab('bookmarks')}>
          🔖 المحفوظات ({bookmarks.length})
        </button>
      </div>

      {activeTab === 'search' ? (
        <>
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <select
              className="select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="q">بحث عام</option>
              <option value="title">عنوان الكتاب</option>
              <option value="author">اسم المؤلف</option>
              <option value="isbn">رقم ISBN</option>
              <option value="subject">الموضوع</option>
            </select>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchBooks()}
              placeholder="ابحث عن كتاب أو مؤلف..."
              style={{ flex: 1, minWidth: '250px' }}
            />
            <button className="btn btn-primary" onClick={searchBooks} disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              ) : (
                '🔍 بحث'
              )}
            </button>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="empty-state">
              <div className="spinner" style={{ marginBottom: '16px' }} />
              <h3>جاري البحث...</h3>
            </div>
          )}

          {/* Selected Book Detail */}
          {selectedBook && (
            <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedBook(null)}
                style={{ position: 'absolute', top: '12px', left: '12px' }}
              >
                ✕ إغلاق
              </button>
              {selectedBook.cover_i && (
                <img
                  src={getCoverUrl(selectedBook.cover_i, 'L')}
                  alt={selectedBook.title}
                  style={{
                    width: '180px',
                    height: 'auto',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
                  {selectedBook.title}
                </h2>
                {selectedBook.subtitle && (
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '12px', fontSize: '1rem' }}>
                    {selectedBook.subtitle}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {selectedBook.author_name && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>المؤلف:</span>
                      <span style={{ color: 'var(--color-gold-light)' }}>{selectedBook.author_name.join('، ')}</span>
                    </div>
                  )}
                  {selectedBook.first_publish_year && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>سنة النشر:</span>
                      <span>{selectedBook.first_publish_year}</span>
                    </div>
                  )}
                  {selectedBook.publisher && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>الناشر:</span>
                      <span>{selectedBook.publisher?.slice(0, 3).join('، ')}</span>
                    </div>
                  )}
                  {selectedBook.number_of_pages_median && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>الصفحات:</span>
                      <span>{selectedBook.number_of_pages_median}</span>
                    </div>
                  )}
                  {selectedBook.isbn && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>ISBN:</span>
                      <span style={{ fontFamily: 'var(--font-latin)', direction: 'ltr' }}>{selectedBook.isbn[0]}</span>
                    </div>
                  )}
                  {selectedBook.language && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)', minWidth: '80px' }}>اللغات:</span>
                      <span>{selectedBook.language.join('، ')}</span>
                    </div>
                  )}
                </div>

                {selectedBook.subject && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: '6px' }}>المواضيع:</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {selectedBook.subject.slice(0, 8).map((s, i) => (
                        <span key={i} className="tag">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    className={`btn btn-sm ${isBookmarked(selectedBook.key) ? 'btn-gold' : 'btn-secondary'}`}
                    onClick={() => toggleBookmark(selectedBook)}
                  >
                    {isBookmarked(selectedBook.key) ? '🔖 تم الحفظ' : '🔖 حفظ'}
                  </button>
                  <a
                    href={`https://openlibrary.org${selectedBook.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    🔗 Open Library
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                تم العثور على {results.length} نتيجة
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {results.map((book) => (
                  <div
                    key={book.key}
                    className="glass-card"
                    style={{ cursor: 'pointer', padding: '16px', display: 'flex', gap: '12px' }}
                    onClick={() => setSelectedBook(book)}
                  >
                    {book.cover_i ? (
                      <img
                        src={getCoverUrl(book.cover_i, 'S')}
                        alt={book.title}
                        style={{
                          width: '60px',
                          height: '85px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '60px',
                          height: '85px',
                          borderRadius: '6px',
                          background: 'var(--color-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0,
                        }}
                      >
                        📕
                      </div>
                    )}
                    <div style={{ overflow: 'hidden' }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {book.title}
                      </h3>
                      {book.author_name && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', marginBottom: '4px' }}>
                          {book.author_name.slice(0, 2).join('، ')}
                        </p>
                      )}
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {book.first_publish_year && `${book.first_publish_year}`}
                        {book.edition_count && ` • ${book.edition_count} طبعة`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && results.length === 0 && !selectedBook && (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <h3>ابحث عن كتاب أو مؤلف</h3>
              <p>استخدم شريط البحث للعثور على معلومات الكتب من حول العالم</p>
            </div>
          )}
        </>
      ) : (
        /* Bookmarks Tab */
        <div>
          {bookmarks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔖</div>
              <h3>لا توجد كتب محفوظة</h3>
              <p>احفظ الكتب من نتائج البحث للرجوع إليها لاحقاً</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {bookmarks.map((book) => (
                <div
                  key={book.key}
                  className="glass-card"
                  style={{ padding: '16px', display: 'flex', gap: '12px' }}
                >
                  {book.cover_i ? (
                    <img
                      src={getCoverUrl(book.cover_i, 'S')}
                      alt={book.title}
                      style={{ width: '60px', height: '85px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: '60px', height: '85px', borderRadius: '6px', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>📕</div>
                  )}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>{book.title}</h3>
                    {book.author_name && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', marginBottom: '8px' }}>
                        {book.author_name.slice(0, 2).join('، ')}
                      </p>
                    )}
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--color-error)', color: 'white', fontSize: '0.8rem' }}
                      onClick={() => toggleBookmark(book)}
                    >
                      إزالة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
