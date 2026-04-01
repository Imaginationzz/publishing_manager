'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getAllEntries,
  deleteEntry,
  clearAllEntries,
  searchEntries,
  getStats,
  getTypeInfo,
  exportAllData,
  importData,
} from '@/lib/dataStore';

const TABS = [
  { id: 'feed', label: 'السجل', icon: '📋' },
  { id: 'insights', label: 'الإحصائيات', icon: '📊' },
  { id: 'tools', label: 'أدوات البيانات', icon: '🔧' },
];

const FILTER_TYPES = [
  { value: 'all', label: 'الكل', icon: '🗂️' },
  { value: 'pdf', label: 'PDF', icon: '📄' },
  { value: 'grammar', label: 'تدقيق', icon: '✏️' },
  { value: 'image', label: 'تصميم', icon: '🎨' },
  { value: 'book', label: 'كتب', icon: '📚' },
];

export default function DataHubPage() {
  const [activeTab, setActiveTab] = useState('feed');
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [stats, setStats] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  const fileInputRef = useRef(null);

  // Load data
  const refreshData = useCallback(() => {
    const allEntries = search.trim()
      ? searchEntries(search)
      : getAllEntries();

    let filtered = filterType === 'all'
      ? allEntries
      : allEntries.filter(e => e.type === filterType);

    // Sort
    if (sortOrder === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (sortOrder === 'words-desc') {
      filtered = [...filtered].sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
    }

    setEntries(filtered);
    setStats(getStats());
  }, [search, filterType, sortOrder]);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleDelete = (id) => {
    deleteEntry(id);
    setExpandedId(null);
    refreshData();
  };

  const handleClearAll = () => {
    clearAllEntries();
    setConfirmClear(false);
    refreshData();
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `publishing-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importData(data);
      setImportMessage({ type: 'success', text: `تم استيراد ${result.importedEntries} سجل جديد بنجاح` });
      refreshData();
    } catch (err) {
      setImportMessage({ type: 'error', text: 'فشل استيراد البيانات. تأكد من صيغة الملف.' });
    }

    setTimeout(() => setImportMessage(null), 4000);
    e.target.value = '';
  };

  const copyContent = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'الآن';
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays < 7) return `منذ ${diffDays} يوم`;
      return formatDate(iso);
    } catch {
      return iso;
    }
  };

  // ═══════════════════════════════════════
  // RENDER — FEED TAB
  // ═══════════════════════════════════════
  const renderFeed = () => (
    <div>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث في جميع البيانات..."
            style={{ paddingRight: '16px' }}
          />
        </div>

        <select
          className="select"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="words-desc">الأكثر كلمات</option>
        </select>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTER_TYPES.map((ft) => {
          const isActive = filterType === ft.value;
          return (
            <button
              key={ft.value}
              onClick={() => setFilterType(ft.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isActive
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))'
                  : 'var(--color-surface)',
                color: isActive ? 'white' : 'var(--color-text-secondary)',
                fontSize: '0.88rem',
                fontFamily: 'var(--font-arabic)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              <span>{ft.icon}</span>
              {ft.label}
              {isActive && ft.value !== 'all' && (
                <span
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '1px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                  }}
                >
                  {entries.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Entries Count */}
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: '0.85rem',
        marginBottom: '16px',
      }}>
        {entries.length === 0 ? 'لا توجد نتائج' : `${entries.length} سجل`}
      </p>

      {/* Entry Cards */}
      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🗂️</div>
          <h3>{search ? 'لا توجد نتائج مطابقة' : 'لا توجد بيانات بعد'}</h3>
          <p>{search ? 'جرب كلمات بحث مختلفة' : 'ابدأ باستخدام أدوات النشر وستظهر البيانات هنا تلقائياً'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map((entry, idx) => {
            const typeInfo = getTypeInfo(entry.type);
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="glass-card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                  transition: `all 0.4s ease-out ${idx * 0.03}s`,
                  borderRight: `3px solid ${typeInfo.color}`,
                }}
              >
                {/* Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Type Icon */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--radius-md)',
                      background: `${typeInfo.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem',
                      flexShrink: 0,
                    }}
                  >
                    {typeInfo.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.title}
                      </h3>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          fontWeight: '500',
                          background: `${typeInfo.color}20`,
                          color: typeInfo.color,
                          flexShrink: 0,
                        }}
                      >
                        {typeInfo.labelAr}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '0.78rem',
                      color: 'var(--color-text-muted)',
                    }}>
                      <span>{formatRelativeTime(entry.createdAt)}</span>
                      {entry.wordCount > 0 && <span>{entry.wordCount.toLocaleString('ar-SA')} كلمة</span>}
                      {entry.charCount > 0 && <span>{entry.charCount.toLocaleString('ar-SA')} حرف</span>}
                    </div>

                    {/* Preview snippet */}
                    {!isExpanded && entry.content && (
                      <p style={{
                        fontSize: '0.82rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '600px',
                      }}>
                        {entry.content.substring(0, 150)}...
                      </p>
                    )}
                  </div>

                  {/* Expand Arrow */}
                  <span style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                    flexShrink: 0,
                  }}>
                    ◀
                  </span>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '0 20px 16px',
                      borderTop: '1px solid var(--color-border)',
                    }}
                  >
                    {/* Metadata */}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        padding: '12px 0',
                        borderBottom: entry.content ? '1px solid var(--color-border)' : 'none',
                        marginBottom: entry.content ? '12px' : '0',
                      }}>
                        {entry.metadata.pageCount && (
                          <span className="tag">📄 {entry.metadata.pageCount} صفحة</span>
                        )}
                        {entry.metadata.errorCount !== undefined && (
                          <span className="tag">⚠️ {entry.metadata.errorCount} خطأ</span>
                        )}
                        {entry.metadata.language && (
                          <span className="tag">🌐 {entry.metadata.language === 'ar' ? 'العربية' : entry.metadata.language}</span>
                        )}
                        {entry.metadata.author && (
                          <span className="tag">✍️ {entry.metadata.author}</span>
                        )}
                        {entry.metadata.year && (
                          <span className="tag">📅 {entry.metadata.year}</span>
                        )}
                        {entry.metadata.isbn && (
                          <span className="tag" style={{ fontFamily: 'var(--font-latin)', direction: 'ltr' }}>
                            📖 {entry.metadata.isbn}
                          </span>
                        )}
                        {entry.metadata.template && (
                          <span className="tag">📐 {entry.metadata.template}</span>
                        )}
                        {entry.metadata.fileSize && (
                          <span className="tag">💾 {(entry.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        )}
                      </div>
                    )}

                    {/* Full content */}
                    {entry.content && (
                      <div
                        className="results-panel"
                        style={{
                          maxHeight: '300px',
                          fontSize: '0.9rem',
                          marginBottom: '12px',
                        }}
                      >
                        {entry.content}
                      </div>
                    )}

                    {/* Image preview */}
                    {entry.metadata?.dataUrl && (
                      <div style={{ marginBottom: '12px' }}>
                        <img
                          src={entry.metadata.dataUrl}
                          alt={entry.title}
                          style={{
                            maxWidth: '300px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {entry.content && (
                        <button className="btn btn-sm btn-secondary" onClick={() => copyContent(entry.content)}>
                          📋 نسخ المحتوى
                        </button>
                      )}
                      <button
                        className="btn btn-sm"
                        style={{ background: 'var(--color-error)', color: 'white' }}
                        onClick={() => handleDelete(entry.id)}
                      >
                        🗑️ حذف
                      </button>
                    </div>

                    {/* Timestamps */}
                    <p style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '10px',
                    }}>
                      تاريخ الإنشاء: {formatDate(entry.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════
  // RENDER — INSIGHTS TAB
  // ═══════════════════════════════════════
  const renderInsights = () => {
    if (!stats) return null;

    const maxTypeCount = Math.max(1, ...Object.values(stats.byType));

    return (
      <div>
        {/* Summary Stats */}
        <div className="grid-4" style={{ marginBottom: '28px' }}>
          {[
            { label: 'إجمالي السجلات', value: stats.totalEntries, icon: '📊', color: 'var(--color-primary)' },
            { label: 'إجمالي الكلمات', value: stats.totalWords.toLocaleString('ar-SA'), icon: '📝', color: 'var(--color-gold)' },
            { label: 'إجمالي الأحرف', value: stats.totalChars.toLocaleString('ar-SA'), icon: '🔤', color: 'var(--color-accent)' },
            { label: 'وقت القراءة', value: `${stats.totalReadingMinutes} دقيقة`, icon: '⏱️', color: 'var(--color-success)' },
          ].map((stat, i) => (
            <div
              key={i}
              className="stat-card"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                transition: `all 0.4s ease-out ${i * 0.08}s`,
              }}
            >
              <div className="stat-card-icon" style={{ background: `${stat.color}20`, fontSize: '1.3rem' }}>
                {stat.icon}
              </div>
              <div className="stat-card-info">
                <h3 style={{ color: stat.color }}>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid-2" style={{ marginBottom: '28px' }}>
          {/* Module Breakdown */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--color-gold)' }}>
              📊 توزيع البيانات حسب النوع
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {Object.entries(stats.byType).map(([type, count]) => {
                const info = getTypeInfo(type);
                const percentage = maxTypeCount > 0 ? (count / maxTypeCount) * 100 : 0;
                return (
                  <div key={type}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <span>{info.icon}</span>
                        {info.labelAr}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-latin)',
                        fontWeight: '600',
                        color: info.color,
                        fontSize: '0.95rem',
                      }}>
                        {count}
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-full)',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${info.color}, ${info.color}80)`,
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.6s ease-out',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--color-gold)' }}>
              💡 إحصائيات سريعة
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>متوسط الكلمات لكل سجل</span>
                <span style={{ fontWeight: '700', color: 'var(--color-primary)', fontSize: '1.1rem', fontFamily: 'var(--font-latin)' }}>
                  {stats.avgWordCount}
                </span>
              </div>

              {stats.mostProductiveDay && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>أكثر يوم إنتاجية</span>
                  <span style={{ fontWeight: '600', color: 'var(--color-gold)', fontSize: '0.9rem' }}>
                    {new Date(stats.mostProductiveDay).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}> ({stats.maxDayCount} سجل)</span>
                  </span>
                </div>
              )}

              {/* Task Status */}
              <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '10px' }}>حالة المهام</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { label: 'انتظار', count: stats.tasksByStatus.waiting, color: 'var(--color-warning)' },
                    { label: 'تنفيذ', count: stats.tasksByStatus.progress, color: 'var(--color-info)' },
                    { label: 'مكتمل', count: stats.tasksByStatus.done, color: 'var(--color-success)' },
                  ].map((s, i) => (
                    <div key={i} style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      background: `${s.color}10`,
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${s.color}20`,
                    }}>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: s.color, fontFamily: 'var(--font-latin)' }}>
                        {s.count}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Timeline (Last 30 Days) */}
        <div className="glass-card" style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--color-gold)' }}>
            📅 النشاط خلال آخر 30 يوماً
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '3px',
            height: '120px',
            padding: '0 4px',
          }}>
            {stats.last30Days.map((day, i) => {
              const height = stats.maxActivityCount > 0
                ? Math.max(4, (day.count / stats.maxActivityCount) * 100)
                : 4;
              return (
                <div
                  key={i}
                  title={`${day.label}: ${day.count} سجل`}
                  style={{
                    flex: 1,
                    height: `${day.count > 0 ? height : 4}%`,
                    background: day.count > 0
                      ? 'linear-gradient(180deg, var(--color-primary), var(--color-accent))'
                      : 'var(--color-surface)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'height 0.4s ease-out',
                    cursor: 'pointer',
                    minWidth: '6px',
                    opacity: day.count > 0 ? 1 : 0.3,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.boxShadow = '0 0 8px var(--color-primary-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = day.count > 0 ? '1' : '0.3';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              );
            })}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '0.7rem',
            color: 'var(--color-text-muted)',
          }}>
            <span>{stats.last30Days[0]?.label}</span>
            <span>{stats.last30Days[14]?.label}</span>
            <span>{stats.last30Days[29]?.label}</span>
          </div>
        </div>

        {/* Top Words */}
        {stats.topWords.length > 0 && (
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', color: 'var(--color-gold)' }}>
              🔤 أكثر الكلمات تكراراً
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.topWords.map((item, i) => {
                const maxCount = stats.topWords[0]?.count || 1;
                const opacity = 0.4 + (item.count / maxCount) * 0.6;
                const size = 0.78 + (item.count / maxCount) * 0.4;
                return (
                  <span
                    key={i}
                    className="tag"
                    style={{
                      opacity,
                      fontSize: `${size}rem`,
                      borderColor: `var(--color-primary)`,
                      background: `hsla(230, 80%, 60%, ${0.05 + (item.count / maxCount) * 0.15})`,
                    }}
                  >
                    {item.word}
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-text-muted)',
                      marginRight: '4px',
                      fontFamily: 'var(--font-latin)',
                    }}>
                      {item.count}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════
  // RENDER — TOOLS TAB
  // ═══════════════════════════════════════
  const renderTools = () => (
    <div>
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Export */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📤</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>تصدير البيانات</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: '1.7' }}>
            تصدير جميع البيانات والمهام كملف JSON للنسخ الاحتياطي أو النقل إلى جهاز آخر
          </p>
          <button className="btn btn-primary" onClick={handleExport}>
            💾 تصدير الكل
          </button>
        </div>

        {/* Import */}
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📥</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>استيراد البيانات</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: '1.7' }}>
            استيراد بيانات من ملف JSON سابق — يتم دمجها مع البيانات الحالية بدون تكرار
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button className="btn btn-gold" onClick={() => fileInputRef.current?.click()}>
            📂 اختر ملف JSON
          </button>
        </div>
      </div>

      {/* Import Message */}
      {importMessage && (
        <div
          className="glass-card"
          style={{
            padding: '14px 20px',
            marginBottom: '24px',
            borderRight: `3px solid ${importMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>
            {importMessage.type === 'success' ? '✅' : '❌'}
          </span>
          <span style={{
            color: importMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          }}>
            {importMessage.text}
          </span>
        </div>
      )}

      {/* Danger Zone */}
      <div
        className="glass-card"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.2)',
          background: 'rgba(239, 68, 68, 0.03)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--color-error)' }}>
          ⚠️ منطقة الخطر
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
          حذف جميع السجلات نهائياً من مركز البيانات (لا يشمل المهام)
        </p>
        {!confirmClear ? (
          <button
            className="btn btn-sm"
            style={{ background: 'var(--color-error)', color: 'white' }}
            onClick={() => setConfirmClear(true)}
          >
            🗑️ حذف جميع السجلات
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--color-error)', fontSize: '0.88rem' }}>
              هل أنت متأكد؟ لا يمكن التراجع!
            </span>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--color-error)', color: 'white' }}
              onClick={handleClearAll}
            >
              نعم، احذف الكل
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setConfirmClear(false)}
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Data Summary */}
      {stats && (
        <div className="glass-card" style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--color-gold)' }}>
            📋 ملخص التخزين
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'سجلات مركز البيانات', value: stats.totalEntries },
              { label: 'المهام (إدارة المهام)', value: stats.byType.task },
              { label: 'إجمالي الكلمات المخزنة', value: stats.totalWords.toLocaleString('ar-SA') },
              {
                label: 'حجم البيانات التقريبي',
                value: (() => {
                  try {
                    const size = new Blob([localStorage.getItem('publishing_data_hub') || '']).size;
                    return size > 1024 * 1024
                      ? `${(size / 1024 / 1024).toFixed(2)} MB`
                      : `${(size / 1024).toFixed(1)} KB`;
                  } catch { return 'غير معروف'; }
                })()
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem' }}>{item.label}</span>
                <span style={{ fontWeight: '600', fontFamily: 'var(--font-latin)', color: 'var(--color-text)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════
  return (
    <div>
      <div
        className="page-header"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s ease-out',
        }}
      >
        <h1>🧠 مركز البيانات</h1>
        <p>جميع بياناتك في مكان واحد — ابحث، حلل، واستكشف</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ maxWidth: '500px', marginBottom: '28px' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'feed' && renderFeed()}
      {activeTab === 'insights' && renderInsights()}
      {activeTab === 'tools' && renderTools()}
    </div>
  );
}
