'use client';
import { useState, useEffect, useCallback } from 'react';

const COLUMNS = [
  { id: 'waiting', title: 'قيد الانتظار', icon: '⏳', color: 'var(--color-warning)' },
  { id: 'progress', title: 'قيد التنفيذ', icon: '🔄', color: 'var(--color-info)' },
  { id: 'done', title: 'مكتمل', icon: '✅', color: 'var(--color-success)' },
];

const CATEGORIES = [
  { value: 'editing', label: 'تحرير', color: '#6366f1' },
  { value: 'design', label: 'تصميم', color: '#8b5cf6' },
  { value: 'review', label: 'مراجعة', color: '#f59e0b' },
  { value: 'printing', label: 'طباعة', color: '#10b981' },
  { value: 'distribution', label: 'توزيع', color: '#3b82f6' },
  { value: 'translation', label: 'ترجمة', color: '#ec4899' },
  { value: 'other', label: 'أخرى', color: '#6b7280' },
];

const PRIORITIES = [
  { value: 'high', label: 'عالية', color: 'var(--color-error)' },
  { value: 'medium', label: 'متوسطة', color: 'var(--color-warning)' },
  { value: 'low', label: 'منخفضة', color: 'var(--color-success)' },
];

const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'editing',
    priority: 'medium',
    dueDate: '',
    assignee: '',
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('publishing_tasks');
      if (saved) setTasks(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('publishing_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  }, [tasks]);

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'editing', priority: 'medium', dueDate: '', assignee: '' });
    setEditingTask(null);
    setShowForm(false);
  };

  const saveTask = () => {
    if (!form.title.trim()) return;

    if (editingTask) {
      setTasks(prev => prev.map(t =>
        t.id === editingTask.id ? { ...t, ...form, updatedAt: new Date().toISOString() } : t
      ));
    } else {
      setTasks(prev => [...prev, {
        id: generateId(),
        ...form,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }]);
    }
    resetForm();
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const editTask = (task) => {
    setForm({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate || '',
      assignee: task.assignee || '',
    });
    setEditingTask(task);
    setShowForm(true);
  };

  // Drag & Drop
  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (columnId) => {
    if (!draggedTask) return;
    setTasks(prev => prev.map(t =>
      t.id === draggedTask.id ? { ...t, status: columnId, updatedAt: new Date().toISOString() } : t
    ));
    setDraggedTask(null);
  };

  const getColumnTasks = (columnId) => tasks.filter(t => t.status === columnId);

  const getCategoryInfo = (value) => CATEGORIES.find(c => c.value === value) || CATEGORIES[6];
  const getPriorityInfo = (value) => PRIORITIES.find(p => p.value === value) || PRIORITIES[1];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>📋 إدارة المهام</h1>
          <p>تنظيم ومتابعة مهام النشر بلوحة كانبان تفاعلية</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          ➕ مهمة جديدة
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '24px' }}>
        {COLUMNS.map(col => {
          const count = getColumnTasks(col.id).length;
          return (
            <div key={col.id} className="stat-card">
              <div className="stat-card-icon" style={{ background: `${col.color}20`, fontSize: '1.3rem' }}>
                {col.icon}
              </div>
              <div className="stat-card-info">
                <h3 style={{ color: col.color }}>{count}</h3>
                <p>{col.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '20px' }}>
              {editingTask ? '✏️ تعديل المهمة' : '➕ مهمة جديدة'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                className="input"
                placeholder="عنوان المهمة *"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="textarea"
                placeholder="وصف المهمة..."
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ minHeight: '80px' }}
              />
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>التصنيف</label>
                  <select className="select" value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>الأولوية</label>
                  <select className="select" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    className="input"
                    value={form.dueDate}
                    onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    style={{ direction: 'ltr' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>المسؤول</label>
                  <input
                    className="input"
                    placeholder="اسم المسؤول"
                    value={form.assignee}
                    onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-start' }}>
              <button className="btn btn-primary" onClick={saveTask}>
                {editingTask ? '💾 حفظ التعديلات' : '➕ إضافة المهمة'}
              </button>
              <button className="btn btn-secondary" onClick={resetForm}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', minHeight: '400px' }}>
        {COLUMNS.map(col => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(col.id)}
            style={{
              background: 'var(--color-surface)',
              border: `1px solid ${draggedTask ? col.color + '40' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              transition: 'border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${col.color}30` }}>
              <span style={{ fontSize: '1.2rem' }}>{col.icon}</span>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', flex: 1 }}>{col.title}</h3>
              <span className="badge" style={{ background: `${col.color}20`, color: col.color }}>
                {getColumnTasks(col.id).length}
              </span>
            </div>

            {/* Task Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {getColumnTasks(col.id).map(task => {
                const category = getCategoryInfo(task.category);
                const priority = getPriorityInfo(task.priority);
                const overdue = task.status !== 'done' && isOverdue(task.dueDate);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    style={{
                      background: 'var(--glass-bg)',
                      border: `1px solid ${overdue ? 'var(--color-error)30' : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                      cursor: 'grab',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--glass-bg)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Priority + Category Row */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          background: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        {category.label}
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.7rem',
                          background: `${priority.color}20`,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{task.title}</h4>

                    {/* Description */}
                    {task.description && (
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '8px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {task.description}
                      </p>
                    )}

                    {/* Meta Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {task.dueDate && (
                          <span style={{ color: overdue ? 'var(--color-error)' : 'inherit' }}>
                            📅 {formatDate(task.dueDate)}
                          </span>
                        )}
                        {task.assignee && <span>👤 {task.assignee}</span>}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => editTask(task)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '2px',
                            opacity: 0.6,
                          }}
                          title="تعديل"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '2px',
                            opacity: 0.6,
                          }}
                          title="حذف"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty Column */}
              {getColumnTasks(col.id).length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 16px',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  اسحب المهام إلى هنا
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
