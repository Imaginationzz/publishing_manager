import { Noto_Kufi_Arabic, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const notoKufi = Noto_Kufi_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-latin",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "دار المازري — مدير دار النشر",
  description: "تطبيق متكامل لإدارة مهام دار النشر — تحويل PDF، تدقيق لغوي، تصميم، وبحث عن الكتب",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${notoKufi.variable} ${inter.variable}`}>
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
            <footer className="app-footer">
              <img src="/logo.png" alt="دار المازري" width={32} height={32} />
              <span>صُنع بواسطة Yazid Rahmouni</span>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
