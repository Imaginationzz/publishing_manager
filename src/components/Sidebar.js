'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/', label: 'الرئيسية', icon: '🏠', description: 'لوحة التحكم' },
  { href: '/pdf', label: 'تحويل PDF', icon: '📄', description: 'استخراج النص من الملفات' },
  { href: '/grammar', label: 'التدقيق اللغوي', icon: '✏️', description: 'فحص الأخطاء الإملائية' },
  { href: '/images', label: 'مولد الصور', icon: '🎨', description: 'تصميم الشعارات والأغلفة' },
  { href: '/books', label: 'بحث الكتب', icon: '📚', description: 'معلومات الكتب والمؤلفين' },
  { href: '/tasks', label: 'إدارة المهام', icon: '📋', description: 'تنظيم أعمال النشر' },
  { href: '/data-hub', label: 'مركز البيانات', icon: '🧠', description: 'تحليل وتلخيص البيانات' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <Link href="/" className={styles.logoLink}>
          <img src="/logo.png" alt="دار المازري" className={styles.logoImg} />
          {!isCollapsed && (
            <div className={styles.logoText}>
              <h1>دار المازري</h1>
              <span>Dar Mazri</span>
            </div>
          )}
        </Link>
      </div>

      {/* Toggle */}
      <button
        className={styles.toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
      >
        {isCollapsed ? '◁' : '▷'}
      </button>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={isCollapsed ? item.label : ''}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              {!isCollapsed && (
                <div className={styles.navContent}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navDescription}>{item.description}</span>
                </div>
              )}
              {isActive && <div className={styles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className={styles.bottomSection}>
          <div className={styles.versionBadge}>
            الإصدار 1.0
          </div>
        </div>
      )}
    </aside>
  );
}
