/**
 * مركز البيانات — Centralized Data Store
 * Manages all data entries from across the publishing manager modules.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'publishing_data_hub';

const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Get all entries from the data store
 */
export function getAllEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save all entries to localStorage
 */
function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save data hub entries:', e);
  }
}

/**
 * Add a new entry to the data store
 * @param {'pdf'|'grammar'|'image'|'book'|'task'} type - Module type
 * @param {string} title - Entry title
 * @param {string} content - Text content
 * @param {object} metadata - Module-specific metadata
 * @returns {object} The created entry
 */
export function addEntry(type, title, content = '', metadata = {}) {
  const entry = {
    id: generateId(),
    type,
    title,
    content,
    metadata,
    createdAt: new Date().toISOString(),
    wordCount: content ? content.trim().split(/\s+/).filter(Boolean).length : 0,
    charCount: content ? content.length : 0,
  };

  const entries = getAllEntries();
  entries.unshift(entry); // newest first
  saveEntries(entries);

  return entry;
}

/**
 * Delete an entry by ID
 */
export function deleteEntry(id) {
  const entries = getAllEntries().filter(e => e.id !== id);
  saveEntries(entries);
}

/**
 * Clear all entries
 */
export function clearAllEntries() {
  saveEntries([]);
}

/**
 * Search entries by query string (searches title + content)
 */
export function searchEntries(query) {
  if (!query.trim()) return getAllEntries();
  const q = query.toLowerCase();
  return getAllEntries().filter(entry =>
    entry.title.toLowerCase().includes(q) ||
    entry.content.toLowerCase().includes(q) ||
    (entry.metadata?.author && entry.metadata.author.toLowerCase().includes(q))
  );
}

/**
 * Filter entries by type
 */
export function filterByType(type) {
  if (!type || type === 'all') return getAllEntries();
  return getAllEntries().filter(e => e.type === type);
}

/**
 * Get comprehensive statistics
 */
export function getStats() {
  const entries = getAllEntries();
  const tasks = getTasksFromStorage();

  const byType = { pdf: 0, grammar: 0, image: 0, book: 0, task: 0 };
  let totalWords = 0;
  let totalChars = 0;
  const byDay = {};
  const byMonth = {};

  entries.forEach(entry => {
    if (byType[entry.type] !== undefined) byType[entry.type]++;
    totalWords += entry.wordCount || 0;
    totalChars += entry.charCount || 0;

    // Activity by day
    const day = entry.createdAt?.split('T')[0];
    if (day) {
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // Activity by month
    const month = entry.createdAt?.substring(0, 7);
    if (month) {
      byMonth[month] = (byMonth[month] || 0) + 1;
    }
  });

  // Task stats
  byType.task = tasks.length;
  const tasksByStatus = { waiting: 0, progress: 0, done: 0 };
  tasks.forEach(t => {
    if (tasksByStatus[t.status] !== undefined) tasksByStatus[t.status]++;
  });

  // Most productive day
  let mostProductiveDay = null;
  let maxDayCount = 0;
  Object.entries(byDay).forEach(([day, count]) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostProductiveDay = day;
    }
  });

  // Average word count
  const textEntries = entries.filter(e => e.wordCount > 0);
  const avgWordCount = textEntries.length > 0
    ? Math.round(totalWords / textEntries.length)
    : 0;

  // Reading time estimate (avg 200 words/min for Arabic)
  const totalReadingMinutes = Math.ceil(totalWords / 200);

  // Word frequency analysis (top 20)
  const wordFreq = {};
  const stopWords = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'هو', 'هي', 'أن', 'لا', 'ما', 'كان', 'قد', 'أو', 'و', 'ف', 'ب', 'ل', 'ك', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'not', 'with', 'this', 'that']);
  entries.forEach(entry => {
    if (!entry.content) return;
    const words = entry.content.split(/\s+/).filter(Boolean);
    words.forEach(word => {
      const clean = word.replace(/[^\u0600-\u06FFa-zA-Z]/g, '').toLowerCase();
      if (clean.length > 2 && !stopWords.has(clean)) {
        wordFreq[clean] = (wordFreq[clean] || 0) + 1;
      }
    });
  });

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  // Last 30 days activity
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    last30Days.push({
      date: dayStr,
      count: byDay[dayStr] || 0,
      label: d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' }),
    });
  }

  // Max count in last 30 days for chart scaling
  const maxActivityCount = Math.max(1, ...last30Days.map(d => d.count));

  return {
    totalEntries: entries.length,
    totalWords,
    totalChars,
    totalReadingMinutes,
    avgWordCount,
    byType,
    byDay,
    byMonth,
    mostProductiveDay,
    maxDayCount,
    tasksByStatus,
    topWords,
    last30Days,
    maxActivityCount,
  };
}

/**
 * Get tasks from the tasks module's localStorage
 */
function getTasksFromStorage() {
  try {
    const data = localStorage.getItem('publishing_tasks');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Export all data as a JSON object
 */
export function exportAllData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    entries: getAllEntries(),
    tasks: getTasksFromStorage(),
  };
}

/**
 * Import data from a JSON object
 */
export function importData(data) {
  if (!data || !data.entries || !Array.isArray(data.entries)) {
    throw new Error('Invalid data format');
  }

  const existing = getAllEntries();
  const existingIds = new Set(existing.map(e => e.id));

  // Merge — don't duplicate
  const newEntries = data.entries.filter(e => !existingIds.has(e.id));
  const merged = [...newEntries, ...existing];
  saveEntries(merged);

  // Import tasks if present
  if (data.tasks && Array.isArray(data.tasks)) {
    try {
      const existingTasks = getTasksFromStorage();
      const existingTaskIds = new Set(existingTasks.map(t => t.id));
      const newTasks = data.tasks.filter(t => !existingTaskIds.has(t.id));
      const mergedTasks = [...newTasks, ...existingTasks];
      localStorage.setItem('publishing_tasks', JSON.stringify(mergedTasks));
    } catch (e) {
      console.error('Failed to import tasks:', e);
    }
  }

  return { importedEntries: newEntries.length };
}

/**
 * Get type display info
 */
export function getTypeInfo(type) {
  const types = {
    pdf: { label: 'PDF', icon: '📄', color: 'var(--color-primary)', labelAr: 'ملف PDF' },
    grammar: { label: 'تدقيق', icon: '✏️', color: 'var(--color-success)', labelAr: 'تدقيق لغوي' },
    image: { label: 'تصميم', icon: '🎨', color: 'var(--color-accent)', labelAr: 'تصميم' },
    book: { label: 'كتاب', icon: '📚', color: 'var(--color-gold)', labelAr: 'بحث كتب' },
    task: { label: 'مهمة', icon: '📋', color: 'var(--color-info)', labelAr: 'مهمة' },
  };
  return types[type] || { label: type, icon: '📎', color: 'var(--color-text-muted)', labelAr: type };
}
