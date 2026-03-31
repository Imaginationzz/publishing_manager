'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const modules = [
  {
    href: '/pdf',
    icon: '📄',
    title: 'تحويل PDF إلى نص',
    description: 'استخراج النصوص العربية من ملفات PDF بدقة عالية مع دعم الترتيب من اليمين لليسار',
    color: 'var(--color-primary)',
    glow: 'var(--color-primary-glow)',
    gradient: 'linear-gradient(135deg, hsla(230, 80%, 60%, 0.15), hsla(230, 80%, 60%, 0.05))',
  },
  {
    href: '/grammar',
    icon: '✏️',
    title: 'التدقيق اللغوي',
    description: 'فحص الأخطاء الإملائية والنحوية في النصوص العربية مع اقتراحات التصحيح',
    color: 'var(--color-success)',
    glow: 'hsla(150, 60%, 45%, 0.2)',
    gradient: 'linear-gradient(135deg, hsla(150, 60%, 45%, 0.15), hsla(150, 60%, 45%, 0.05))',
  },
  {
    href: '/images',
    icon: '🎨',
    title: 'مولّد الصور والشعارات',
    description: 'تصميم شعارات وأغلفة الكتب بأدوات احترافية مع دعم النصوص العربية',
    color: 'var(--color-accent)',
    glow: 'var(--color-accent-glow)',
    gradient: 'linear-gradient(135deg, hsla(280, 70%, 55%, 0.15), hsla(280, 70%, 55%, 0.05))',
  },
  {
    href: '/books',
    icon: '📚',
    title: 'بحث الكتب والمؤلفين',
    description: 'البحث عن معلومات الكتب والمؤلفين من قواعد بيانات عالمية',
    color: 'var(--color-gold)',
    glow: 'var(--color-gold-glow)',
    gradient: 'linear-gradient(135deg, hsla(42, 85%, 55%, 0.15), hsla(42, 85%, 55%, 0.05))',
  },
  {
    href: '/tasks',
    icon: '📋',
    title: 'إدارة المهام',
    description: 'تنظيم ومتابعة مهام النشر من التحرير إلى التوزيع بلوحة كانبان',
    color: 'var(--color-info)',
    glow: 'hsla(200, 70%, 55%, 0.2)',
    gradient: 'linear-gradient(135deg, hsla(200, 70%, 55%, 0.15), hsla(200, 70%, 55%, 0.05))',
  },
];

const quickStats = [
  { label: 'ملفات محولة', value: '0', icon: '📄', color: 'var(--color-primary)' },
  { label: 'نصوص مدققة', value: '0', icon: '✏️', color: 'var(--color-success)' },
  { label: 'صور مصممة', value: '0', icon: '🎨', color: 'var(--color-accent)' },
  { label: 'كتب محفوظة', value: '0', icon: '📚', color: 'var(--color-gold)' },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08), rgba(218, 165, 32, 0.06))',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 36px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, hsla(42, 85%, 55%, 0.08), transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <img
            src="/logo.png"
            alt="دار المازري"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              objectFit: 'cover',
              boxShadow: '0 0 30px var(--color-gold-glow)',
            }}
          />
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--color-text), var(--color-gold-light))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: '6px',
                lineHeight: '1.4',
              }}
            >
              أهلا بك في دار المازري للنشر
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
              منصتك المتكاملة لإدارة مهام دار النشر — من استخراج النصوص إلى التصميم والتوزيع
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        className="grid-4"
        style={{
          marginBottom: '32px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease-out 0.1s',
        }}
      >
        {quickStats.map((stat, i) => (
          <div className="stat-card" key={i}>
            <div
              className="stat-card-icon"
              style={{
                background: `${stat.color}20`,
                fontSize: '1.5rem',
              }}
            >
              {stat.icon}
            </div>
            <div className="stat-card-info">
              <h3 style={{ color: stat.color }}>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '600', color: 'var(--color-text)' }}>
          الأدوات المتاحة
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {modules.map((mod, index) => (
          <Link
            key={mod.href}
            href={mod.href}
            style={{
              background: mod.gradient,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-lg)',
              padding: '28px 24px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transitionDelay: `${0.15 + index * 0.08}s`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 8px 32px ${mod.glow}`;
              e.currentTarget.style.borderColor = `${mod.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                left: '-50px',
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle, ${mod.glow}, transparent 70%)`,
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  marginBottom: '16px',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                {mod.icon}
              </div>
              <h3
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--color-text)',
                }}
              >
                {mod.title}
              </h3>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.7',
                }}
              >
                {mod.description}
              </p>
              <div
                style={{
                  marginTop: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  color: mod.color,
                  fontWeight: '500',
                }}
              >
                افتح الأداة ←
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
